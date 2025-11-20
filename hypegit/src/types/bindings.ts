/**
 * Type definitions for HypeGit worker
 */

// Cloudflare Worker environment bindings
export interface Env {
  // D1 Database
  HYPEGIT_DB: D1Database;

  // R2 Bucket
  HYPEGIT_BUCKET: R2Bucket;

  // Queues
  SCRAPER_QUEUE: Queue;

  // Secrets
  GITHUB_TOKEN: string;
  ADMIN_API_KEY: string;  // Bearer token for protected API endpoints

  // Environment variables
  ENVIRONMENT: string;
}

// Cloudflare ExecutionContext
export type ExecutionContext = import('@cloudflare/workers-types').ExecutionContext;
export type ScheduledEvent = import('@cloudflare/workers-types').ScheduledEvent;

// Repository from GitHub API
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    type: string;
  };
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  archived: boolean;
  topics?: string[];
}

// Trending repository from scraping
export interface TrendingRepo {
  owner: string;
  name: string;
  full_name: string;
  description: string;
  language: string | null;
  stars_count: number;
  stars_today: number | null;  // Stars gained in trending period
  html_url: string;
}

// Database models (matching Prisma schema)
export interface Repository {
  id: string;                 // "owner/name"
  name: string;
  owner: string;
  full_name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stars_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  last_commit_at: string | null;
  first_seen: Date;
  last_updated: Date;
  is_active: boolean;
  is_archived: boolean;
}

export interface StarSnapshot {
  id: string;
  repo_id: string;
  stars_count: number;
  forks_count: number;
  captured_at: Date;
}

export interface TrendingCapture {
  id: string;
  repo_id: string;
  time_range: 'daily' | 'weekly' | 'monthly';
  language: string | null;
  rank: number;
  stars_today: number | null;
  captured_at: Date;
  snapshot_url: string | null;
}

export interface Topic {
  id: string;
  name: string;
  category: string | null;
}

export interface RepositoryTopic {
  repo_id: string;
  topic_id: string;
}

// Surge analysis result
export interface SurgeAnalysis {
  repo_id: string;
  time_window: '24h' | '7d' | '30d';
  stars_start: number;
  stars_end: number;
  absolute_growth: number;
  growth_rate: number;           // Percentage
  avg_daily_velocity: number;    // Stars per day
  acceleration: number;          // Velocity change
  is_trending: boolean;
  trending_rank: number | null;
  baseline_velocity: number;     // 30-day average
  surge_confidence: number;      // 0-100 score
}

// Error types
export class HypeGitError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'HypeGitError';
  }
}

export class GitHubAPIError extends HypeGitError {
  constructor(message: string, public statusCode: number = 500) {
    super(message, 'GITHUB_API_ERROR', statusCode);
    this.name = 'GitHubAPIError';
  }
}

export class ScraperError extends HypeGitError {
  constructor(message: string) {
    super(message, 'SCRAPER_ERROR', 500);
    this.name = 'ScraperError';
  }
}

export class StorageError extends HypeGitError {
  constructor(message: string, public operation: string) {
    super(message, 'STORAGE_ERROR', 500);
    this.name = 'StorageError';
  }
}

// Storage keys
export const StorageKeys = {
  TRENDING_SNAPSHOT: (date: string, range: string, language: string | null) =>
    `trending/${date}/${range}-${language || 'all'}.html`,
  TRENDING_INDEX: (yearMonth: string) =>
    `metadata/trending-index-${yearMonth}.json`,
} as const;

// Queue message types
export interface ScraperQueueMessage {
  task: 'scrape-trending' | 'snapshot-repos';
  range?: 'daily' | 'weekly' | 'monthly';
  language?: string | null;
  date: string;
  // For repository snapshots batch processing:
  batchOffset?: number;
  batchLimit?: number;
}
