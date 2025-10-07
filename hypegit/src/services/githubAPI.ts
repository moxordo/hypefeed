/**
 * GitHub API Service
 * Handles GitHub REST API requests with rate limiting and error handling
 */

import type { GitHubRepository } from '../types/bindings';
import { GitHubAPIError } from '../types/bindings';

export class GitHubAPIService {
  private token: string;
  private baseURL = 'https://api.github.com';
  private rateLimitRemaining: number = 5000;
  private rateLimitReset: number = 0;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Get repository details from GitHub API
   */
  async getRepoDetails(owner: string, name: string): Promise<GitHubRepository> {
    const url = `${this.baseURL}/repos/${owner}/${name}`;

    try {
      const response = await this.fetchWithRateLimit(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new GitHubAPIError(`Repository ${owner}/${name} not found`, 404);
        }
        throw new GitHubAPIError(
          `GitHub API error: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json() as GitHubRepository;
      return data;

    } catch (error) {
      if (error instanceof GitHubAPIError) throw error;
      throw new GitHubAPIError(
        `Failed to fetch repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Batch fetch multiple repositories
   */
  async batchGetRepos(repos: Array<{ owner: string, name: string }>): Promise<Map<string, GitHubRepository>> {
    const results = new Map<string, GitHubRepository>();

    // Process in parallel with concurrency limit of 10
    const batchSize = 10;
    for (let i = 0; i < repos.length; i += batchSize) {
      const batch = repos.slice(i, i + batchSize);
      const promises = batch.map(async ({ owner, name }) => {
        try {
          const repo = await this.getRepoDetails(owner, name);
          results.set(`${owner}/${name}`, repo);
        } catch (error) {
          console.error(`Failed to fetch ${owner}/${name}:`, error);
          // Continue with other repos
        }
      });

      await Promise.all(promises);

      // Small delay between batches to respect rate limits
      if (i + batchSize < repos.length) {
        await this.sleep(100);
      }
    }

    return results;
  }

  /**
   * Get current rate limit status
   */
  async getRateLimit(): Promise<{
    limit: number;
    remaining: number;
    reset: number;
    resetDate: Date;
  }> {
    const url = `${this.baseURL}/rate_limit`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'HypeGit/1.0'
        }
      });

      if (!response.ok) {
        throw new GitHubAPIError(`Failed to get rate limit: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const coreRate = data.resources.core;

      return {
        limit: coreRate.limit,
        remaining: coreRate.remaining,
        reset: coreRate.reset,
        resetDate: new Date(coreRate.reset * 1000)
      };

    } catch (error) {
      throw new GitHubAPIError(
        `Failed to check rate limit: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch with automatic rate limit handling
   */
  private async fetchWithRateLimit(url: string): Promise<Response> {
    // Check if we're close to rate limit
    if (this.rateLimitRemaining < 100 && Date.now() < this.rateLimitReset * 1000) {
      const waitTime = (this.rateLimitReset * 1000) - Date.now();
      console.warn(`Rate limit low (${this.rateLimitRemaining}), waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'HypeGit/1.0'
      }
    });

    // Update rate limit from headers
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (remaining) this.rateLimitRemaining = parseInt(remaining, 10);
    if (reset) this.rateLimitReset = parseInt(reset, 10);

    return response;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
