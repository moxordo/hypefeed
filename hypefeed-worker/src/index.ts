import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { etag } from 'hono/etag';
import { secureHeaders } from 'hono/secure-headers';
import type { Env, ExecutionContext, ScheduledEvent } from './types/bindings';
import { createFeedHandlers } from './handlers/feed';
import { createHealthHandlers } from './handlers/health';
import { createChannelHandlers } from './handlers/channels';
import { handleScheduledEvent, handleManualRefresh } from './handlers/cron';

/**
 * HypeFeed RSS Aggregator - Cloudflare Worker
 * 
 * A single worker that handles both:
 * 1. HTTP requests for serving RSS feeds (via Hono)
 * 2. Scheduled events for RSS aggregation (via cron)
 */

// Initialize Hono app with type bindings
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', etag({ weak: true }));
app.use('*', secureHeaders({
  xContentTypeOptions: 'nosniff',
  xFrameOptions: 'DENY',
  xXssProtection: '1; mode=block'
}));

// Error handling middleware
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  
  return c.json({
    error: 'Internal server error',
    message: c.env?.ENVIRONMENT === 'development' ? err.message : 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    requestId: c.req.header('cf-ray') || 'unknown'
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not found',
    message: 'The requested resource was not found',
    availableEndpoints: {
      feed: '/feed.xml',
      channels: '/channels',
      health: '/health',
      root: '/',
      api: {
        channels: '/api/channels',
        channelDetail: '/api/channels/:channelId',
        channelStatus: '/api/channels/:channelId/status',
        bulkImport: '/api/channels/bulk'
      }
    }
  }, 404);
});

// Mount route handlers
const feedHandlers = createFeedHandlers();
const healthHandlers = createHealthHandlers();
const channelHandlers = createChannelHandlers();

// Feed routes
app.route('/', feedHandlers);

// Health and management routes  
app.route('/', healthHandlers);

// Channel API routes
app.route('/api', channelHandlers);

// Manual refresh endpoint (POST /refresh)
app.post('/refresh', async (c) => {
  try {
    // Execute the refresh in the background
    const refreshPromise = handleManualRefresh(c.env, c.executionCtx);
    
    // Use waitUntil to ensure the refresh completes
    c.executionCtx.waitUntil(refreshPromise);
    
    // Return immediate response to avoid timeout
    return c.json({
      message: 'Manual refresh triggered',
      note: 'Feed will be updated within the next few minutes',
      checkStatus: '/health',
      feedUrl: '/feed.xml'
    }, 202);
    
  } catch (error) {
    console.error('Manual refresh endpoint error:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Main worker export with dual handlers
 * This structure allows a single worker to handle both HTTP and cron events
 */
export default {
  /**
   * HTTP request handler (Hono app)
   */
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    try {
      return await app.fetch(request, env, ctx);
    } catch (error) {
      console.error('Fetch handler error:', error);
      
      return new Response(JSON.stringify({
        error: 'Worker error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'X-Error': 'true'
        }
      });
    }
  },

  /**
   * Scheduled event handler (Cron jobs)
   * Runs every 10 minutes as configured in wrangler.toml
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      console.log(`🕐 Scheduled event triggered: ${event.cron} at ${new Date(event.scheduledTime).toISOString()}`);
      
      await handleScheduledEvent(event, env, ctx);
      
      console.log('✅ Scheduled event completed successfully');
      
    } catch (error) {
      console.error('❌ Scheduled event failed:', error);
      
      // Cloudflare Workers will handle the error and retry based on configuration
      // We can optionally notify external monitoring systems here
      throw error;
    }
  }
};

// Export types for external use
export type { Env, ExecutionContext, ScheduledEvent };