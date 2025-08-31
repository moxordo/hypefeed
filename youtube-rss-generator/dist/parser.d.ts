import { ParsedYouTubeURL } from './types.js';
export declare class YouTubeURLParser {
    private static readonly CHANNEL_ID_REGEX;
    private static readonly PLAYLIST_ID_REGEX;
    private static readonly VIDEO_ID_REGEX;
    /**
     * Parse a YouTube URL and extract relevant information
     */
    static parse(url: string): ParsedYouTubeURL;
    /**
     * Normalize a URL to ensure it has a protocol and proper format
     */
    private static normalizeUrl;
    /**
     * Create a ParsedYouTubeURL result
     */
    private static createResult;
    /**
     * Generate RSS feed URL from parsed YouTube URL
     */
    static generateRSSUrl(parsed: ParsedYouTubeURL): string | null;
}
//# sourceMappingURL=parser.d.ts.map