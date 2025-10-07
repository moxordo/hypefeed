/**
 * Prisma client configured for Cloudflare D1
 */

import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import type { Env } from '../types/bindings';

// Polyfill for setImmediate in Cloudflare Workers environment
if (typeof globalThis.setImmediate === 'undefined') {
  // @ts-ignore
  globalThis.setImmediate = (fn: Function) => setTimeout(fn, 0);
}

/**
 * Get Prisma client with D1 adapter
 */
export function getPrismaClient(env: Env): PrismaClient {
  const adapter = new PrismaD1(env.HYPEGIT_DB);
  const prisma = new PrismaClient({
    adapter,
    log: env.ENVIRONMENT === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
  return prisma;
}
