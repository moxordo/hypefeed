/**
 * HypeGit Worker - Main entry point
 * Developer hype & mindshare tracker
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, ExecutionContext, ScheduledEvent, ScraperQueueMessage } from './types/bindings';
import { createHealthHandlers } from './handlers/health';
import { createAPIHandlers } from './handlers/api';
import { createAdminHandlers } from './handlers/admin';
import { handleScheduledEvent } from './handlers/cron';
import { handleQueueBatch } from './handlers/queueConsumer';

/**
 * Create main Hono app
 */
const app = new Hono<{ Bindings: Env }>();

// Enable CORS
app.use('/*', cors());

// Mount health check routes (root + /health)
const healthHandlers = createHealthHandlers();
app.route('/', healthHandlers);

// Mount API routes
const apiHandlers = createAPIHandlers();
app.route('/api', apiHandlers);

// Mount admin routes (key management)
const adminHandlers = createAdminHandlers();
app.route('/admin', adminHandlers);

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    path: c.req.path
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  }, 500);
});

/**
 * Cloudflare Worker export
 */
export default {
  /**
   * Fetch handler for HTTP requests
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  /**
   * Scheduled handler for CRON triggers
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    await handleScheduledEvent(event, env, ctx);
  },

  /**
   * Queue handler for processing scraper messages
   */
  async queue(
    batch: MessageBatch<ScraperQueueMessage>,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    await handleQueueBatch(batch, env);
  }
};
