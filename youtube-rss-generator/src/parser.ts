import { ParsedYouTubeURL, FeedType, SourceType } from './types.js';

export class YouTubeURLParser {
  private static readonly CHANNEL_ID_REGEX = /^UC[\w-]{22}$/;
  private static readonly PLAYLIST_ID_REGEX = /^(PL|UU|LL|RD|OL)[\w-]{32,}$/;
  private static readonly VIDEO_ID_REGEX = /^[\w-]{11}$/;

  /**
   * Parse a YouTube URL and extract relevant information
   */
  static parse(url: string): ParsedYouTubeURL {
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

    } catch (error) {
      // Invalid URL
    }

    return this.createResult(null, 'video', null, originalUrl, normalizedUrl);
  }

  /**
   * Normalize a URL to ensure it has a protocol and proper format
   */
  private static normalizeUrl(url: string): string {
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
  private static createResult(
    type: FeedType | null,
    sourceType: SourceType,
    id: string | null,
    originalUrl: string,
    normalizedUrl: string
  ): ParsedYouTubeURL {
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
  static generateRSSUrl(parsed: ParsedYouTubeURL): string | null {
    if (!parsed.id) {
      return null;
    }

    const baseUrl = 'https://www.youtube.com/feeds/videos.xml';

    switch (parsed.type) {
      case 'channel':
        if (parsed.sourceType === 'channel_id') {
          return `${baseUrl}?channel_id=${parsed.id}`;
        }
        // For handles and custom names, we need to resolve to channel ID
        // This would require an API call or web scraping
        // For now, return null as we can't generate directly
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
        return `${baseUrl}?playlist_id=${parsed.id}`;

      default:
        return null;
    }
  }
}