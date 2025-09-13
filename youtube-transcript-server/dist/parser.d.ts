export declare class YouTubeParser {
    /**
     * Extract video ID from various YouTube URL formats
     */
    static extractVideoId(url: string): string | null;
    /**
     * Clean and normalize a YouTube URL
     */
    static normalizeUrl(videoId: string): string;
    /**
     * Validate if a string is a valid YouTube video ID
     */
    static isValidVideoId(videoId: string): boolean;
    /**
     * Parse a URL and extract video information
     */
    static parse(input: string): {
        videoId: string | null;
        normalized: string | null;
        isValid: boolean;
    };
}
//# sourceMappingURL=parser.d.ts.map