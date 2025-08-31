import fetch from 'node-fetch';
export class RSSValidator {
    static cache = new Map();
    static CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    static TIMEOUT = 5000; // 5 seconds
    /**
     * Validate if a RSS feed URL is accessible and returns valid content
     */
    static async validate(feedUrl) {
        // Check cache first
        const cached = this.cache.get(feedUrl);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.result;
        }
        const result = {
            performed: true,
            isValid: false,
            statusCode: null,
            error: null
        };
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);
            const response = await fetch(feedUrl, {
                method: 'HEAD',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; YouTube RSS Generator/1.0)'
                }
            });
            clearTimeout(timeoutId);
            result.statusCode = response.status;
            if (response.status === 200) {
                // Check content type
                const contentType = response.headers.get('content-type');
                if (contentType && (contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom'))) {
                    result.isValid = true;
                }
                else {
                    result.error = `Invalid content type: ${contentType}`;
                }
            }
            else if (response.status === 404) {
                result.error = 'Feed not found';
            }
            else if (response.status === 403) {
                result.error = 'Access forbidden';
            }
            else {
                result.error = `HTTP ${response.status}`;
            }
        }
        catch (error) {
            if (error.name === 'AbortError') {
                result.error = 'Request timeout';
            }
            else if (error.code === 'ENOTFOUND') {
                result.error = 'DNS lookup failed';
            }
            else if (error.code === 'ECONNREFUSED') {
                result.error = 'Connection refused';
            }
            else {
                result.error = error.message || 'Unknown error';
            }
        }
        // Cache the result
        this.cache.set(feedUrl, { result, timestamp: Date.now() });
        // Clean old cache entries
        this.cleanCache();
        return result;
    }
    /**
     * Clear the validation cache
     */
    static clearCache() {
        this.cache.clear();
    }
    /**
     * Clean expired cache entries
     */
    static cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.CACHE_TTL) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Perform a quick validation without caching
     */
    static async quickCheck(feedUrl) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(feedUrl, {
                method: 'HEAD',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; YouTube RSS Generator/1.0)'
                }
            });
            clearTimeout(timeoutId);
            return response.status === 200;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=validator.js.map