/**
 * Authentication Middleware
 * Bearer token validation for protected API endpoints
 */

import { bearerAuth } from 'hono/bearer-auth';
import type { Context, MiddlewareHandler } from 'hono';
import type { Env } from '../types/bindings';

/**
 * Create bearer authentication middleware
 * Validates API key from Authorization header
 */
export function createAuthMiddleware(): MiddlewareHandler {
  return async (c: Context<{ Bindings: Env }>, next) => {
    const apiKey = c.env.ADMIN_API_KEY;

    // If no API key is configured, deny all authenticated requests
    if (!apiKey) {
      return c.json({
        error: 'Authentication not configured',
        message: 'API key authentication is not properly set up'
      }, 500);
    }

    // Use Hono's built-in bearer auth middleware
    const auth = bearerAuth({ token: apiKey });
    return auth(c, next);
  };
}

/**
 * Optional: Custom auth middleware with better error messages
 */
export function requireAuth(): MiddlewareHandler {
  return async (c: Context<{ Bindings: Env }>, next) => {
    const apiKey = c.env.ADMIN_API_KEY;

    if (!apiKey) {
      return c.json({
        error: 'Authentication not configured',
        message: 'API key authentication is not properly set up'
      }, 500);
    }

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

    // Constant-time comparison to prevent timing attacks
    if (!constantTimeCompare(token, apiKey)) {
      return c.json({
        error: 'Unauthorized',
        message: 'Invalid API key'
      }, 401);
    }

    // Authentication successful, proceed
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
