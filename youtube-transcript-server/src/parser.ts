export class YouTubeParser {
  /**
   * Extract video ID from various YouTube URL formats
   */
  static extractVideoId(url: string): string | null {
    // Direct video ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }

    // Clean the URL
    const cleanUrl = url.trim();

    // Regular YouTube URLs
    const patterns = [
      // youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
      // youtu.be/VIDEO_ID
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      // youtube.com/embed/VIDEO_ID
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      // youtube.com/v/VIDEO_ID
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      // youtube.com/shorts/VIDEO_ID
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      // youtube.com/live/VIDEO_ID
      /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
      // m.youtube.com variants
      /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      // youtube-nocookie.com variants
      /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Clean and normalize a YouTube URL
   */
  static normalizeUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  /**
   * Validate if a string is a valid YouTube video ID
   */
  static isValidVideoId(videoId: string): boolean {
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  }

  /**
   * Parse a URL and extract video information
   */
  static parse(input: string): { videoId: string | null; normalized: string | null; isValid: boolean } {
    const videoId = this.extractVideoId(input);
    const isValid = videoId !== null && this.isValidVideoId(videoId);
    const normalized = videoId ? this.normalizeUrl(videoId) : null;

    return {
      videoId,
      normalized,
      isValid
    };
  }
}