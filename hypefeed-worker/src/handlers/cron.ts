import type { Env, ExecutionContext, ScheduledEvent } from '../types/bindings';
import { RSSAggregator } from '../services/aggregator';
import { RSSRenderer } from '../services/renderer';
import { StorageService } from '../services/storage';
import { generateFeedMetadata } from '../data/channels';

/**
 * Cron handler for scheduled RSS feed aggregation
 */
export async function handleScheduledEvent(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const startTime = Date.now();
  
  console.log('🕒 Starting scheduled RSS aggregation at', new Date(event.scheduledTime).toISOString());

  try {
    // Initialize services
    const aggregator = new RSSAggregator();
    const renderer = new RSSRenderer(env);
    const storage = new StorageService(env);

    // Step 1: Aggregate RSS feeds from all channels
    console.log('📡 Aggregating RSS feeds from all channels...');
    const { items, errors } = await aggregator.aggregateFeeds();
    
    if (items.length === 0) {
      console.warn('⚠️ No RSS items found - all feeds may be unavailable');
      // Don't return here, still generate a feed with error info
    }

    // Step 2: Generate feed metadata
    const metadata = generateFeedMetadata();
    metadata.generated_at = new Date().toISOString();
    metadata.failure_count = errors.length;
    metadata.success_count = Math.max(0, metadata.total_channels - errors.length);

    // Step 3: Render XML feed
    console.log('🎨 Rendering RSS XML feed...');
    const xmlContent = renderer.renderFeed(items, {
      lastBuildDate: new Date().toUTCString(),
      totalItems: items.length,
      errors: errors.length
    });

    // Step 4: Store in R2 and cache in KV
    console.log('💾 Storing RSS feed in R2 and KV...');
    const storePromise = storage.storeCurrentFeed(xmlContent, metadata);
    const cachePromise = storage.cacheFeedInKV(xmlContent, 300);
    
    await Promise.all([storePromise, cachePromise]);

    // Step 5: Cleanup old versions (run periodically)
    const shouldCleanup = Math.random() < 0.1; // 10% chance each run
    if (shouldCleanup) {
      console.log('🧹 Cleaning up old feed versions...');
      ctx.waitUntil(storage.cleanupOldVersions(100));
    }

    // Log completion
    const duration = Date.now() - startTime;
    console.log(`✅ RSS aggregation completed successfully in ${duration}ms:`, {
      itemsAggregated: items.length,
      channelsSuccessful: metadata.success_count,
      channelsFailed: metadata.failure_count,
      xmlSizeBytes: xmlContent.length,
      duration: `${duration}ms`
    });

    // Log any errors for monitoring
    if (errors.length > 0) {
      console.warn('⚠️ Feed fetch errors:', errors.map(e => ({
        feedUrl: e.feedUrl,
        error: e.message
      })));
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ RSS aggregation failed after ${duration}ms:`, error);
    
    // Try to store error information for monitoring
    try {
      const errorMetadata = generateFeedMetadata();
      errorMetadata.generated_at = new Date().toISOString();
      errorMetadata.failure_count = errorMetadata.total_channels;
      errorMetadata.success_count = 0;
      
      const errorXml = new RSSRenderer(env).renderFeed([], {
        lastBuildDate: new Date().toUTCString(),
        totalItems: 0,
        errors: 1
      });
      
      const storage = new StorageService(env);
      await storage.storeCurrentFeed(errorXml, errorMetadata);
      
    } catch (storageError) {
      console.error('Failed to store error feed:', storageError);
    }

    // Re-throw for Cloudflare Workers error handling
    throw error;
  }
}

/**
 * Manual refresh handler (can be called from HTTP endpoint)
 */
export async function handleManualRefresh(
  env: Env,
  ctx: ExecutionContext
): Promise<{
  success: boolean;
  message: string;
  stats?: {
    itemsAggregated: number;
    channelsSuccessful: number;
    channelsFailed: number;
    duration: number;
  };
}> {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Manual RSS refresh triggered');
    
    // Execute the same logic as scheduled event
    await handleScheduledEvent(
      {
        scheduledTime: Date.now(),
        cron: 'manual'
      },
      env,
      ctx
    );
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      message: 'RSS feed refreshed successfully',
      stats: {
        itemsAggregated: 0, // Would need to return from handleScheduledEvent
        channelsSuccessful: 0,
        channelsFailed: 0,
        duration
      }
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Manual refresh failed:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stats: {
        itemsAggregated: 0,
        channelsSuccessful: 0,
        channelsFailed: 1,
        duration
      }
    };
  }
}

/**
 * Health check for cron functionality
 */
export function getCronHealth(): {
  status: string;
  schedule: string;
  nextRun?: string;
  lastRun?: string;
} {
  return {
    status: 'operational',
    schedule: '*/10 * * * *', // Every 10 minutes
    nextRun: 'Managed by Cloudflare Workers',
    lastRun: 'Check /health endpoint for last update time'
  };
}