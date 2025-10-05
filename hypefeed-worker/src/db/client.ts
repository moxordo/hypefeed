import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import type { Env } from '../types/bindings';

// Polyfill for setImmediate in Cloudflare Workers environment
if (typeof globalThis.setImmediate === 'undefined') {
  // @ts-ignore
  globalThis.setImmediate = (fn: Function) => setTimeout(fn, 0);
}

/**
 * Create a Prisma client instance for Cloudflare D1
 * This uses the D1 adapter for Cloudflare Workers
 */
export function createPrismaClient(env: Env): PrismaClient {
  const adapter = new PrismaD1(env.HYPEFEED_DB);
  return new PrismaClient({ 
    adapter,
    log: env.ENVIRONMENT === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
}

/**
 * Helper to ensure Prisma client is properly disconnected
 * Important for Cloudflare Workers to prevent connection leaks
 */
export async function withPrisma<T>(
  env: Env,
  callback: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = createPrismaClient(env);
  try {
    return await callback(prisma);
  } finally {
    await prisma.$disconnect();
  }
}