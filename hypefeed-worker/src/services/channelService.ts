import { withPrisma } from '../db/client';
import type { Env, Channel } from '../types/bindings';
import type { Prisma } from '@prisma/client';

/**
 * Service for managing YouTube channels in the database
 */
export class ChannelService {
  constructor(private env: Env) {}

  /**
   * Get all active channels (LIVE, TRYOUT, CANDIDATE)
   */
  async getActiveChannels(): Promise<Channel[]> {
    return withPrisma(this.env, async (prisma) => {
      const channels = await prisma.channel.findMany({
        where: {
          status: {
            in: ['LIVE', 'TRYOUT', 'CANDIDATE']
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      return channels.map(this.mapToChannelInterface);
    });
  }

  /**
   * Get all channels
   */
  async getAllChannels(): Promise<Channel[]> {
    return withPrisma(this.env, async (prisma) => {
      const channels = await prisma.channel.findMany({
        orderBy: {
          name: 'asc'
        }
      });

      return channels.map(this.mapToChannelInterface);
    });
  }

  /**
   * Get channel by channel ID (YouTube channel ID)
   */
  async getChannelById(channelId: string): Promise<Channel | null> {
    return withPrisma(this.env, async (prisma) => {
      const channel = await prisma.channel.findUnique({
        where: {
          channelId: channelId
        }
      });

      return channel ? this.mapToChannelInterface(channel) : null;
    });
  }

  /**
   * Get channels by category
   */
  async getChannelsByCategory(category: string): Promise<Channel[]> {
    return withPrisma(this.env, async (prisma) => {
      const channels = await prisma.channel.findMany({
        where: {
          category: category
        },
        orderBy: {
          name: 'asc'
        }
      });

      return channels.map(this.mapToChannelInterface);
    });
  }

  /**
   * Create a new channel
   */
  async createChannel(data: Omit<Channel, 'id'>): Promise<Channel> {
    return withPrisma(this.env, async (prisma) => {
      const channel = await prisma.channel.create({
        data: {
          name: data.name,
          handle: data.handle,
          channelId: data.channel_id,
          youtubeUrl: data.youtube_url,
          rssFeedUrl: data.rss_feed_url,
          subscribers: data.subscribers,
          description: data.description,
          postingFrequency: data.posting_frequency,
          category: data.category,
          status: data.status
        }
      });

      return this.mapToChannelInterface(channel);
    });
  }

  /**
   * Update channel status
   */
  async updateChannelStatus(channelId: string, status: Channel['status']): Promise<Channel | null> {
    return withPrisma(this.env, async (prisma) => {
      const channel = await prisma.channel.update({
        where: {
          channelId: channelId
        },
        data: {
          status: status
        }
      });

      return this.mapToChannelInterface(channel);
    });
  }

  /**
   * Update channel details
   */
  async updateChannel(channelId: string, data: Partial<Omit<Channel, 'channel_id'>>): Promise<Channel | null> {
    return withPrisma(this.env, async (prisma) => {
      const updateData: Prisma.ChannelUpdateInput = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.handle !== undefined) updateData.handle = data.handle;
      if (data.youtube_url !== undefined) updateData.youtubeUrl = data.youtube_url;
      if (data.rss_feed_url !== undefined) updateData.rssFeedUrl = data.rss_feed_url;
      if (data.subscribers !== undefined) updateData.subscribers = data.subscribers;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.posting_frequency !== undefined) updateData.postingFrequency = data.posting_frequency;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.status !== undefined) updateData.status = data.status;

      const channel = await prisma.channel.update({
        where: {
          channelId: channelId
        },
        data: updateData
      });

      return this.mapToChannelInterface(channel);
    });
  }

  /**
   * Update last fetched timestamp
   */
  async updateLastFetched(channelId: string, success: boolean): Promise<void> {
    await withPrisma(this.env, async (prisma) => {
      const updateData: Prisma.ChannelUpdateInput = {
        lastFetchedAt: new Date()
      };

      if (success) {
        updateData.lastSuccessAt = new Date();
      }

      await prisma.channel.update({
        where: {
          channelId: channelId
        },
        data: updateData
      });
    });
  }

  /**
   * Log fetch attempt
   */
  async logFetchAttempt(
    channelId: string, 
    success: boolean, 
    itemCount?: number, 
    error?: string,
    duration?: number
  ): Promise<void> {
    await withPrisma(this.env, async (prisma) => {
      await prisma.fetchLog.create({
        data: {
          channelId,
          success,
          itemCount,
          error,
          duration
        }
      });
    });
  }

  /**
   * Bulk create channels (for seeding)
   */
  async bulkCreateChannels(channels: Omit<Channel, 'id'>[]): Promise<number> {
    return withPrisma(this.env, async (prisma) => {
      const result = await prisma.channel.createMany({
        data: channels.map(channel => ({
          name: channel.name,
          handle: channel.handle,
          channelId: channel.channel_id,
          youtubeUrl: channel.youtube_url,
          rssFeedUrl: channel.rss_feed_url,
          subscribers: channel.subscribers,
          description: channel.description,
          postingFrequency: channel.posting_frequency,
          category: channel.category,
          status: channel.status
        })),
        skipDuplicates: true
      });

      return result.count;
    });
  }

  /**
   * Map Prisma Channel model to Channel interface
   */
  private mapToChannelInterface(dbChannel: any): Channel {
    return {
      name: dbChannel.name,
      handle: dbChannel.handle,
      channel_id: dbChannel.channelId,
      youtube_url: dbChannel.youtubeUrl,
      rss_feed_url: dbChannel.rssFeedUrl,
      subscribers: dbChannel.subscribers,
      description: dbChannel.description,
      posting_frequency: dbChannel.postingFrequency,
      category: dbChannel.category,
      status: dbChannel.status as Channel['status']
    };
  }
}