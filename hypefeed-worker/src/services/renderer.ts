import { format } from 'date-fns';
import type { FeedItem, Env } from '../types/bindings';

/**
 * RSS XML renderer service for generating high-quality RSS feeds
 */
export class RSSRenderer {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Render RSS feed XML from feed items
   */
  renderFeed(items: FeedItem[], metadata?: {
    lastBuildDate?: string;
    totalItems?: number;
    errors?: number;
    preserveStatsDate?: boolean;
  }): string {
    const maxItems = parseInt(this.env.MAX_FEED_ITEMS, 10) || 50;
    const limitedItems = items.slice(0, maxItems);
    
    const buildDate = metadata?.lastBuildDate || new Date().toUTCString();
    const feedTitle = this.env.FEED_TITLE || 'AI Pioneer YouTube Channels - HypeFeed';
    const feedDescription = this.env.FEED_DESCRIPTION || 'Curated RSS feed from top AI pioneer YouTube channels';
    const language = this.env.FEED_LANGUAGE || 'en-US';

    // Build RSS XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">
  <channel>
    <title><![CDATA[${this.escapeXml(feedTitle)}]]></title>
    <description><![CDATA[${this.escapeXml(feedDescription)}]]></description>
    <link>https://hypefeed.ai</link>
    <atom:link href="https://hypefeed-worker.andy-hypefeed.workers.dev/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <generator>HypeFeed RSS Aggregator v1.0</generator>
    <language>${language}</language>
    <category>Technology</category>
    <category>Artificial Intelligence</category>
    <category>Machine Learning</category>
    <managingEditor>noreply@hypefeed.ai (HypeFeed)</managingEditor>
    <webMaster>noreply@hypefeed.ai (HypeFeed)</webMaster>
    <ttl>30</ttl>
    <sy:updatePeriod>hourly</sy:updatePeriod>
    <sy:updateFrequency>2</sy:updateFrequency>
    
    ${limitedItems.map(item => this.renderFeedItem(item)).join('\n    ')}
  </channel>
</rss>`;

    return xml;
  }

  /**
   * Render individual RSS feed item
   */
  private renderFeedItem(item: FeedItem): string {
    const pubDate = new Date(item.pubDate).toUTCString();
    const guid = item.guid || `${item.channelId}-${Date.now()}`;
    
    // Create rich description with channel info and thumbnail
    const richDescription = this.createRichDescription(item);
    
    return `<item>
      <title><![CDATA[${this.escapeXml(item.title)}]]></title>
      <description><![CDATA[${richDescription}]]></description>
      <content:encoded><![CDATA[${richDescription}]]></content:encoded>
      <link>${this.escapeXml(item.link)}</link>
      <guid isPermaLink="false">${this.escapeXml(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category><![CDATA[${this.formatCategory(item.category || 'unknown')}]]></category>
      <dc:creator><![CDATA[${this.escapeXml(item.author || item.channelName || 'Unknown')}]]></dc:creator>
      <source url="${this.getChannelRSSUrl(item.channelId)}"><![CDATA[${this.escapeXml(item.channelName || 'Unknown')}]]></source>
      ${item.thumbnailUrl ? `<media:thumbnail url="${this.escapeXml(item.thumbnailUrl)}"/>` : ''}
    </item>`;
  }

  /**
   * Create rich HTML description for feed item
   * Uses normalized descriptions from aggregator for consistency
   */
  private createRichDescription(item: FeedItem): string {
    const channelBadge = this.getChannelBadge(item.category || 'unknown');
    const thumbnail = item.thumbnailUrl ?
      `<img src="${this.escapeXml(item.thumbnailUrl || '')}" alt="Video thumbnail" style="max-width: 120px; height: auto; float: left; margin: 0 15px 10px 0; border-radius: 8px;">` : '';

    const subscriberCount = item.channelSubscribers;

    // Description is already normalized by aggregator (max 300 chars)
    // Display it only if it's not empty
    const descriptionHtml = item.description
      ? `<div style="margin-bottom: 15px; color: #333;">${this.escapeXml(item.description)}</div>`
      : '';

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
        ${thumbnail}
        <div style="margin-bottom: 12px;">
          <strong style="color: #1a73e8;">🎥 ${this.escapeXml(item.channelName || 'Unknown')}</strong>
          ${channelBadge}
          ${subscriberCount ? `<span style="color: #666; font-size: 0.9em;"> • ${subscriberCount} subscribers</span>` : ''}
        </div>

        ${descriptionHtml}

        <div style="clear: both; padding-top: 10px; border-top: 1px solid #eee; font-size: 0.9em; color: #666;">
          <span>📅 ${format(new Date(item.pubDate), 'MMM dd, yyyy • h:mm a')}</span>
          <span style="margin-left: 15px;">🏷️ ${this.formatCategory(item.category || 'unknown')}</span>
        </div>

        <div style="margin-top: 10px;">
          <a href="${this.escapeXml(item.link)}" style="background: #ff0000; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: 500;">
            ▶️ Watch on YouTube
          </a>
        </div>
      </div>
    `;
  }


  /**
   * Get channel statistics from items
   */
  private getChannelStatistics(items: FeedItem[]): {
    totalChannels: number;
    topChannels: Array<{ name: string; count: number; }>;
  } {
    const channelCounts = items.reduce((acc, item) => {
      acc[item.channelName] = (acc[item.channelName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topChannels = Object.entries(channelCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalChannels: Object.keys(channelCounts).length,
      topChannels
    };
  }

  /**
   * Get category statistics from items
   */
  private getCategoryStatistics(items: FeedItem[]): {
    totalCategories: number;
    categories: Array<{ category: string; count: number; }>;
  } {
    const categoryCounts = items.reduce((acc, item) => {
      const category = item.category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalCategories: Object.keys(categoryCounts).length,
      categories
    };
  }

  /**
   * Get channel badge emoji based on category
   */
  private getChannelBadge(category: string): string {
    const badges: Record<string, string> = {
      'research_analysis': '🔬',
      'education_tutorials': '📚',
      'tools_practical': '🛠️',
      'education_academic': '🎓',
      'programming_tutorials': '💻',
      'ai_video_production': '🎬',
      'deep_learning_expert': '🧠',
    };
    
    return badges[category] ? `<span style="margin-left: 8px;">${badges[category]}</span>` : '';
  }

  /**
   * Format category for display
   */
  private formatCategory(category: string): string {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get channel RSS URL by channel ID
   */
  private getChannelRSSUrl(channelId: string): string {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}