/**
 * Health check endpoints
 */

import { Hono } from 'hono';
import type { Env } from '../types/bindings';
import { RepositoryService } from '../services/repositoryService';
import { StorageService } from '../services/storage';

/**
 * Create health check route handlers
 */
export function createHealthHandlers() {
  const app = new Hono<{ Bindings: Env }>();

  /**
   * GET /health - Health check endpoint
   */
  app.get('/health', async (c) => {
    try {
      const repoService = new RepositoryService(c.env);
      const storageService = new StorageService(c.env);

      // Get database stats
      const dbStats = await repoService.getStats();

      return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: c.env.ENVIRONMENT,
        database: {
          totalRepos: dbStats.totalRepos,
          activeRepos: dbStats.activeRepos,
          totalSnapshots: dbStats.totalSnapshots,
          totalTrendingCaptures: dbStats.totalTrendingCaptures
        },
        services: {
          database: 'operational',
          storage: 'operational',
          scraper: 'operational'
        }
      });

    } catch (error) {
      return c.json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * GET / - Root endpoint
   */
  app.get('/', (c) => {
    return c.json({
      name: 'HypeGit',
      description: 'Developer hype & mindshare tracker',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: {
          repos: '/api/repos',
          trending: '/api/trending',
          stats: '/api/stats'
        }
      }
    });
  });

  return app;
}
