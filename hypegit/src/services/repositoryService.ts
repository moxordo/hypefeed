/**
 * Repository Service
 * Database CRUD operations for repositories and related data
 */

import type { PrismaClient } from '@prisma/client';
import type { Env, GitHubRepository, TrendingRepo } from '../types/bindings';
import { getPrismaClient } from '../db/client';

export class RepositoryService {
  private prisma: PrismaClient;

  constructor(env: Env) {
    this.prisma = getPrismaClient(env);
  }

  /**
   * Upsert repository (create or update)
   */
  async upsertRepository(repo: GitHubRepository): Promise<void> {
    const repoId = `${repo.owner.login}/${repo.name}`;

    await this.prisma.repository.upsert({
      where: { id: repoId },
      create: {
        id: repoId,
        name: repo.name,
        owner: repo.owner.login,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        html_url: repo.html_url,
        stars_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        last_commit_at: repo.pushed_at,
        last_updated: new Date(),
        is_archived: repo.archived
      },
      update: {
        description: repo.description,
        language: repo.language,
        stars_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
        last_commit_at: repo.pushed_at,
        last_updated: new Date(),
        is_archived: repo.archived
      }
    });
  }

  /**
   * Create trending capture record
   */
  async createTrendingCapture(data: {
    repo_id: string;
    time_range: 'daily' | 'weekly' | 'monthly';
    language: string | null;
    rank: number;
    stars_today: number | null;
    snapshot_url: string | null;
  }): Promise<void> {
    await this.prisma.trendingCapture.create({
      data: {
        id: `tc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        repo_id: data.repo_id,
        time_range: data.time_range,
        language: data.language,
        rank: data.rank,
        stars_today: data.stars_today,
        snapshot_url: data.snapshot_url,
        captured_at: new Date()
      }
    });
  }

  /**
   * Create star snapshot
   */
  async createStarSnapshot(data: {
    repo_id: string;
    stars_count: number;
    forks_count: number;
  }): Promise<void> {
    await this.prisma.starSnapshot.create({
      data: {
        id: crypto.randomUUID(),
        repo_id: data.repo_id,
        stars_count: data.stars_count,
        forks_count: data.forks_count,
        captured_at: new Date()
      }
    });
  }

  /**
   * Get repository by ID
   */
  async getRepository(repoId: string) {
    return await this.prisma.repository.findUnique({
      where: { id: repoId }
    });
  }

  /**
   * Get all repositories
   */
  async getAllRepositories(limit: number = 100) {
    return await this.prisma.repository.findMany({
      orderBy: { last_updated: 'desc' },
      take: limit
    });
  }

  /**
   * Get all active repositories
   */
  async getActiveRepositories(limit: number = 100) {
    return await this.prisma.repository.findMany({
      where: { is_active: true },
      orderBy: { last_updated: 'desc' },
      take: limit
    });
  }

  /**
   * Get trending captures for a repository
   */
  async getTrendingHistory(repoId: string, limit: number = 30) {
    return await this.prisma.trendingCapture.findMany({
      where: { repo_id: repoId },
      orderBy: { captured_at: 'desc' },
      take: limit
    });
  }

  /**
   * Get star snapshots for a repository
   */
  async getStarSnapshots(repoId: string, limit: number = 100) {
    return await this.prisma.starSnapshot.findMany({
      where: { repo_id: repoId },
      orderBy: { captured_at: 'desc' },
      take: limit
    });
  }

  /**
   * Get recent trending repositories
   */
  async getRecentTrending(
    timeRange?: 'daily' | 'weekly' | 'monthly',
    language?: string,
    limit: number = 50
  ) {
    const where: any = {};

    if (timeRange) {
      where.time_range = timeRange;
    }

    if (language) {
      where.language = language;
    }

    return await this.prisma.trendingCapture.findMany({
      where,
      include: {
        repository: true
      },
      orderBy: { captured_at: 'desc' },
      take: limit
    });
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const [
      totalRepos,
      activeRepos,
      totalSnapshots,
      totalTrendingCaptures
    ] = await Promise.all([
      this.prisma.repository.count(),
      this.prisma.repository.count({ where: { is_active: true } }),
      this.prisma.starSnapshot.count(),
      this.prisma.trendingCapture.count()
    ]);

    return {
      totalRepos,
      activeRepos,
      totalSnapshots,
      totalTrendingCaptures
    };
  }

  /**
   * Mark stale repositories as inactive
   */
  async markStaleRepositories(): Promise<number> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await this.prisma.repository.updateMany({
      where: {
        OR: [
          { last_commit_at: { lt: ninetyDaysAgo.toISOString() } },
          { is_archived: true }
        ],
        is_active: true
      },
      data: {
        is_active: false
      }
    });

    return result.count;
  }
}
