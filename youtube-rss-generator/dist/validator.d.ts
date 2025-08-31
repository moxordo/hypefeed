import { ValidationResult } from './types.js';
export declare class RSSValidator {
    private static cache;
    private static readonly CACHE_TTL;
    private static readonly TIMEOUT;
    /**
     * Validate if a RSS feed URL is accessible and returns valid content
     */
    static validate(feedUrl: string): Promise<ValidationResult>;
    /**
     * Clear the validation cache
     */
    static clearCache(): void;
    /**
     * Clean expired cache entries
     */
    private static cleanCache;
    /**
     * Perform a quick validation without caching
     */
    static quickCheck(feedUrl: string): Promise<boolean>;
}
//# sourceMappingURL=validator.d.ts.map