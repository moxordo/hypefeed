/**
 * API route handlers
 */

import { Hono } from 'hono';
import type { Env, ExecutionContext } from '../types/bindings';
import { RepositoryService } from '../services/repositoryService';
import { handleManualRefresh } from './cron';
import { requireAuth } from '../middleware/auth';

/**
 * Create API route handlers
 */
export function createAPIHandlers() {
  const app = new Hono<{ Bindings: Env }>();

  /**
   * GET /api/repos - List repositories
   * Query params:
   *  - limit: number (default: 50, max: 100)
   *  - active_only: boolean (default: true)
   */
  app.get('/repos', async (c) => {
    try {
      const repoService = new RepositoryService(c.env);

      const limit = Math.min(
        parseInt(c.req.query('limit') || '50'),
        100
      );

      const activeOnly = c.req.query('active_only') !== 'false';

      const repos = activeOnly
        ? await repoService.getActiveRepositories(limit)
        : await repoService.getAllRepositories(limit);

      return c.json({
        repos,
        count: repos.length,
        limit
      });

    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * GET /api/repos/:owner/:name - Get repository details
   */
  app.get('/repos/:owner/:name', async (c) => {
    try {
      const owner = c.req.param('owner');
      const name = c.req.param('name');
      const repoId = `${owner}/${name}`;

      const repoService = new RepositoryService(c.env);
      const repo = await repoService.getRepository(repoId);

      if (!repo) {
        return c.json({ error: 'Repository not found' }, 404);
      }

      return c.json({ repo });

    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * GET /api/repos/:owner/:name/trending - Get trending history for a repo
   * Query params:
   *  - limit: number (default: 30)
   */
  app.get('/repos/:owner/:name/trending', async (c) => {
    try {
      const owner = c.req.param('owner');
      const name = c.req.param('name');
      const repoId = `${owner}/${name}`;
      const limit = Math.min(
        parseInt(c.req.query('limit') || '30'),
        100
      );

      const repoService = new RepositoryService(c.env);
      const history = await repoService.getTrendingHistory(repoId, limit);

      return c.json({
        repo_id: repoId,
        trending_history: history,
        count: history.length
      });

    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * GET /api/repos/:owner/:name/stars - Get star snapshots for a repo
   * Query params:
   *  - limit: number (default: 100)
   */
  app.get('/repos/:owner/:name/stars', async (c) => {
    try {
      const owner = c.req.param('owner');
      const name = c.req.param('name');
      const repoId = `${owner}/${name}`;
      const limit = Math.min(
        parseInt(c.req.query('limit') || '100'),
        500
      );

      const repoService = new RepositoryService(c.env);
      const snapshots = await repoService.getStarSnapshots(repoId, limit);

      return c.json({
        repo_id: repoId,
        snapshots,
        count: snapshots.length
      });

    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * GET /api/trending - Get current trending repositories
   * Query params:
   *  - time_range: daily | weekly | monthly (optional)
   *  - language: string (optional)
   *  - limit: number (default: 50, max: 100)
   */
  app.get('/trending', async (c) => {
    try {
      const repoService = new RepositoryService(c.env);

      const timeRange = c.req.query('time_range') as 'daily' | 'weekly' | 'monthly' | undefined;
      const language = c.req.query('language');
      const limit = Math.min(
        parseInt(c.req.query('limit') || '50'),
        100
      );

      const trending = await repoService.getRecentTrending(
        timeRange,
        language,
        limit
      );

      return c.json({
        trending,
        count: trending.length,
        filters: {
          time_range: timeRange || 'all',
          language: language || 'all'
        }
      });

    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * GET /api/stats - Platform statistics
   */
  app.get('/stats', async (c) => {
    try {
      const repoService = new RepositoryService(c.env);
      const stats = await repoService.getStats();

      return c.json({
        statistics: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * POST /api/refresh - Manual refresh trigger (background)
   * Triggers the daily trending scrape in background (may timeout)
   * 🔒 Requires authentication
   */
  app.post('/refresh', requireAuth(), async (c) => {
    try {
      const result = await handleManualRefresh(
        c.env,
        c.executionCtx
      );

      return c.json(result);

    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * POST /api/refresh-sync - Synchronous manual refresh (for testing)
   * Query params:
   *   - language: typescript|python|go|rust|javascript|all
   *   - range: daily|weekly|monthly
   * 🔒 Requires authentication
   */
  app.post('/refresh-sync', requireAuth(), async (c) => {
    try {
      const { handleDailyTrendingScrape } = await import('./cron');
      const language = c.req.query('language') || 'typescript';
      const range = c.req.query('range') || 'daily';

      const { TrendingScraperService } = await import('../services/trendingScraper');
      const { StorageService } = await import('../services/storage');
      const { GitHubAPIService } = await import('../services/githubAPI');
      const { RepositoryService } = await import('../services/repositoryService');
      const { format } = await import('date-fns');

      const scraper = new TrendingScraperService();
      const storage = new StorageService(c.env);
      const github = new GitHubAPIService(c.env.GITHUB_TOKEN);
      const repoService = new RepositoryService(c.env);

      const today = format(new Date(), 'yyyy-MM-dd');
      const langParam = language === 'all' ? undefined : language;

      // Scrape one page synchronously
      const { repos, html } = await scraper.scrapeTrending(
        range as 'daily' | 'weekly' | 'monthly',
        langParam
      );

      const snapshotKey = await storage.storeSnapshot(today, range, language === 'all' ? null : language, html);

      let processed = 0;
      let errors = 0;

      for (const [index, repo] of repos.entries()) {
        try {
          const details = await github.getRepoDetails(repo.owner, repo.name);
          await repoService.upsertRepository(details);

          await repoService.createTrendingCapture({
            repo_id: `${repo.owner}/${repo.name}`,
            time_range: range as 'daily' | 'weekly' | 'monthly',
            language: language === 'all' ? null : language,
            rank: index + 1,
            stars_today: repo.stars_today,
            snapshot_url: snapshotKey
          });

          await repoService.createStarSnapshot({
            repo_id: `${repo.owner}/${repo.name}`,
            stars_count: details.stargazers_count,
            forks_count: details.forks_count
          });

          processed++;
        } catch (error) {
          errors++;
          console.error(`Failed to process ${repo.full_name}:`, error);
        }
      }

      return c.json({
        success: true,
        language,
        range,
        reposFound: repos.length,
        processed,
        errors,
        snapshotKey
      });

    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, 500);
    }
  });

  /**
   * GET /api/test-scrape - Test scraping synchronously (for debugging)
   * 🔒 Requires authentication
   */
  app.get('/test-scrape', requireAuth(), async (c) => {
    try {
      const { TrendingScraperService } = await import('../services/trendingScraper');
      const scraper = new TrendingScraperService();

      // Just scrape one page
      const { repos } = await scraper.scrapeTrending('daily', 'typescript');

      return c.json({
        success: true,
        reposFound: repos.length,
        sampleRepo: repos[0]
      });

    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, 500);
    }
  });

  /**
   * POST /api/trigger-queue - Manually trigger scraper by queuing tasks
   * 🔒 Requires authentication
   */
  app.post('/trigger-queue', requireAuth(), async (c) => {
    try {
      const { format } = await import('date-fns');
      const today = format(new Date(), 'yyyy-MM-dd');

      // Queue all 63 scraping tasks
      const languages: Array<string | null> = [
        'typescript', 'python', 'javascript', 'go', 'rust',
        'java', 'c++', 'c%23', 'c', 'kotlin', 'swift', 'ruby', 'php',
        'dart', 'elixir', 'scala', 'zig', 'html', 'css', 'shell',
        null
      ];
      const ranges: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];

      const messages = [];
      for (const range of ranges) {
        for (const language of languages) {
          messages.push({
            body: {
              task: 'scrape-trending' as const,
              range,
              language,
              date: today,
            }
          });
        }
      }

      await c.env.SCRAPER_QUEUE.sendBatch(messages);

      return c.json({
        success: true,
        messagesQueued: messages.length,
        message: 'Scraping tasks queued successfully'
      });

    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, 500);
    }
  });

  return app;
}
