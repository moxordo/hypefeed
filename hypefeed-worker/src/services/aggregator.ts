import { XMLParser } from 'fast-xml-parser';
import type { Channel, FeedItem, Env } from '../types/bindings';
import { FeedFetchError } from '../types/bindings';
import { ChannelService } from './channelService';

// XML parser configuration for RSS feeds
const xmlParserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  parseTrueNumberOnly: false,
  trimValues: true
};

// Content normalization configuration
const CONTENT_LIMITS = {
  MAX_TITLE_LENGTH: 120,
  MAX_DESCRIPTION_LENGTH: 300,
  TRUNCATION_SUFFIX: '...'
};

// RSS feed aggregation service
export class RSSAggregator {
  private parser: XMLParser;
  private maxRetries: number = 3;
  private timeout: number = 10000; // 10 seconds
  private channelService: ChannelService;

  constructor(env: Env) {
    this.parser = new XMLParser(xmlParserOptions);
    this.channelService = new ChannelService(env);
  }

  /**
   * Aggregate RSS feeds from all active channels
   */
  async aggregateFeeds(): Promise<{ items: FeedItem[], errors: FeedFetchError[] }> {
    const channels = await this.channelService.getActiveChannels();
    const errors: FeedFetchError[] = [];
    const allItems: FeedItem[] = [];

    console.log(`Starting RSS aggregation for ${channels.length} channels`);

    // Fetch feeds in parallel with concurrency control
    const batchSize = 5; // Process 5 feeds at a time
    for (let i = 0; i < channels.length; i += batchSize) {
      const batch = channels.slice(i, i + batchSize);
      const batchPromises = batch.map(channel => this.fetchChannelFeed(channel));
      
      const results = await Promise.allSettled(batchPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allItems.push(...result.value);
        } else {
          const channel = batch[index];
          if (channel) {
            const error = new FeedFetchError(
              `Failed to fetch feed for ${channel.name}: ${result.reason}`,
              channel.rss_feed_url
            );
            errors.push(error);
          }
        }
      });
    }

    // Sort items by publication date (newest first)
    const sortedItems = this.sortItemsByDate(allItems);
    
    console.log(`RSS aggregation completed: ${sortedItems.length} items, ${errors.length} errors`);
    
    return {
      items: sortedItems,
      errors
    };
  }

  /**
   * Fetch and parse RSS feed for a single channel
   */
  private async fetchChannelFeed(channel: Channel): Promise<FeedItem[]> {
    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Fetching feed for ${channel.name} (attempt ${attempt}/${this.maxRetries})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(channel.rss_feed_url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'HypeFeed-Aggregator/1.0 (+https://hypefeed.ai)',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const xmlText = await response.text();
        const feedData = this.parser.parse(xmlText);
        
        const items = this.extractFeedItems(feedData, channel);
        const duration = Date.now() - startTime;
        
        // Log successful fetch to database
        await this.channelService.updateLastFetched(channel.channel_id, true);
        await this.channelService.logFetchAttempt(
          channel.channel_id,
          true,
          items.length,
          undefined,
          duration
        );
        
        return items;

      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed for ${channel.name}: ${lastError.message}`);
        
        // Add exponential backoff delay
        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await this.sleep(delay);
        }
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Log failed fetch to database
    await this.channelService.updateLastFetched(channel.channel_id, false);
    await this.channelService.logFetchAttempt(
      channel.channel_id,
      false,
      undefined,
      lastError?.message,
      duration
    );

    throw new Error(`Failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Extract feed items from parsed XML data
   */
  private extractFeedItems(feedData: any, channel: Channel): FeedItem[] {
    try {
      // Navigate RSS structure (handle both 'rss' and 'feed' root elements)
      const items = feedData.rss?.channel?.item || feedData.feed?.entry || [];
      const itemsArray = Array.isArray(items) ? items : [items];

      return itemsArray
        .filter((item: any) => item && (item.title || item.title?.['#text']))
        .map((item: any) => this.transformToFeedItem(item, channel))
        .filter((item: FeedItem | null) => item !== null) as FeedItem[];

    } catch (error) {
      console.error(`Failed to extract items from ${channel.name}:`, error);
      return [];
    }
  }

  /**
   * Transform raw XML item to standardized FeedItem
   */
  private transformToFeedItem(item: any, channel: Channel): FeedItem | null {
    try {
      // Extract raw title
      const rawTitle = this.extractText(item.title) || 'Untitled';

      // Extract raw description
      const rawDescription = this.extractText(item.description) ||
                            this.extractText(item['media:group']?.['media:description']) ||
                            this.extractText(item.summary) ||
                            '';

      // Extract link
      const link = this.extractLink(item) || channel.youtube_url;

      // Extract publication date
      const pubDate = this.extractDate(item) || new Date().toISOString();

      // Extract GUID - prefer video ID for consistency
      let guid = this.extractText(item.guid) || this.extractText(item.id);

      // If GUID is not found or is an object, try to extract from video ID
      if (!guid || guid === '[object Object]') {
        const videoId = this.extractVideoId(link);
        guid = videoId ? `yt:video:${videoId}` : `${channel.channel_id}-${Date.now()}`;
      }

      // Extract thumbnail
      const thumbnailUrl = this.extractThumbnail(item) || undefined;

      // Extract and normalize author - always use channel name for consistency
      // This prevents [object Object] issues
      const author = channel.name;

      // Clean and normalize content
      const cleanedTitle = this.cleanText(rawTitle);
      const cleanedDescription = this.cleanText(rawDescription);

      // Apply normalization
      const normalizedTitle = this.normalizeTitle(cleanedTitle, channel.name);
      const normalizedDescription = this.normalizeDescription(cleanedDescription);

      return {
        guid,
        title: normalizedTitle,
        description: normalizedDescription,
        link,
        pubDate,
        author,
        category: channel.category,
        channelName: channel.name,
        channelId: channel.channel_id,
        thumbnailUrl,
        channelSubscribers: channel.subscribers
      };

    } catch (error) {
      console.error(`Failed to transform item from ${channel.name}:`, error);
      return null;
    }
  }

  /**
   * Extract text from XML element (handles various formats)
   * Prevents [object Object] serialization issues
   */
  private extractText(element: any): string | null {
    if (!element) return null;

    // Handle string values
    if (typeof element === 'string') return element;

    // Handle number values
    if (typeof element === 'number') return String(element);

    // Handle boolean values
    if (typeof element === 'boolean') return String(element);

    // Handle object with text properties
    if (typeof element === 'object') {
      // Try common text property names
      if (element['#text']) return String(element['#text']);
      if (element._text) return String(element._text);
      if (element.text) return String(element.text);

      // Prevent [object Object] by returning null instead of calling toString()
      // This ensures we don't serialize objects incorrectly
      return null;
    }

    return null;
  }

  /**
   * Extract link from XML item (handles YouTube RSS format)
   */
  private extractLink(item: any): string | null {
    // Try standard RSS link
    if (item.link) {
      if (typeof item.link === 'string') return item.link;
      if (item.link['@_href']) return item.link['@_href'];
    }

    // Try YouTube-specific format
    if (item['yt:videoId']) {
      return `https://www.youtube.com/watch?v=${item['yt:videoId']}`;
    }

    // Try Atom format
    if (item.id && typeof item.id === 'string' && item.id.includes('youtube.com')) {
      return item.id;
    }

    return null;
  }

  /**
   * Extract publication date from XML item
   */
  private extractDate(item: any): string | null {
    const dateFields = ['pubDate', 'published', 'updated', 'date'];
    
    for (const field of dateFields) {
      const dateValue = this.extractText(item[field]);
      if (dateValue) {
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString();
        }
      }
    }

    return null;
  }

  /**
   * Extract thumbnail URL from XML item
   */
  private extractThumbnail(item: any): string | null {
    // YouTube RSS format
    if (item['media:group']?.['media:thumbnail']?.['@_url']) {
      return item['media:group']['media:thumbnail']['@_url'];
    }

    // Standard media enclosure
    if (item.enclosure?.['@_url']) {
      const url = item.enclosure['@_url'];
      if (url.includes('jpg') || url.includes('png') || url.includes('jpeg')) {
        return url;
      }
    }

    return null;
  }

  /**
   * Clean and sanitize text content
   */
  private cleanText(text: string): string {
    if (!text) return '';

    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, (match) => { // Decode HTML entities
        const entities: Record<string, string> = {
          '&amp;': '&',
          '&lt;': '<',
          '&gt;': '>',
          '&quot;': '"',
          '&apos;': "'",
          '&#39;': "'",
          '&nbsp;': ' '
        };
        return entities[match] || match;
      })
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')   // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/[ \t]+/g, ' ') // Collapse multiple spaces/tabs
      .trim();
  }

  /**
   * Sort feed items by publication date (newest first)
   */
  private sortItemsByDate(items: FeedItem[]): FeedItem[] {
    return items.sort((a, b) => {
      const dateA = new Date(a.pubDate);
      const dateB = new Date(b.pubDate);
      return dateB.getTime() - dateA.getTime();
    });
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Truncate text at word boundary with ellipsis
   */
  private truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }

    // Find last word boundary before maxLength
    const truncated = text.substring(0, maxLength - CONTENT_LIMITS.TRUNCATION_SUFFIX.length);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + CONTENT_LIMITS.TRUNCATION_SUFFIX;
    }

    return truncated + CONTENT_LIMITS.TRUNCATION_SUFFIX;
  }

  /**
   * Normalize title: remove channel name prefixes, excessive emojis, and limit length
   */
  private normalizeTitle(title: string, channelName: string): string {
    if (!title) return 'Untitled';

    let normalized = title;

    // Remove channel name prefix if present (e.g., "Channel Name: Video Title")
    const channelPrefix = new RegExp(`^${this.escapeRegex(channelName)}\\s*[:-]\\s*`, 'i');
    normalized = normalized.replace(channelPrefix, '');

    // Remove excessive leading/trailing emojis and whitespace
    normalized = normalized.trim();

    // Truncate to max length
    return this.truncateText(normalized, CONTENT_LIMITS.MAX_TITLE_LENGTH);
  }

  /**
   * Normalize description: ensure consistent format and length
   */
  private normalizeDescription(description: string): string {
    if (!description) return '';

    let normalized = description;

    // Remove excessive newlines (more than 2 consecutive)
    normalized = normalized.replace(/\n{3,}/g, '\n\n');

    // Remove excessive spaces
    normalized = normalized.replace(/[ \t]{2,}/g, ' ');

    // Trim
    normalized = normalized.trim();

    // Truncate to max length
    return this.truncateText(normalized, CONTENT_LIMITS.MAX_DESCRIPTION_LENGTH);
  }

  /**
   * Extract YouTube video ID from various URL formats
   */
  private extractVideoId(url: string): string | null {
    if (!url) return null;

    // Handle youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return watchMatch[1];

    // Handle youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return shortMatch[1];

    // Handle youtube.com/shorts/VIDEO_ID
    const shortsMatch = url.match(/\/shorts\/([^?]+)/);
    if (shortsMatch) return shortsMatch[1];

    return null;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}