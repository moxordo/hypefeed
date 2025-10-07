/**
 * Cron handlers for scheduled tasks
 */

import type { Env, ExecutionContext, ScheduledEvent } from '../types/bindings';
import { TrendingScraperService } from '../services/trendingScraper';
import { GitHubAPIService } from '../services/githubAPI';
import { StorageService } from '../services/storage';
import { RepositoryService } from '../services/repositoryService';
import { format } from 'date-fns';

/**
 * Main scheduled event handler
 */
export async function handleScheduledEvent(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const startTime = Date.now();

  console.log('🕒 Starting scheduled task at', new Date(event.scheduledTime).toISOString());

  try {
    // Run daily trending scrape
    await handleDailyTrendingScrape(env, ctx);

    const duration = Date.now() - startTime;
    console.log(`✅ Scheduled task completed in ${duration}ms`);

  } catch (error) {
    console.error('❌ Scheduled task failed:', error);
    throw error;
  }
}

/**
 * Daily trending scrape handler
 * Scrapes all trending variants (3 ranges × 11 languages = 33 pages)
 * Covers: TypeScript, Python, JavaScript, Go, Rust, Java, C++, C#, Kotlin, Swift, All
 */
export async function handleDailyTrendingScrape(
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const scraper = new TrendingScraperService();
  const storage = new StorageService(env);
  const github = new GitHubAPIService(env.GITHUB_TOKEN);
  const repoService = new RepositoryService(env);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Priority 1 languages (most active developer communities)
  const languages = [
    'typescript',
    'python',
    'javascript',
    'go',
    'rust',
    'java',
    'c++',
    'c%23', // C#
    'kotlin',
    'swift',
    null  // All languages
  ];

  const ranges: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];

  let totalRepos = 0;
  let totalVariants = 0;

  for (const range of ranges) {
    for (const language of languages) {
      try {
        console.log(`📡 Scraping ${range}/${language || 'all'}...`);

        // Scrape trending page
        const { repos, html } = await scraper.scrapeTrending(range, language || undefined);

        // Store HTML snapshot to R2
        const snapshotKey = await storage.storeSnapshot(today, range, language, html);

        console.log(`  Found ${repos.length} repos`);

        // Process each repository
        for (const [index, repo] of repos.entries()) {
          try {
            // Get full repository details from GitHub API
            const details = await github.getRepoDetails(repo.owner, repo.name);

            // Upsert repository
            await repoService.upsertRepository(details);

            // Create trending capture
            await repoService.createTrendingCapture({
              repo_id: `${repo.owner}/${repo.name}`,
              time_range: range,
              language: language,
              rank: index + 1,
              stars_today: repo.stars_today,
              snapshot_url: snapshotKey
            });

            // Create star snapshot
            await repoService.createStarSnapshot({
              repo_id: `${repo.owner}/${repo.name}`,
              stars_count: details.stargazers_count,
              forks_count: details.forks_count
            });

            totalRepos++;

          } catch (error) {
            console.error(`  Failed to process ${repo.full_name}:`, error);
            // Continue with next repo
          }

          // Small delay between GitHub API calls
          await sleep(50);
        }

        totalVariants++;

        // Delay between scraping different trending pages
        await sleep(500);

      } catch (error) {
        console.error(`Failed to scrape ${range}/${language || 'all'}:`, error);
        // Continue with next variant
      }
    }
  }

  console.log(`✅ Daily scrape complete: ${totalRepos} repos from ${totalVariants} variants`);

  // Check rate limit status
  try {
    const rateLimit = await github.getRateLimit();
    console.log(`📊 GitHub API rate limit: ${rateLimit.remaining}/${rateLimit.limit}`);
  } catch (error) {
    console.warn('Failed to check rate limit:', error);
  }
}

/**
 * Manual refresh handler (for testing)
 */
export async function handleManualRefresh(
  env: Env,
  ctx: ExecutionContext
): Promise<{ success: boolean; message: string }> {
  try {
    // Execute in background
    ctx.waitUntil(handleDailyTrendingScrape(env, ctx));

    return {
      success: true,
      message: 'Manual refresh triggered'
    };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
