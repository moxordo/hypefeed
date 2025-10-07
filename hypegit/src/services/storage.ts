/**
 * R2 Storage Service
 * Handles R2 operations for storing trending HTML snapshots
 */

import type { Env } from '../types/bindings';
import { StorageError, StorageKeys } from '../types/bindings';

export class StorageService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Store trending HTML snapshot to R2
   */
  async storeSnapshot(
    date: string,
    timeRange: string,
    language: string | null,
    html: string
  ): Promise<string> {
    try {
      const key = StorageKeys.TRENDING_SNAPSHOT(date, timeRange, language);

      await this.env.HYPEGIT_BUCKET.put(key, html, {
        httpMetadata: {
          contentType: 'text/html',
          cacheControl: 'public, max-age=86400'  // 24 hours
        },
        customMetadata: {
          date,
          timeRange,
          language: language || 'all',
          storedAt: new Date().toISOString()
        }
      });

      console.log(`Stored snapshot: ${key}`);
      return key;

    } catch (error) {
      throw new StorageError(
        `Failed to store snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'store_snapshot'
      );
    }
  }

  /**
   * Retrieve trending HTML snapshot from R2
   */
  async getSnapshot(key: string): Promise<string | null> {
    try {
      const object = await this.env.HYPEGIT_BUCKET.get(key);

      if (!object) {
        return null;
      }

      const html = await object.text();
      return html;

    } catch (error) {
      throw new StorageError(
        `Failed to retrieve snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'get_snapshot'
      );
    }
  }

  /**
   * List snapshots for a specific date
   */
  async listSnapshotsByDate(date: string): Promise<Array<{
    key: string;
    size: number;
    uploaded: Date;
    metadata?: Record<string, string>;
  }>> {
    try {
      const prefix = `trending/${date}/`;

      const listed = await this.env.HYPEGIT_BUCKET.list({
        prefix,
        limit: 100
      });

      return listed.objects.map(obj => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
        metadata: obj.customMetadata
      }));

    } catch (error) {
      console.error('Failed to list snapshots:', error);
      return [];
    }
  }
}
