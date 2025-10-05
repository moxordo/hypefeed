import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from '../types/bindings';
import { ChannelService } from '../services/channelService';

/**
 * Channel management API endpoints
 */
export function createChannelHandlers() {
  const app = new Hono<{ Bindings: Env }>();

  // CORS middleware
  app.use('/*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type'],
    maxAge: 3600
  }));

  /**
   * GET /channels - List all channels
   */
  app.get('/channels', async (c) => {
    try {
      const channelService = new ChannelService(c.env);
      const status = c.req.query('status');
      const category = c.req.query('category');

      let channels;
      if (status === 'active') {
        channels = await channelService.getActiveChannels();
      } else if (category) {
        channels = await channelService.getChannelsByCategory(category);
      } else {
        channels = await channelService.getAllChannels();
      }

      return c.json({
        channels,
        count: channels.length
      });

    } catch (error) {
      console.error('Error fetching channels:', error);
      return c.json(
        { error: 'Failed to fetch channels', message: error instanceof Error ? error.message : 'Unknown error' },
        500
      );
    }
  });

  /**
   * GET /channels/:channelId - Get specific channel
   */
  app.get('/channels/:channelId', async (c) => {
    try {
      const channelId = c.req.param('channelId');
      const channelService = new ChannelService(c.env);

      const channel = await channelService.getChannelById(channelId);

      if (!channel) {
        return c.json(
          { error: 'Channel not found' },
          404
        );
      }

      return c.json(channel);

    } catch (error) {
      console.error('Error fetching channel:', error);
      return c.json(
        { error: 'Failed to fetch channel', message: error instanceof Error ? error.message : 'Unknown error' },
        500
      );
    }
  });

  /**
   * POST /channels - Create new channel
   */
  app.post('/channels', async (c) => {
    try {
      const body = await c.req.json();
      const channelService = new ChannelService(c.env);

      // Validate required fields
      const requiredFields = ['name', 'handle', 'channel_id', 'youtube_url', 'rss_feed_url', 'subscribers', 'description', 'posting_frequency', 'category'];
      for (const field of requiredFields) {
        if (!body[field]) {
          return c.json(
            { error: `Missing required field: ${field}` },
            400
          );
        }
      }

      // Set default status if not provided
      if (!body.status) {
        body.status = 'PENDING_EVALUATION';
      }

      const channel = await channelService.createChannel(body);

      return c.json(channel, 201);

    } catch (error) {
      console.error('Error creating channel:', error);
      return c.json(
        { error: 'Failed to create channel', message: error instanceof Error ? error.message : 'Unknown error' },
        500
      );
    }
  });

  /**
   * PATCH /channels/:channelId - Update channel
   */
  app.patch('/channels/:channelId', async (c) => {
    try {
      const channelId = c.req.param('channelId');
      const body = await c.req.json();
      const channelService = new ChannelService(c.env);

      const channel = await channelService.updateChannel(channelId, body);

      if (!channel) {
        return c.json(
          { error: 'Channel not found' },
          404
        );
      }

      return c.json(channel);

    } catch (error) {
      console.error('Error updating channel:', error);
      return c.json(
        { error: 'Failed to update channel', message: error instanceof Error ? error.message : 'Unknown error' },
        500
      );
    }
  });

  /**
   * PUT /channels/:channelId/status - Update channel status
   */
  app.put('/channels/:channelId/status', async (c) => {
    try {
      const channelId = c.req.param('channelId');
      const body = await c.req.json();
      const channelService = new ChannelService(c.env);

      if (!body.status) {
        return c.json(
          { error: 'Status is required' },
          400
        );
      }

      const validStatuses = ['PENDING_EVALUATION', 'TRYOUT', 'CANDIDATE', 'LIVE', 'REVISIT', 'DROP', 'DUPLICATE'];
      if (!validStatuses.includes(body.status)) {
        return c.json(
          { error: 'Invalid status value', validStatuses },
          400
        );
      }

      const channel = await channelService.updateChannelStatus(channelId, body.status);

      if (!channel) {
        return c.json(
          { error: 'Channel not found' },
          404
        );
      }

      return c.json(channel);

    } catch (error) {
      console.error('Error updating channel status:', error);
      return c.json(
        { error: 'Failed to update channel status', message: error instanceof Error ? error.message : 'Unknown error' },
        500
      );
    }
  });

  /**
   * POST /channels/bulk - Bulk import channels
   */
  app.post('/channels/bulk', async (c) => {
    try {
      const body = await c.req.json();
      const channelService = new ChannelService(c.env);

      if (!Array.isArray(body.channels)) {
        return c.json(
          { error: 'channels array is required' },
          400
        );
      }

      const count = await channelService.bulkCreateChannels(body.channels);

      return c.json({
        message: 'Channels imported successfully',
        count
      }, 201);

    } catch (error) {
      console.error('Error bulk importing channels:', error);
      return c.json(
        { error: 'Failed to import channels', message: error instanceof Error ? error.message : 'Unknown error' },
        500
      );
    }
  });

  return app;
}