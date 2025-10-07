/**
 * GitHub Trending Scraper Service
 * Scrapes GitHub trending pages and extracts repository data
 */

import type { TrendingRepo } from '../types/bindings';
import { ScraperError } from '../types/bindings';
import { parseTrendingHTML } from '../utils/parser';

export class TrendingScraperService {
  private baseURL = 'https://github.com/trending';

  /**
   * Scrape GitHub trending page
   */
  async scrapeTrending(
    timeRange: 'daily' | 'weekly' | 'monthly',
    language?: string
  ): Promise<{ repos: TrendingRepo[], html: string }> {
    try {
      const url = this.buildTrendingURL(timeRange, language);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HypeGit/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (!response.ok) {
        throw new ScraperError(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Parse repositories from HTML
      const repos = parseTrendingHTML(html);

      console.log(`Scraped ${repos.length} repos from trending (${timeRange}/${language || 'all'})`);

      return { repos, html };

    } catch (error) {
      if (error instanceof ScraperError) throw error;
      throw new ScraperError(
        `Failed to scrape trending: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Scrape all trending variants (ranges × languages)
   */
  async scrapeAllVariants(): Promise<Map<string, { repos: TrendingRepo[], html: string }>> {
    const languages = ['typescript', 'python', 'go', 'rust', 'javascript', null];
    const ranges: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];

    const results = new Map<string, { repos: TrendingRepo[], html: string }>();

    for (const range of ranges) {
      for (const language of languages) {
        try {
          const result = await this.scrapeTrending(range, language || undefined);
          const key = this.getVariantKey(range, language);
          results.set(key, result);

          // Small delay between requests to be polite
          await this.sleep(500);

        } catch (error) {
          console.error(`Failed to scrape ${range}/${language || 'all'}:`, error);
          // Continue with next variant
        }
      }
    }

    return results;
  }

  /**
   * Build trending URL
   */
  private buildTrendingURL(timeRange: string, language?: string): string {
    let url = this.baseURL;

    if (language) {
      url += `/${language}`;
    }

    url += `?since=${timeRange}`;

    return url;
  }

  /**
   * Get variant key for storage
   */
  private getVariantKey(timeRange: string, language: string | null): string {
    return `${timeRange}-${language || 'all'}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
