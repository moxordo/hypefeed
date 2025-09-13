export interface TranscriptEntry {
  text: string;
  start: number;
  duration: number;
  end?: number;
}

export interface TranscriptOptions {
  lang?: string;
  format?: 'text' | 'json' | 'srt';
  includeTimestamps?: boolean;
}

export interface TranscriptResult {
  success: boolean;
  videoId: string;
  language: string;
  transcript?: TranscriptEntry[] | string;
  error?: string;
  metadata?: {
    title?: string;
    duration?: number;
    availableLanguages?: string[];
  };
}

export interface CaptionTrack {
  languageCode: string;
  languageName: string;
  url: string;
  isDefault?: boolean;
  isTranslated?: boolean;
}

export interface VideoInfo {
  videoId: string;
  title?: string;
  duration?: number;
  captionTracks: CaptionTrack[];
}