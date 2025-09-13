import { XMLParser } from 'fast-xml-parser';
import type { Channel, FeedItem } from '../types/bindings';
import { FeedFetchError } from '../types/bindings';
import { getActiveChannels } from '../data/channels';

// XML parser configuration for RSS feeds
const xmlParserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  parseTrueNumberOnly: false,
  trimValues: true
};

// RSS feed aggregation service
export class RSSAggregator {
  private parser: XMLParser;
  private maxRetries: number = 3;
  private timeout: number = 10000; // 10 seconds

  constructor() {
    this.parser = new XMLParser(xmlParserOptions);
  }

  /**
   * Aggregate RSS feeds from all active channels
   */
  async aggregateFeeds(): Promise<{ items: FeedItem[], errors: FeedFetchError[] }> {
    const channels = getActiveChannels();
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
        
        return this.extractFeedItems(feedData, channel);

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
      // Extract title
      const title = this.extractText(item.title) || 'Untitled';
      
      // Extract description
      const description = this.extractText(item.description) || 
                         this.extractText(item['media:group']?.['media:description']) ||
                         this.extractText(item.summary) ||
                         '';

      // Extract link
      const link = this.extractLink(item) || channel.youtube_url;

      // Extract publication date
      const pubDate = this.extractDate(item) || new Date().toISOString();

      // Extract GUID
      const guid = this.extractText(item.guid) || 
                  this.extractText(item.id) ||
                  `${channel.channel_id}-${Date.now()}`;

      // Extract thumbnail
      const thumbnailUrl = this.extractThumbnail(item) || undefined;

      // Extract author
      const author = this.extractText(item.author) || 
                    this.extractText(item['media:group']?.['media:credit']) ||
                    channel.name;

      return {
        guid,
        title: this.cleanText(title),
        description: this.cleanText(description),
        link,
        pubDate,
        author,
        category: channel.category,
        channelName: channel.name,
        channelId: channel.channel_id,
        thumbnailUrl
      };

    } catch (error) {
      console.error(`Failed to transform item from ${channel.name}:`, error);
      return null;
    }
  }

  /**
   * Extract text from XML element (handles various formats)
   */
  private extractText(element: any): string | null {
    if (!element) return null;
    
    if (typeof element === 'string') return element;
    if (element['#text']) return element['#text'];
    if (element._text) return element._text;
    if (typeof element === 'object' && element.toString) return element.toString();
    
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
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, (match) => { // Decode HTML entities
        const entities: Record<string, string> = {
          '&amp;': '&',
          '&lt;': '<',
          '&gt;': '>',
          '&quot;': '"',
          '&apos;': "'"
        };
        return entities[match] || match;
      })
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
}