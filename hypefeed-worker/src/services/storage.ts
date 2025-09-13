import type { Env, FeedMetadata } from '../types/bindings';
import { StorageError } from '../types/bindings';
import { StorageKeys } from '../types/bindings';

/**
 * R2 storage service for managing RSS feeds and metadata
 */
export class StorageService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Store the current RSS feed XML in R2
   */
  async storeCurrentFeed(xmlContent: string, metadata: FeedMetadata): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Store current feed
      await this.env.HYPEFEED_BUCKET.put(StorageKeys.CURRENT_FEED, xmlContent, {
        httpMetadata: {
          contentType: 'application/rss+xml',
          cacheControl: 'public, max-age=300', // 5 minutes cache
        },
        customMetadata: {
          generatedAt: metadata.generated_at,
          totalItems: metadata.success_count.toString(),
          channelCount: metadata.total_channels.toString(),
          version: timestamp
        }
      });

      // Store versioned feed for history
      const versionedKey = StorageKeys.feedVersion(timestamp);
      await this.env.HYPEFEED_BUCKET.put(versionedKey, xmlContent, {
        httpMetadata: {
          contentType: 'application/rss+xml',
        },
        customMetadata: {
          generatedAt: metadata.generated_at,
          totalItems: metadata.success_count.toString(),
          channelCount: metadata.total_channels.toString(),
          isVersioned: 'true'
        }
      });

      // Store metadata
      await this.storeMetadata(metadata, timestamp);

      console.log(`RSS feed stored successfully: current + version ${timestamp}`);

    } catch (error) {
      throw new StorageError(
        `Failed to store RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'store_feed'
      );
    }
  }

  /**
   * Retrieve the current RSS feed XML from R2
   */
  async getCurrentFeed(): Promise<{ content: string; metadata?: Record<string, string> } | null> {
    try {
      const object = await this.env.HYPEFEED_BUCKET.get(StorageKeys.CURRENT_FEED);
      
      if (!object) {
        return null;
      }

      const content = await object.text();
      return {
        content,
        metadata: object.customMetadata || undefined
      };

    } catch (error) {
      throw new StorageError(
        `Failed to retrieve current RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'get_current_feed'
      );
    }
  }

  /**
   * Retrieve a versioned RSS feed XML from R2
   */
  async getVersionedFeed(timestamp: string): Promise<{ content: string; metadata?: Record<string, string> } | null> {
    try {
      const key = StorageKeys.feedVersion(timestamp);
      const object = await this.env.HYPEFEED_BUCKET.get(key);
      
      if (!object) {
        return null;
      }

      const content = await object.text();
      return {
        content,
        metadata: object.customMetadata || undefined
      };

    } catch (error) {
      throw new StorageError(
        `Failed to retrieve versioned RSS feed ${timestamp}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'get_versioned_feed'
      );
    }
  }

  /**
   * Store metadata about the feed generation
   */
  private async storeMetadata(metadata: FeedMetadata, version: string): Promise<void> {
    try {
      const metadataWithVersion = {
        ...metadata,
        version,
        stored_at: new Date().toISOString()
      };

      await this.env.HYPEFEED_BUCKET.put(
        StorageKeys.FEED_METADATA,
        JSON.stringify(metadataWithVersion, null, 2),
        {
          httpMetadata: {
            contentType: 'application/json',
          },
          customMetadata: {
            type: 'metadata',
            version,
            generatedAt: metadata.generated_at
          }
        }
      );

    } catch (error) {
      console.error('Failed to store metadata:', error);
      // Don't throw here as this is not critical
    }
  }

  /**
   * Retrieve the latest feed metadata
   */
  async getMetadata(): Promise<FeedMetadata | null> {
    try {
      const object = await this.env.HYPEFEED_BUCKET.get(StorageKeys.FEED_METADATA);
      
      if (!object) {
        return null;
      }

      const content = await object.text();
      return JSON.parse(content) as FeedMetadata;

    } catch (error) {
      console.error('Failed to retrieve metadata:', error);
      return null;
    }
  }

  /**
   * List all available feed versions
   */
  async listFeedVersions(limit: number = 20): Promise<Array<{
    timestamp: string;
    key: string;
    size: number;
    lastModified: Date;
    metadata?: Record<string, string>;
  }>> {
    try {
      const listed = await this.env.HYPEFEED_BUCKET.list({
        prefix: 'feeds/',
        limit
      });

      return listed.objects
        .filter(obj => obj.key !== StorageKeys.CURRENT_FEED && obj.key.endsWith('.xml'))
        .map(obj => ({
          timestamp: obj.key.replace('feeds/', '').replace('.xml', ''),
          key: obj.key,
          size: obj.size,
          lastModified: obj.uploaded,
          metadata: obj.customMetadata || undefined
        }))
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    } catch (error) {
      console.error('Failed to list feed versions:', error);
      return [];
    }
  }

  /**
   * Clean up old feed versions (keep last 100 versions)
   */
  async cleanupOldVersions(keepCount: number = 100): Promise<number> {
    try {
      const versions = await this.listFeedVersions(1000); // Get more than we want to keep
      
      if (versions.length <= keepCount) {
        return 0; // Nothing to clean up
      }

      const toDelete = versions.slice(keepCount);
      let deletedCount = 0;

      // Delete in batches to avoid overwhelming R2
      const batchSize = 10;
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        const deletePromises = batch.map(version => 
          this.env.HYPEFEED_BUCKET.delete(version.key)
        );
        
        await Promise.all(deletePromises);
        deletedCount += batch.length;
      }

      console.log(`Cleaned up ${deletedCount} old feed versions`);
      return deletedCount;

    } catch (error) {
      console.error('Failed to clean up old versions:', error);
      return 0;
    }
  }

  /**
   * Get storage health information
   */
  async getStorageHealth(): Promise<{
    currentFeedExists: boolean;
    metadataExists: boolean;
    versionCount: number;
    lastUpdate?: string;
    storageUsed?: number;
  }> {
    try {
      const [currentFeed, metadata, versions] = await Promise.all([
        this.env.HYPEFEED_BUCKET.head(StorageKeys.CURRENT_FEED),
        this.env.HYPEFEED_BUCKET.head(StorageKeys.FEED_METADATA),
        this.listFeedVersions(100)
      ]);

      const storageUsed = versions.reduce((total, version) => total + version.size, 0);

      return {
        currentFeedExists: currentFeed !== null,
        metadataExists: metadata !== null,
        versionCount: versions.length,
        lastUpdate: versions[0]?.lastModified?.toISOString() || undefined,
        storageUsed
      };

    } catch (error) {
      console.error('Failed to get storage health:', error);
      return {
        currentFeedExists: false,
        metadataExists: false,
        versionCount: 0
      };
    }
  }

  /**
   * Store channel configuration data
   */
  async storeChannelConfig(channels: any): Promise<void> {
    try {
      await this.env.HYPEFEED_BUCKET.put(
        StorageKeys.CHANNEL_CONFIG,
        JSON.stringify(channels, null, 2),
        {
          httpMetadata: {
            contentType: 'application/json',
          },
          customMetadata: {
            type: 'channel_config',
            updatedAt: new Date().toISOString()
          }
        }
      );

    } catch (error) {
      console.error('Failed to store channel config:', error);
    }
  }

  /**
   * Get channel configuration data
   */
  async getChannelConfig(): Promise<any | null> {
    try {
      const object = await this.env.HYPEFEED_BUCKET.get(StorageKeys.CHANNEL_CONFIG);
      
      if (!object) {
        return null;
      }

      const content = await object.text();
      return JSON.parse(content);

    } catch (error) {
      console.error('Failed to retrieve channel config:', error);
      return null;
    }
  }

  /**
   * Cache RSS content in KV for faster access
   */
  async cacheFeedInKV(content: string, ttl: number = 300): Promise<void> {
    try {
      await this.env.HYPEFEED_KV.put('current_feed_xml', content, {
        expirationTtl: ttl // 5 minutes default
      });
    } catch (error) {
      console.error('Failed to cache feed in KV:', error);
      // Non-critical, don't throw
    }
  }

  /**
   * Get cached RSS content from KV
   */
  async getCachedFeedFromKV(): Promise<string | null> {
    try {
      return await this.env.HYPEFEED_KV.get('current_feed_xml');
    } catch (error) {
      console.error('Failed to get cached feed from KV:', error);
      return null;
    }
  }
}