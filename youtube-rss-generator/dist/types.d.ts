export type FeedType = 'channel' | 'user' | 'playlist';
export type SourceType = 'channel_id' | 'handle' | 'custom_name' | 'username' | 'playlist_id' | 'video_in_playlist' | 'video' | 'short' | 'live';
export interface ParsedYouTubeURL {
    type: FeedType | null;
    sourceType: SourceType;
    id: string | null;
    playlistId?: string;
    originalUrl: string;
    normalizedUrl: string;
}
export interface ValidationResult {
    performed: boolean;
    isValid: boolean;
    statusCode: number | null;
    error: string | null;
}
export interface RSSFeedResult {
    success: boolean;
    feedUrl: string | null;
    feedType: FeedType | null;
    sourceType: SourceType;
    extractedId: string | null;
    validation: ValidationResult;
    metadata: {
        originalUrl: string;
        normalizedUrl: string;
    };
}
export interface BatchResult {
    results: RSSFeedResult[];
    totalProcessed: number;
    successCount: number;
    failureCount: number;
}
//# sourceMappingURL=types.d.ts.map