/**
 * Authentication Middleware
 * Bearer token validation for protected API endpoints
 */

import type { Context, MiddlewareHandler } from 'hono';
import type { Env } from '../types/bindings';
import { ApiKeyService } from '../services/apiKeyService';

/**
 * Authentication middleware with database-backed API keys
 * Also supports legacy ADMIN_API_KEY for backward compatibility
 */
export function requireAuth(): MiddlewareHandler {
  return async (c: Context<{ Bindings: Env }>, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      return c.json({
        error: 'Unauthorized',
        message: 'Missing Authorization header',
        hint: 'Include: Authorization: Bearer YOUR_API_KEY'
      }, 401);
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer') {
      return c.json({
        error: 'Unauthorized',
        message: 'Invalid authorization scheme',
        hint: 'Use Bearer token: Authorization: Bearer YOUR_API_KEY'
      }, 401);
    }

    if (!token) {
      return c.json({
        error: 'Unauthorized',
        message: 'Missing API key',
        hint: 'Include your API key after Bearer'
      }, 401);
    }

    // Check database for API key
    const apiKeyService = new ApiKeyService(c.env);
    const keyInfo = await apiKeyService.validateKey(token);

    if (keyInfo) {
      // Valid database key - store key info in context for later use
      c.set('apiKey', keyInfo);
      await next();
      return;
    }

    // Fallback: Check legacy ADMIN_API_KEY for backward compatibility
    if (c.env.ADMIN_API_KEY && constantTimeCompare(token, c.env.ADMIN_API_KEY)) {
      // Valid legacy admin key
      c.set('apiKey', { name: 'Legacy Admin Key', id: 'admin' });
      await next();
      return;
    }

    // Invalid key
    return c.json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    }, 401);
  };
}

/**
 * Super admin authentication (requires ADMIN_API_KEY only)
 * Used for key management endpoints
 */
export function requireAdminAuth(): MiddlewareHandler {
  return async (c: Context<{ Bindings: Env }>, next) => {
    const adminKey = c.env.ADMIN_API_KEY;

    if (!adminKey) {
      return c.json({
        error: 'Admin authentication not configured',
        message: 'Admin API key is not set up'
      }, 500);
    }

    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      return c.json({
        error: 'Unauthorized',
        message: 'Missing Authorization header',
        hint: 'Include: Authorization: Bearer ADMIN_API_KEY'
      }, 401);
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return c.json({
        error: 'Unauthorized',
        message: 'Invalid authorization format'
      }, 401);
    }

    // Constant-time comparison to prevent timing attacks
    if (!constantTimeCompare(token, adminKey)) {
      return c.json({
        error: 'Unauthorized',
        message: 'Invalid admin API key'
      }, 401);
    }

    // Admin authentication successful
    await next();
  };
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
