import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';
import type { Env } from '../types/bindings';
import { StorageService } from '../services/storage';

/**
 * Feed serving handlers for RSS endpoints
 */
export function createFeedHandlers() {
  const app = new Hono<{ Bindings: Env }>();

  // CORS middleware for feed access
  app.use('/*', cors({
    origin: '*',
    allowMethods: ['GET', 'HEAD'],
    allowHeaders: ['Content-Type'],
    maxAge: 3600
  }));

  /**
   * GET /feed.xml - Serve the current RSS feed
   */
  app.get('/feed.xml', cache({
    cacheName: 'hypefeed-rss',
    cacheControl: 'public, max-age=300', // 5 minutes
  }), async (c) => {
    try {
      const storage = new StorageService(c.env);
      
      // Try KV cache first for fastest response
      let feedContent = await storage.getCachedFeedFromKV();
      
      if (!feedContent) {
        // Fallback to R2 storage
        const feedData = await storage.getCurrentFeed();
        if (!feedData) {
          return c.text('RSS feed not yet available. Please try again in a few minutes.', 503, {
            'Content-Type': 'text/plain',
            'Retry-After': '300'
          });
        }
        feedContent = feedData.content;
        
        // Cache in KV for next time
        await storage.cacheFeedInKV(feedContent, 300);
      }

      return c.body(feedContent, 200, {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Content-Type-Options': 'nosniff',
        'X-RSS-Generator': 'HypeFeed v1.0',
      });

    } catch (error) {
      console.error('Feed serving error:', error);
      return c.json(
        { 
          error: 'Failed to serve RSS feed',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, 
        500
      );
    }
  });

  /**
   * GET /feed/{timestamp}.xml - Serve a specific version of the RSS feed
   */
  app.get('/feed/:timestamp.xml', async (c) => {
    try {
      const timestamp = c.req.param('timestamp');
      
      if (!timestamp || !/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/.test(timestamp)) {
        return c.json({ error: 'Invalid timestamp format' }, 400);
      }

      const storage = new StorageService(c.env);
      const feedData = await storage.getVersionedFeed(timestamp);
      
      if (!feedData) {
        return c.json({ error: 'Feed version not found' }, 404);
      }

      return c.body(feedData.content, 200, {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400', // 24 hours for versioned content
        'X-Content-Type-Options': 'nosniff',
        'X-RSS-Generator': 'HypeFeed v1.0',
        'X-Feed-Version': timestamp || 'unknown',
      });

    } catch (error) {
      console.error('Versioned feed serving error:', error);
      return c.json(
        { 
          error: 'Failed to serve versioned RSS feed',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, 
        500
      );
    }
  });

  /**
   * GET /feed/versions - List available feed versions
   */
  app.get('/feed/versions', async (c) => {
    try {
      const limit = parseInt(c.req.query('limit') || '20', 10);
      const storage = new StorageService(c.env);
      const versions = await storage.listFeedVersions(Math.min(limit, 100));

      return c.json({
        versions: versions.map(v => ({
          timestamp: v.timestamp,
          url: `/feed/${v.timestamp}.xml`,
          size: v.size,
          lastModified: v.lastModified,
          itemCount: v.metadata?.totalItems || 'unknown',
          channelCount: v.metadata?.channelCount || 'unknown'
        })),
        count: versions.length,
        currentFeedUrl: '/feed.xml'
      });

    } catch (error) {
      console.error('Version listing error:', error);
      return c.json(
        { 
          error: 'Failed to list feed versions',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, 
        500
      );
    }
  });

  /**
   * GET /feed/stats - Feed statistics and metadata
   */
  app.get('/feed/stats', async (c) => {
    try {
      const storage = new StorageService(c.env);
      const [metadata, storageHealth] = await Promise.all([
        storage.getMetadata(),
        storage.getStorageHealth()
      ]);

      return c.json({
        feed: {
          title: c.env.FEED_TITLE,
          description: c.env.FEED_DESCRIPTION,
          language: c.env.FEED_LANGUAGE,
          maxItems: parseInt(c.env.MAX_FEED_ITEMS, 10),
          lastGenerated: metadata?.generated_at || null,
          totalChannels: metadata?.total_channels || 0,
          successCount: metadata?.success_count || 0,
          failureCount: metadata?.failure_count || 0
        },
        storage: storageHealth,
        urls: {
          current: '/feed.xml',
          versions: '/feed/versions',
          channels: '/channels',
          health: '/health'
        }
      });

    } catch (error) {
      console.error('Stats retrieval error:', error);
      return c.json(
        { 
          error: 'Failed to retrieve feed stats',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, 
        500
      );
    }
  });

  /**
   * HEAD /feed.xml - Quick feed availability check
   */
  app.all('/feed.xml', async (c) => {
    if (c.req.method !== 'HEAD') return;
    
    try {
      const storage = new StorageService(c.env);
      const feedData = await storage.getCurrentFeed();
      
      if (!feedData) {
        return c.body(null, 503, {
          'Retry-After': '300'
        });
      }

      return c.body(null, 200, {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'Content-Length': feedData.content.length.toString(),
        'Last-Modified': feedData.metadata?.generatedAt ? 
          new Date(feedData.metadata.generatedAt).toUTCString() : 
          new Date().toUTCString()
      });

    } catch (error) {
      console.error('Feed HEAD error:', error);
      return c.body(null, 500);
    }
  });

  return app;
}