// Cloudflare Workers runtime bindings

export interface Env {
  // R2 bucket for storing RSS feeds
  HYPEFEED_BUCKET: R2Bucket;
  
  // KV namespace for metadata and caching
  HYPEFEED_KV: KVNamespace;
  
  // Environment variables
  ENVIRONMENT: string;
  FEED_TITLE: string;
  FEED_DESCRIPTION: string;
  FEED_LANGUAGE: string;
  MAX_FEED_ITEMS: string;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

// RSS feed item structure
export interface FeedItem {
  guid: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  author?: string;
  category?: string;
  channelName: string;
  channelId: string;
  thumbnailUrl?: string;
}

// Channel configuration
export interface Channel {
  name: string;
  handle: string;
  channel_id: string;
  youtube_url: string;
  rss_feed_url: string;
  subscribers: string;
  description: string;
  posting_frequency: string;
  category: string;
  status: 'PENDING_EVALUATION' | 'TRYOUT' | 'CANDIDATE' | 'LIVE' | 'DUPLICATE' | 'DROP';
}

// Combined feed metadata
export interface FeedMetadata {
  title: string;
  description: string;
  generated_at: string;
  total_channels: number;
  success_count: number;
  failure_count: number;
  channels: Channel[];
}

// Storage keys
export const StorageKeys = {
  CURRENT_FEED: 'feeds/current.xml',
  FEED_METADATA: 'meta/last-update.json',
  CHANNEL_CONFIG: 'data/channels.json',
  feedVersion: (timestamp: string) => `feeds/${timestamp}.xml`,
} as const;

// Cron event structure
export interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

// Error types
export class HypeFeedError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'HypeFeedError';
  }
}

export class FeedFetchError extends HypeFeedError {
  constructor(message: string, public feedUrl: string) {
    super(message, 'FEED_FETCH_ERROR', 502);
  }
}

export class StorageError extends HypeFeedError {
  constructor(message: string, public operation: string) {
    super(message, 'STORAGE_ERROR', 500);
  }
}