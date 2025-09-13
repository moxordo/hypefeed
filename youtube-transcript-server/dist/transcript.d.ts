import { TranscriptOptions, TranscriptResult } from './types.js';
export declare class YouTubeTranscript {
    private static readonly USER_AGENT;
    /**
     * Fetch YouTube video page and extract caption tracks
     */
    private static fetchVideoInfo;
    /**
     * Extract caption track URLs from YouTube HTML
     */
    private static extractCaptionTracks;
    /**
     * Fetch and parse transcript from caption URL
     */
    private static fetchTranscript;
    /**
     * Parse YouTube transcript XML format
     */
    private static parseTranscriptXML;
    /**
     * Find the best matching caption track for the requested language
     */
    private static findBestTrack;
    /**
     * Format transcript based on options
     */
    private static formatTranscript;
    /**
     * Format seconds to MM:SS
     */
    private static formatTime;
    /**
     * Format seconds to SRT time format (HH:MM:SS,mmm)
     */
    private static formatSRTTime;
    /**
     * Main public method to retrieve transcript
     */
    static retrieve(videoId: string, options?: TranscriptOptions): Promise<TranscriptResult>;
}
//# sourceMappingURL=transcript.d.ts.map