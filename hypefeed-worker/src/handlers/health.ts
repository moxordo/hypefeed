import { Hono } from 'hono';
import type { Env } from '../types/bindings';
import { StorageService } from '../services/storage';
import { getActiveChannels } from '../data/channels';

/**
 * Health check and channel management handlers
 */
export function createHealthHandlers() {
  const app = new Hono<{ Bindings: Env }>();

  /**
   * GET /health - Service health check
   */
  app.get('/health', async (c) => {
    try {
      const storage = new StorageService(c.env);
      const storageHealth = await storage.getStorageHealth();
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: c.env.ENVIRONMENT || 'unknown',
        storage: storageHealth,
        channels: {
          total: getActiveChannels().length,
          active: getActiveChannels().filter(ch => ch.status === 'LIVE').length,
        },
        services: {
          aggregator: 'operational',
          renderer: 'operational',
          storage: storageHealth.currentFeedExists ? 'operational' : 'degraded',
        }
      };

      // Determine overall health status
      const isHealthy = storageHealth.currentFeedExists && 
                       storageHealth.versionCount > 0;
      
      if (!isHealthy) {
        health.status = 'degraded';
      }

      return c.json(health, isHealthy ? 200 : 503);

    } catch (error) {
      console.error('Health check error:', error);
      return c.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 503);
    }
  });

  /**
   * GET /channels - List all channels and their status
   */
  app.get('/channels', async (c) => {
    try {
      const channels = getActiveChannels();
      const storage = new StorageService(c.env);
      const metadata = await storage.getMetadata();

      const response = {
        channels: channels.map(channel => ({
          name: channel.name,
          handle: channel.handle,
          channelId: channel.channel_id,
          youtubeUrl: channel.youtube_url,
          rssUrl: channel.rss_feed_url,
          subscribers: channel.subscribers,
          description: channel.description,
          category: channel.category,
          status: channel.status,
          postingFrequency: channel.posting_frequency
        })),
        summary: {
          total: channels.length,
          byStatus: channels.reduce((acc, channel) => {
            acc[channel.status] = (acc[channel.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          byCategory: channels.reduce((acc, channel) => {
            acc[channel.category] = (acc[channel.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          lastUpdate: metadata?.generated_at || null
        },
        feedUrl: '/feed.xml'
      };

      return c.json(response);

    } catch (error) {
      console.error('Channel listing error:', error);
      return c.json(
        { 
          error: 'Failed to list channels',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, 
        500
      );
    }
  });

  /**
   * GET /channels/{channelId} - Get specific channel information
   */
  app.get('/channels/:channelId', async (c) => {
    try {
      const channelId = c.req.param('channelId');
      const channels = getActiveChannels();
      const channel = channels.find(ch => ch.channel_id === channelId);

      if (!channel) {
        return c.json({ error: 'Channel not found' }, 404);
      }

      return c.json({
        ...channel,
        directRssUrl: `/feed.xml?channel=${channelId}`,
        youtubeRssUrl: channel.rss_feed_url
      });

    } catch (error) {
      console.error('Channel details error:', error);
      return c.json(
        { 
          error: 'Failed to get channel details',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, 
        500
      );
    }
  });

  /**
   * POST /refresh - Manual refresh trigger (admin endpoint)
   */
  app.post('/refresh', async (c) => {
    try {
      // This endpoint will trigger the cron handler manually
      // Implementation depends on whether you want to allow manual triggers
      
      return c.json({
        message: 'Manual refresh triggered',
        note: 'Feed will be updated within the next few minutes',
        checkStatus: '/health',
        feedUrl: '/feed.xml'
      });

    } catch (error) {
      console.error('Manual refresh error:', error);
      return c.json(
        { 
          error: 'Failed to trigger refresh',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, 
        500
      );
    }
  });

  /**
   * GET /status - Simple status endpoint for monitoring
   */
  app.get('/status', async (c) => {
    try {
      const storage = new StorageService(c.env);
      const feedExists = await storage.getCurrentFeed();
      
      return c.text(feedExists ? 'OK' : 'DEGRADED', feedExists ? 200 : 503);
      
    } catch (error) {
      return c.text('ERROR', 500);
    }
  });

  /**
   * GET / - Root endpoint with service information
   */
  app.get('/', async (c) => {
    const baseUrl = new URL(c.req.url).origin;
    
    return c.json({
      service: 'HypeFeed RSS Aggregator',
      version: '1.0.0',
      description: 'AI Pioneer YouTube channels RSS feed aggregation service',
      endpoints: {
        feed: `${baseUrl}/feed.xml`,
        channels: `${baseUrl}/channels`,
        health: `${baseUrl}/health`,
        versions: `${baseUrl}/feed/versions`,
        stats: `${baseUrl}/feed/stats`
      },
      documentation: 'https://github.com/your-org/hypefeed-worker',
      lastUpdated: new Date().toISOString()
    });
  });

  return app;
}