import { TranscriptEntry, CaptionTrack, VideoInfo, TranscriptOptions, TranscriptResult } from './types.js';

export class YouTubeTranscript {
  private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  /**
   * Fetch YouTube video page and extract caption tracks
   */
  private static async fetchVideoInfo(videoId: string): Promise<VideoInfo> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch video page: ${response.status}`);
      }

      const html = await response.text();
      
      // Extract video title
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : undefined;

      // Extract caption tracks from the page
      const captionTracks = this.extractCaptionTracks(html);
      
      if (captionTracks.length === 0) {
        // Check if the video exists
        if (html.includes('Video unavailable') || html.includes('This video isn\'t available')) {
          throw new Error('Video unavailable or does not exist');
        }
        throw new Error('No captions available for this video (captions may be disabled or not provided)');
      }

      return {
        videoId,
        title,
        captionTracks
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch video info: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Extract caption track URLs from YouTube HTML
   */
  private static extractCaptionTracks(html: string): CaptionTrack[] {
    const tracks: CaptionTrack[] = [];
    
    // Try to find the caption tracks in the ytInitialPlayerResponse
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    
    if (playerResponseMatch) {
      try {
        const playerResponse = JSON.parse(playerResponseMatch[1]);
        const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        
        if (Array.isArray(captions)) {
          for (const track of captions) {
            if (track.baseUrl) {
              tracks.push({
                languageCode: track.languageCode || 'unknown',
                languageName: track.name?.simpleText || track.name?.runs?.[0]?.text || 'Unknown',
                url: track.baseUrl,
                isDefault: track.isDefault || false,
                isTranslated: track.kind === 'asr' || track.isTranslated || false
              });
            }
          }
        }
      } catch (e) {
        // Fallback to regex method if JSON parsing fails
      }
    }

    // Fallback: Try regex extraction method
    if (tracks.length === 0) {
      const captionRegex = /"captionTracks":\[(.+?)\]/;
      const match = html.match(captionRegex);
      
      if (match) {
        try {
          const captionData = JSON.parse(`[${match[1]}]`);
          for (const track of captionData) {
            if (track.baseUrl) {
              tracks.push({
                languageCode: track.languageCode || 'unknown',
                languageName: track.name?.simpleText || 'Unknown',
                url: track.baseUrl,
                isDefault: false,
                isTranslated: track.kind === 'asr'
              });
            }
          }
        } catch (e) {
          // Silent fail, will throw error below if no tracks found
        }
      }
    }

    return tracks;
  }

  /**
   * Fetch and parse transcript from caption URL
   */
  private static async fetchTranscript(captionUrl: string): Promise<TranscriptEntry[]> {
    try {
      // Ensure the URL has necessary parameters
      const url = new URL(captionUrl);
      
      // Add format parameter if not present
      if (!url.searchParams.has('fmt')) {
        url.searchParams.set('fmt', 'srv3'); // srv3 is the XML format
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/xml,application/xml',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transcript: ${response.status}`);
      }

      const xml = await response.text();
      return this.parseTranscriptXML(xml);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch transcript: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parse YouTube transcript XML format
   */
  private static parseTranscriptXML(xml: string): TranscriptEntry[] {
    const entries: TranscriptEntry[] = [];
    
    // Match all <text> elements in the XML
    const textRegex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>(.*?)<\/text>/g;
    let match;
    
    while ((match = textRegex.exec(xml)) !== null) {
      const start = parseFloat(match[1]);
      const duration = parseFloat(match[2]);
      let text = match[3];
      
      // Decode HTML entities
      text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/\n/g, ' ')
        .trim();
      
      // Only add if text is not empty
      if (text) {
        entries.push({
          text,
          start,
          duration,
          end: start + duration
        });
      }
    }
    
    // If no entries found, try alternative parsing
    if (entries.length === 0) {
      // Try parsing with newlines inside text content
      const altRegex = /<text[^>]*start="([^"]+)"[^>]*dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
      let altMatch;
      
      while ((altMatch = altRegex.exec(xml)) !== null) {
        const start = parseFloat(altMatch[1]);
        const duration = parseFloat(altMatch[2]);
        let text = altMatch[3];
        
        text = text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, '/')
          .replace(/\n/g, ' ')
          .trim();
        
        if (text) {
          entries.push({
            text,
            start,
            duration,
            end: start + duration
          });
        }
      }
    }
    
    return entries;
  }

  /**
   * Find the best matching caption track for the requested language
   */
  private static findBestTrack(tracks: CaptionTrack[], lang: string = 'en'): CaptionTrack | null {
    // First try exact match
    let track = tracks.find(t => t.languageCode === lang);
    if (track) return track;
    
    // Try language prefix match (e.g., 'en' matches 'en-US')
    track = tracks.find(t => t.languageCode.startsWith(lang));
    if (track) return track;
    
    // Try finding any English track
    if (lang !== 'en') {
      track = tracks.find(t => t.languageCode.startsWith('en'));
      if (track) return track;
    }
    
    // Return the first available track
    return tracks[0] || null;
  }

  /**
   * Format transcript based on options
   */
  private static formatTranscript(
    entries: TranscriptEntry[], 
    options: TranscriptOptions
  ): TranscriptEntry[] | string {
    const format = options.format || 'json';
    const includeTimestamps = options.includeTimestamps ?? false;

    switch (format) {
      case 'text':
        if (includeTimestamps) {
          return entries.map(e => `[${this.formatTime(e.start)}] ${e.text}`).join('\n');
        }
        return entries.map(e => e.text).join(' ');
      
      case 'srt':
        return entries.map((e, i) => {
          const startTime = this.formatSRTTime(e.start);
          const endTime = this.formatSRTTime(e.end || e.start + e.duration);
          return `${i + 1}\n${startTime} --> ${endTime}\n${e.text}\n`;
        }).join('\n');
      
      case 'json':
      default:
        return entries;
    }
  }

  /**
   * Format seconds to MM:SS
   */
  private static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format seconds to SRT time format (HH:MM:SS,mmm)
   */
  private static formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  /**
   * Main public method to retrieve transcript
   */
  static async retrieve(videoId: string, options: TranscriptOptions = {}): Promise<TranscriptResult> {
    try {
      // Fetch video info and caption tracks
      const videoInfo = await this.fetchVideoInfo(videoId);
      
      // Find the best matching caption track
      const track = this.findBestTrack(videoInfo.captionTracks, options.lang || 'en');
      
      if (!track) {
        return {
          success: false,
          videoId,
          language: options.lang || 'en',
          error: 'No captions available in the requested language',
          metadata: {
            title: videoInfo.title,
            availableLanguages: videoInfo.captionTracks.map(t => t.languageCode)
          }
        };
      }

      // Fetch the transcript
      const entries = await this.fetchTranscript(track.url);
      
      if (entries.length === 0) {
        return {
          success: false,
          videoId,
          language: track.languageCode,
          error: 'Transcript is empty',
          metadata: {
            title: videoInfo.title
          }
        };
      }

      // Format the transcript
      const transcript = this.formatTranscript(entries, options);
      
      return {
        success: true,
        videoId,
        language: track.languageCode,
        transcript,
        metadata: {
          title: videoInfo.title,
          duration: entries[entries.length - 1]?.end,
          availableLanguages: videoInfo.captionTracks.map(t => t.languageCode)
        }
      };
    } catch (error) {
      return {
        success: false,
        videoId,
        language: options.lang || 'en',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}