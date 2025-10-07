/**
 * Admin API handlers
 * Key management endpoints (super admin only)
 */

import { Hono } from 'hono';
import type { Env } from '../types/bindings';
import { ApiKeyService } from '../services/apiKeyService';
import { requireAdminAuth } from '../middleware/auth';

/**
 * Create admin route handlers
 */
export function createAdminHandlers() {
  const app = new Hono<{ Bindings: Env }>();

  // All admin routes require ADMIN_API_KEY
  app.use('*', requireAdminAuth());

  /**
   * POST /admin/keys - Create a new API key
   * Body:
   *  - name: string (required)
   *  - description: string (optional)
   *  - created_by: string (optional)
   */
  app.post('/keys', async (c) => {
    try {
      const body = await c.req.json();

      if (!body.name || typeof body.name !== 'string') {
        return c.json({
          error: 'Validation error',
          message: 'name is required and must be a string'
        }, 400);
      }

      const apiKeyService = new ApiKeyService(c.env);
      const result = await apiKeyService.createApiKey({
        name: body.name,
        description: body.description,
        created_by: body.created_by,
      });

      return c.json({
        success: true,
        message: 'API key created successfully. Save this key - it will not be shown again!',
        key: result.key,
        info: result.info,
      }, 201);

    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * GET /admin/keys - List all API keys
   * Query params:
   *  - include_inactive: boolean (default: false)
   */
  app.get('/keys', async (c) => {
    try {
      const includeInactive = c.req.query('include_inactive') === 'true';

      const apiKeyService = new ApiKeyService(c.env);
      const keys = await apiKeyService.listKeys(includeInactive);

      return c.json({
        keys,
        count: keys.length,
        filters: {
          include_inactive: includeInactive
        }
      });

    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * DELETE /admin/keys/:id - Deactivate an API key
   */
  app.delete('/keys/:id', async (c) => {
    try {
      const keyId = c.req.param('id');
      const apiKeyService = new ApiKeyService(c.env);

      await apiKeyService.deactivateKey(keyId);

      return c.json({
        success: true,
        message: `API key ${keyId} deactivated successfully`
      });

    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * POST /admin/keys/:id/reactivate - Reactivate an API key
   */
  app.post('/keys/:id/reactivate', async (c) => {
    try {
      const keyId = c.req.param('id');
      const apiKeyService = new ApiKeyService(c.env);

      await apiKeyService.reactivateKey(keyId);

      return c.json({
        success: true,
        message: `API key ${keyId} reactivated successfully`
      });

    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * DELETE /admin/keys/:id/permanent - Permanently delete an API key
   */
  app.delete('/keys/:id/permanent', async (c) => {
    try {
      const keyId = c.req.param('id');
      const apiKeyService = new ApiKeyService(c.env);

      await apiKeyService.deleteKey(keyId);

      return c.json({
        success: true,
        message: `API key ${keyId} permanently deleted`
      });

    } catch (error) {
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  return app;
}
