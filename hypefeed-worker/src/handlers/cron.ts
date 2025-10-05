import type { Env, ExecutionContext, ScheduledEvent } from '../types/bindings';
import { RSSAggregator } from '../services/aggregator';
import { RSSRenderer } from '../services/renderer';
import { StorageService } from '../services/storage';
import { ChannelService } from '../services/channelService';

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
    const aggregator = new RSSAggregator(env);
    const renderer = new RSSRenderer(env);
    const storage = new StorageService(env);
    const channelService = new ChannelService(env);

    // Step 1: Aggregate RSS feeds from all channels
    console.log('📡 Aggregating RSS feeds from all channels...');
    const { items, errors } = await aggregator.aggregateFeeds();
    
    if (items.length === 0) {
      console.warn('⚠️ No RSS items found - all feeds may be unavailable');
      // Don't return here, still generate a feed with error info
    }

    // Step 2: Get previous feed metadata to check for changes
    const previousMetadata = await storage.getMetadata();
    const previousContentHash = previousMetadata?.contentHash;
    
    // Step 3: Calculate content hash (excluding timestamps from the stats item)
    const contentIdentifier = items.map(item => `${item.guid}|${item.title}`).sort().join('\n');
    const encoder = new TextEncoder();
    const data = encoder.encode(contentIdentifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const currentContentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Step 4: Determine if content has actually changed
    const hasContentChanged = previousContentHash !== currentContentHash;
    
    // Step 5: Use appropriate dates based on whether content changed
    let lastBuildDate: string;
    let feedGeneratedAt: string;
    
    if (hasContentChanged) {
      // Content changed - update dates
      lastBuildDate = new Date().toUTCString();
      feedGeneratedAt = new Date().toISOString();
      console.log('✨ Feed content has changed - updating timestamps');
    } else {
      // No content change - preserve previous dates
      lastBuildDate = previousMetadata?.lastBuildDate || new Date().toUTCString();
      feedGeneratedAt = previousMetadata?.generated_at || new Date().toISOString();
      console.log('📌 Feed content unchanged - preserving timestamps');
    }

    // Step 6: Generate feed metadata
    const activeChannels = await channelService.getActiveChannels();
    const metadata = {
      title: "AI Pioneer YouTube Channels RSS Feeds",
      description: "RSS feeds for top AI pioneer YouTube channels",
      generated_at: feedGeneratedAt,
      total_channels: activeChannels.length,
      success_count: Math.max(0, activeChannels.length - errors.length),
      failure_count: errors.length,
      channels: activeChannels,
      contentHash: currentContentHash,
      lastBuildDate: lastBuildDate,
      hasContentChanged: hasContentChanged
    };

    // Step 7: Render XML feed with stable dates
    console.log('🎨 Rendering RSS XML feed...');
    const xmlContent = renderer.renderFeed(items, {
      lastBuildDate,
      totalItems: items.length,
      errors: errors.length,
      preserveStatsDate: !hasContentChanged  // Pass flag to preserve stats item date
    });

    // Step 8: Store in R2 and cache in KV (only if content changed)
    // Force update on manual trigger (when cron is 'manual')
    const forceUpdate = event.cron === 'manual';
    
    if (hasContentChanged || forceUpdate) {
      console.log(forceUpdate ? '🔄 Force storing RSS feed (manual refresh)...' : '💾 Storing updated RSS feed in R2 and KV...');
      const storePromise = storage.storeCurrentFeed(xmlContent, metadata);
      const cachePromise = storage.cacheFeedInKV(xmlContent, 300);
      
      await Promise.all([storePromise, cachePromise]);
    } else {
      console.log('♻️ Content unchanged - updating cache only');
      // Just refresh the KV cache to extend TTL
      await storage.cacheFeedInKV(xmlContent, 300);
    }

    // Step 9: Cleanup old versions (run periodically)
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
      const storage = new StorageService(env);
      const channelService = new ChannelService(env);
      const [previousMetadata, allChannels] = await Promise.all([
        storage.getMetadata(),
        channelService.getActiveChannels()
      ]);

      const errorMetadata = {
        title: "AI Pioneer YouTube Channels RSS Feeds",
        description: "RSS feeds for top AI pioneer YouTube channels",
        generated_at: previousMetadata?.generated_at || new Date().toISOString(),
        total_channels: allChannels.length,
        success_count: 0,
        failure_count: allChannels.length,
        channels: allChannels,
        contentHash: previousMetadata?.contentHash,
        lastBuildDate: previousMetadata?.lastBuildDate || new Date().toUTCString(),
        hasContentChanged: false
      };
      
      const errorXml = new RSSRenderer(env).renderFeed([], {
        lastBuildDate: errorMetadata.lastBuildDate,
        totalItems: 0,
        errors: 1,
        preserveStatsDate: true
      });

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