import { describe, it, expect } from 'vitest';
import { YouTubeURLParser } from './parser.js';

describe('YouTubeURLParser', () => {
  describe('parse', () => {
    it('should parse channel ID URLs', () => {
      const urls = [
        'https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw',
        'youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw',
        'http://youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw'
      ];

      for (const url of urls) {
        const result = YouTubeURLParser.parse(url);
        expect(result.type).toBe('channel');
        expect(result.sourceType).toBe('channel_id');
        expect(result.id).toBe('UCXuqSBlHAE6Xw-yeJA0Tunw');
      }
    });

    it('should parse handle URLs', () => {
      const urls = [
        'https://www.youtube.com/@LinusTechTips',
        'youtube.com/@LinusTechTips',
        'https://youtube.com/@LinusTechTips/videos'
      ];

      for (const url of urls) {
        const result = YouTubeURLParser.parse(url);
        expect(result.type).toBe('channel');
        expect(result.sourceType).toBe('handle');
        expect(result.id).toBe('LinusTechTips');
      }
    });

    it('should parse custom channel URLs', () => {
      const urls = [
        'https://www.youtube.com/c/LinusTechTips',
        'youtube.com/c/LinusTechTips',
        'https://youtube.com/LinusTechTips'
      ];

      for (const url of urls) {
        const result = YouTubeURLParser.parse(url);
        expect(result.type).toBe('channel');
        expect(result.sourceType).toBe('custom_name');
        expect(result.id).toBe('LinusTechTips');
      }
    });

    it('should parse user URLs', () => {
      const urls = [
        'https://www.youtube.com/user/LinusTechTips',
        'youtube.com/user/LinusTechTips'
      ];

      for (const url of urls) {
        const result = YouTubeURLParser.parse(url);
        expect(result.type).toBe('user');
        expect(result.sourceType).toBe('username');
        expect(result.id).toBe('LinusTechTips');
      }
    });

    it('should parse playlist URLs', () => {
      const urls = [
        'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
        'youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'
      ];

      for (const url of urls) {
        const result = YouTubeURLParser.parse(url);
        expect(result.type).toBe('playlist');
        expect(result.sourceType).toBe('playlist_id');
        expect(result.id).toBe('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf');
      }
    });

    it('should parse video URLs with playlist', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf';
      const result = YouTubeURLParser.parse(url);
      expect(result.type).toBe('playlist');
      expect(result.sourceType).toBe('playlist_id');
      expect(result.id).toBe('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf');
    });

    it('should parse standalone video URLs', () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'youtube.com/watch?v=dQw4w9WgXcQ&t=42s'
      ];

      for (const url of urls) {
        const result = YouTubeURLParser.parse(url);
        expect(result.type).toBe(null);
        expect(result.sourceType).toBe('video');
        expect(result.id).toBe('dQw4w9WgXcQ');
      }
    });

    it('should parse shorts URLs', () => {
      const url = 'https://www.youtube.com/shorts/abcdefghijk';
      const result = YouTubeURLParser.parse(url);
      expect(result.type).toBe(null);
      expect(result.sourceType).toBe('short');
      expect(result.id).toBe('abcdefghijk');
    });

    it('should parse live URLs', () => {
      const url = 'https://www.youtube.com/live/abcdefghijk';
      const result = YouTubeURLParser.parse(url);
      expect(result.type).toBe(null);
      expect(result.sourceType).toBe('live');
      expect(result.id).toBe('abcdefghijk');
    });

    it('should parse embed URLs', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const result = YouTubeURLParser.parse(url);
      expect(result.type).toBe(null);
      expect(result.sourceType).toBe('video');
      expect(result.id).toBe('dQw4w9WgXcQ');
    });

    it('should handle mobile URLs', () => {
      const url = 'm.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = YouTubeURLParser.parse(url);
      expect(result.type).toBe(null);
      expect(result.sourceType).toBe('video');
      expect(result.id).toBe('dQw4w9WgXcQ');
    });

    it('should handle various TLDs', () => {
      const urls = [
        'youtube.co.uk/watch?v=dQw4w9WgXcQ',
        'youtube.de/watch?v=dQw4w9WgXcQ',
        'youtube.fr/watch?v=dQw4w9WgXcQ'
      ];

      for (const url of urls) {
        const result = YouTubeURLParser.parse(url);
        expect(result.id).toBe('dQw4w9WgXcQ');
      }
    });
  });

  describe('generateRSSUrl', () => {
    it('should generate RSS URL for channel ID', async () => {
      const parsed = YouTubeURLParser.parse('https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw');
      const rssUrl = await YouTubeURLParser.generateRSSUrl(parsed);
      expect(rssUrl).toBe('https://www.youtube.com/feeds/videos.xml?channel_id=UCXuqSBlHAE6Xw-yeJA0Tunw');
    });

    it('should generate RSS URL for user', async () => {
      const parsed = YouTubeURLParser.parse('https://www.youtube.com/user/LinusTechTips');
      const rssUrl = await YouTubeURLParser.generateRSSUrl(parsed);
      expect(rssUrl).toBe('https://www.youtube.com/feeds/videos.xml?user=LinusTechTips');
    });

    it('should generate RSS URL for playlist', async () => {
      const parsed = YouTubeURLParser.parse('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf');
      const rssUrl = await YouTubeURLParser.generateRSSUrl(parsed);
      // Note: This might return a channel RSS if it can extract the channel from the playlist
      expect(rssUrl).toMatch(/https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?(channel_id=UC[\w-]{22}|playlist_id=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf)/);
    });

    it('should convert UU playlist to channel feed', async () => {
      const parsed = {
        type: 'playlist' as const,
        sourceType: 'playlist_id' as const,
        id: 'UUXuqSBlHAE6Xw-yeJA0Tunw',
        originalUrl: '',
        normalizedUrl: ''
      };
      const rssUrl = await YouTubeURLParser.generateRSSUrl(parsed);
      expect(rssUrl).toBe('https://www.youtube.com/feeds/videos.xml?channel_id=UCXuqSBlHAE6Xw-yeJA0Tunw');
    });

    it('should try to resolve handles to channel RSS', async () => {
      const parsed = YouTubeURLParser.parse('https://www.youtube.com/@LinusTechTips');
      const rssUrl = await YouTubeURLParser.generateRSSUrl(parsed);
      // May return null if can't fetch the page, or a channel RSS if successful
      expect(rssUrl === null || rssUrl.includes('channel_id=')).toBe(true);
    });

    it('should try to resolve custom names to channel RSS', async () => {
      const parsed = YouTubeURLParser.parse('https://www.youtube.com/c/LinusTechTips');
      const rssUrl = await YouTubeURLParser.generateRSSUrl(parsed);
      // May return null if can't fetch the page, or a channel RSS if successful
      expect(rssUrl === null || rssUrl.includes('channel_id=')).toBe(true);
    });

    it('should try to extract channel RSS from videos', async () => {
      const parsed = YouTubeURLParser.parse('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      const rssUrl = await YouTubeURLParser.generateRSSUrl(parsed);
      // May return null if can't fetch the page, or a channel RSS if successful
      expect(rssUrl === null || rssUrl.includes('channel_id=')).toBe(true);
    });
  });
});