/**
 * API Key Management Service
 * Handles creation, validation, and management of API keys
 */

import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient } from '@prisma/client';
import type { Env } from '../types/bindings';

export interface CreateApiKeyInput {
  name: string;
  description?: string;
  created_by?: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  last_used: Date | null;
  is_active: boolean;
  created_by: string | null;
}

export class ApiKeyService {
  private prisma: PrismaClient;

  constructor(env: Env) {
    const adapter = new PrismaD1(env.HYPEGIT_DB);
    this.prisma = new PrismaClient({ adapter });
  }

  /**
   * Generate a new API key
   * Returns the plaintext key (only shown once) and the key info
   */
  async createApiKey(input: CreateApiKeyInput): Promise<{ key: string; info: ApiKeyInfo }> {
    // Generate a secure random API key (32 bytes = 44 chars base64)
    const keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);
    const key = btoa(String.fromCharCode(...keyBytes));

    // Hash the key for storage (SHA-256)
    const keyHash = await this.hashKey(key);

    // Store in database
    const apiKey = await this.prisma.apiKey.create({
      data: {
        id: crypto.randomUUID(),
        key_hash: keyHash,
        name: input.name,
        description: input.description || null,
        created_by: input.created_by || null,
        is_active: true,
      },
    });

    return {
      key, // Return plaintext key (only time it's visible)
      info: {
        id: apiKey.id,
        name: apiKey.name,
        description: apiKey.description,
        created_at: apiKey.created_at,
        last_used: apiKey.last_used,
        is_active: apiKey.is_active,
        created_by: apiKey.created_by,
      },
    };
  }

  /**
   * Validate an API key
   * Returns the key info if valid, null if invalid
   */
  async validateKey(key: string): Promise<ApiKeyInfo | null> {
    const keyHash = await this.hashKey(key);

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key_hash: keyHash },
    });

    if (!apiKey || !apiKey.is_active) {
      return null;
    }

    // Update last_used timestamp asynchronously (don't wait)
    this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { last_used: new Date() },
    }).catch(err => {
      console.error('Failed to update last_used:', err);
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      description: apiKey.description,
      created_at: apiKey.created_at,
      last_used: apiKey.last_used,
      is_active: apiKey.is_active,
      created_by: apiKey.created_by,
    };
  }

  /**
   * List all API keys
   */
  async listKeys(includeInactive: boolean = false): Promise<ApiKeyInfo[]> {
    const keys = await this.prisma.apiKey.findMany({
      where: includeInactive ? undefined : { is_active: true },
      orderBy: { created_at: 'desc' },
    });

    return keys.map(key => ({
      id: key.id,
      name: key.name,
      description: key.description,
      created_at: key.created_at,
      last_used: key.last_used,
      is_active: key.is_active,
      created_by: key.created_by,
    }));
  }

  /**
   * Deactivate an API key
   */
  async deactivateKey(keyId: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { is_active: false },
    });
  }

  /**
   * Reactivate an API key
   */
  async reactivateKey(keyId: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { is_active: true },
    });
  }

  /**
   * Delete an API key permanently
   */
  async deleteKey(keyId: string): Promise<void> {
    await this.prisma.apiKey.delete({
      where: { id: keyId },
    });
  }

  /**
   * Hash an API key using SHA-256
   */
  private async hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
