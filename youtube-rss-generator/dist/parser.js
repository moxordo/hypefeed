import https from 'https';
import http from 'http';
export class YouTubeURLParser {
    static CHANNEL_ID_REGEX = /^UC[\w-]{22}$/;
    static PLAYLIST_ID_REGEX = /^(PL|UU|LL|RD|OL)[\w-]{32,}$/;
    static VIDEO_ID_REGEX = /^[\w-]{11}$/;
    /**
     * Parse a YouTube URL and extract relevant information
     */
    static parse(url) {
        const originalUrl = url;
        let normalizedUrl = this.normalizeUrl(url);
        try {
            const urlObj = new URL(normalizedUrl);
            const pathname = urlObj.pathname;
            const searchParams = urlObj.searchParams;
            // Check for playlist parameter first (works with any URL)
            const playlistId = searchParams.get('list');
            if (playlistId && this.PLAYLIST_ID_REGEX.test(playlistId)) {
                return this.createResult('playlist', 'playlist_id', playlistId, originalUrl, normalizedUrl);
            }
            // Handle different path patterns
            if (pathname.startsWith('/channel/')) {
                const channelId = pathname.split('/')[2];
                if (this.CHANNEL_ID_REGEX.test(channelId)) {
                    return this.createResult('channel', 'channel_id', channelId, originalUrl, normalizedUrl);
                }
            }
            if (pathname.startsWith('/@')) {
                const handle = pathname.slice(2).split('/')[0];
                return this.createResult('channel', 'handle', handle, originalUrl, normalizedUrl);
            }
            if (pathname.startsWith('/c/')) {
                const customName = pathname.split('/')[2];
                return this.createResult('channel', 'custom_name', customName, originalUrl, normalizedUrl);
            }
            if (pathname.startsWith('/user/')) {
                const username = pathname.split('/')[2];
                return this.createResult('user', 'username', username, originalUrl, normalizedUrl);
            }
            if (pathname.startsWith('/watch')) {
                const videoId = searchParams.get('v');
                if (videoId && this.VIDEO_ID_REGEX.test(videoId)) {
                    // Check if it's part of a playlist
                    if (playlistId) {
                        return this.createResult('playlist', 'video_in_playlist', playlistId, originalUrl, normalizedUrl);
                    }
                    return this.createResult(null, 'video', videoId, originalUrl, normalizedUrl);
                }
            }
            if (pathname.startsWith('/shorts/')) {
                const shortId = pathname.split('/')[2];
                if (this.VIDEO_ID_REGEX.test(shortId)) {
                    return this.createResult(null, 'short', shortId, originalUrl, normalizedUrl);
                }
            }
            if (pathname.startsWith('/live/')) {
                const liveId = pathname.split('/')[2];
                if (this.VIDEO_ID_REGEX.test(liveId)) {
                    return this.createResult(null, 'live', liveId, originalUrl, normalizedUrl);
                }
            }
            if (pathname.startsWith('/embed/')) {
                const videoId = pathname.split('/')[2];
                if (this.VIDEO_ID_REGEX.test(videoId)) {
                    return this.createResult(null, 'video', videoId, originalUrl, normalizedUrl);
                }
            }
            if (pathname.startsWith('/playlist')) {
                const playlistParam = searchParams.get('list');
                if (playlistParam && this.PLAYLIST_ID_REGEX.test(playlistParam)) {
                    return this.createResult('playlist', 'playlist_id', playlistParam, originalUrl, normalizedUrl);
                }
            }
            // Handle youtu.be short URLs
            if (urlObj.hostname === 'youtu.be') {
                const videoId = pathname.slice(1).split('?')[0];
                if (this.VIDEO_ID_REGEX.test(videoId)) {
                    const listParam = searchParams.get('list');
                    if (listParam && this.PLAYLIST_ID_REGEX.test(listParam)) {
                        return this.createResult('playlist', 'video_in_playlist', listParam, originalUrl, normalizedUrl);
                    }
                    return this.createResult(null, 'video', videoId, originalUrl, normalizedUrl);
                }
            }
            // Handle custom channel URLs (youtube.com/[CUSTOM_NAME])
            if (pathname.length > 1 && !pathname.includes('/') && pathname !== '/') {
                const customName = pathname.slice(1);
                if (customName && !customName.includes('.')) {
                    return this.createResult('channel', 'custom_name', customName, originalUrl, normalizedUrl);
                }
            }
            // If the path has a single segment, it might be a custom channel name
            const pathSegments = pathname.split('/').filter(s => s);
            if (pathSegments.length === 1 && !pathSegments[0].includes('.')) {
                return this.createResult('channel', 'custom_name', pathSegments[0], originalUrl, normalizedUrl);
            }
        }
        catch (error) {
            // Invalid URL
        }
        return this.createResult(null, 'video', null, originalUrl, normalizedUrl);
    }
    /**
     * Normalize a URL to ensure it has a protocol and proper format
     */
    static normalizeUrl(url) {
        let normalized = url.trim();
        // Add protocol if missing
        if (!normalized.match(/^https?:\/\//i)) {
            normalized = 'https://' + normalized;
        }
        // Handle mobile URLs
        normalized = normalized.replace(/m\.youtube\.com/i, 'www.youtube.com');
        // Handle various YouTube TLDs
        normalized = normalized.replace(/youtube\.[a-z]{2,}/i, 'youtube.com');
        // Ensure www prefix for youtube.com
        normalized = normalized.replace(/https:\/\/youtube\.com/i, 'https://www.youtube.com');
        return normalized;
    }
    /**
     * Create a ParsedYouTubeURL result
     */
    static createResult(type, sourceType, id, originalUrl, normalizedUrl) {
        return {
            type,
            sourceType,
            id,
            originalUrl,
            normalizedUrl
        };
    }
    /**
     * Generate RSS feed URL from parsed YouTube URL
     */
    static async generateRSSUrl(parsed) {
        if (!parsed.id) {
            return null;
        }
        const baseUrl = 'https://www.youtube.com/feeds/videos.xml';
        switch (parsed.type) {
            case 'channel':
                if (parsed.sourceType === 'channel_id') {
                    return `${baseUrl}?channel_id=${parsed.id}`;
                }
                // For handles and custom names, try to resolve to channel ID
                const resolvedChannelId = await this.resolveChannelId(parsed);
                if (resolvedChannelId) {
                    return `${baseUrl}?channel_id=${resolvedChannelId}`;
                }
                return null;
            case 'user':
                return `${baseUrl}?user=${parsed.id}`;
            case 'playlist':
                // Convert playlist ID if it starts with UU (uploads playlist)
                if (parsed.id.startsWith('UU')) {
                    // UU playlists are uploads, convert to channel feed
                    const channelId = 'UC' + parsed.id.slice(2);
                    return `${baseUrl}?channel_id=${channelId}`;
                }
                // For other playlists, try to get the channel that owns it
                const playlistChannelId = await this.getChannelFromPlaylist(parsed.id);
                if (playlistChannelId) {
                    return `${baseUrl}?channel_id=${playlistChannelId}`;
                }
                // Fall back to playlist RSS if we can't get the channel
                return `${baseUrl}?playlist_id=${parsed.id}`;
            default:
                // For videos, shorts, and live streams, extract the channel
                if (parsed.sourceType === 'video' || parsed.sourceType === 'short' || parsed.sourceType === 'live') {
                    const videoChannelId = await this.getChannelFromVideo(parsed.id);
                    if (videoChannelId) {
                        return `${baseUrl}?channel_id=${videoChannelId}`;
                    }
                }
                return null;
        }
    }
    /**
     * Extract channel ID from a video page
     */
    static async getChannelFromVideo(videoId) {
        if (!videoId)
            return null;
        try {
            const html = await this.fetchPage(`https://www.youtube.com/watch?v=${videoId}`);
            // Look for channel ID in various places
            // Pattern 1: "channelId":"UC..."
            const channelIdMatch = html.match(/"channelId"\s*:\s*"(UC[\w-]{22})"/);
            ;
            if (channelIdMatch) {
                return channelIdMatch[1];
            }
            // Pattern 2: /channel/UC... in links
            const channelLinkMatch = html.match(/\/channel\/(UC[\w-]{22})/);
            if (channelLinkMatch) {
                return channelLinkMatch[1];
            }
            // Pattern 3: browseId for channel
            const browseIdMatch = html.match(/"browseId"\s*:\s*"(UC[\w-]{22})"/);
            if (browseIdMatch) {
                return browseIdMatch[1];
            }
        }
        catch (error) {
            // Failed to fetch or parse
        }
        return null;
    }
    /**
     * Extract channel ID from a playlist page
     */
    static async getChannelFromPlaylist(playlistId) {
        if (!playlistId)
            return null;
        try {
            const html = await this.fetchPage(`https://www.youtube.com/playlist?list=${playlistId}`);
            // Look for the channel that created the playlist
            // Pattern 1: "ownerText":{..."url":"/channel/UC..."
            const ownerMatch = html.match(/"ownerText"[^}]*\/channel\/(UC[\w-]{22})/);
            if (ownerMatch) {
                return ownerMatch[1];
            }
            // Pattern 2: videoOwnerRenderer with channelId
            const videoOwnerMatch = html.match(/"videoOwnerRenderer"[^}]*"channelId"\s*:\s*"(UC[\w-]{22})"/);
            if (videoOwnerMatch) {
                return videoOwnerMatch[1];
            }
        }
        catch (error) {
            // Failed to fetch or parse
        }
        return null;
    }
    /**
     * Try to resolve a handle or custom name to a channel ID
     */
    static async resolveChannelId(parsed) {
        if (parsed.sourceType === 'handle' || parsed.sourceType === 'custom_name') {
            try {
                const url = parsed.sourceType === 'handle'
                    ? `https://www.youtube.com/@${parsed.id}`
                    : `https://www.youtube.com/c/${parsed.id}`;
                const html = await this.fetchPage(url);
                // Look for channel ID in the page
                const channelIdMatch = html.match(/"channelId"\s*:\s*"(UC[\w-]{22})"/);
                if (channelIdMatch) {
                    return channelIdMatch[1];
                }
                // Alternative pattern
                const browseIdMatch = html.match(/"browseId"\s*:\s*"(UC[\w-]{22})"/);
                if (browseIdMatch) {
                    return browseIdMatch[1];
                }
            }
            catch (error) {
                // Failed to resolve
            }
        }
        return null;
    }
    /**
     * Fetch a web page
     */
    static fetchPage(url) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                },
                timeout: 10000
            };
            const req = client.get(url, options, (res) => {
                if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                    reject(new Error(`HTTP ${res.statusCode}`));
                    return;
                }
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }
}
//# sourceMappingURL=parser.js.map