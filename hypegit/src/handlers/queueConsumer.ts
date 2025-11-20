/**
 * Queue Consumer Handler
 * Processes scraper messages from Cloudflare Queues
 * Each consumer invocation gets its own 1,000 subrequest quota
 */

import type { Env, ScraperQueueMessage } from '../types/bindings';
import { TrendingScraperService } from '../services/trendingScraper';
import { GitHubAPIService } from '../services/githubAPI';
import { StorageService } from '../services/storage';
import { RepositoryService } from '../services/repositoryService';

/**
 * Process a batch of queue messages
 * Each message represents one trending page to scrape
 */
export async function handleQueueBatch(
  batch: MessageBatch<ScraperQueueMessage>,
  env: Env
): Promise<void> {
  console.log(`📬 Processing queue batch: ${batch.messages.length} messages`);

  for (const message of batch.messages) {
    const startTime = Date.now();

    try {
      const payload = message.body;

      if (payload.task === 'scrape-trending') {
        await handleScrapeTrending(payload, env);
      } else if (payload.task === 'snapshot-repos') {
        await handleSnapshotRepos(payload, env);
      } else {
        console.error(`Unknown task type: ${payload.task}`);
        message.ack(); // Acknowledge to prevent retries
        continue;
      }

      // Acknowledge successful processing
      message.ack();

      const duration = Date.now() - startTime;
      console.log(`✅ Processed message in ${duration}ms: ${payload.task} (${payload.range || 'N/A'}/${payload.language || 'all'})`);

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Failed to process message after ${duration}ms:`, error);

      // Don't ack - let it retry
      // After max_retries (5), it will go to dead letter queue
      message.retry();
    }
  }
}

/**
 * Handle scraping a single trending page
 */
async function handleScrapeTrending(
  payload: ScraperQueueMessage,
  env: Env
): Promise<void> {
  if (!payload.range) {
    throw new Error('Missing range for scrape-trending task');
  }

  const scraper = new TrendingScraperService();
  const storage = new StorageService(env);
  const github = new GitHubAPIService(env.GITHUB_TOKEN);
  const repoService = new RepositoryService(env);

  const { range, language, date } = payload;
  const langParam = language === null ? undefined : language;

  console.log(`📡 Scraping ${range}/${language || 'all'} for ${date}...`);

  // Scrape trending page
  const { repos, html } = await scraper.scrapeTrending(range, langParam);

  // Store HTML snapshot to R2
  const snapshotKey = await storage.storeSnapshot(date, range, language, html);

  console.log(`  Found ${repos.length} repos, stored snapshot: ${snapshotKey}`);

  let processed = 0;
  let errors = 0;

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
        snapshot_url: snapshotKey,
      });

      // Create star snapshot
      await repoService.createStarSnapshot({
        repo_id: `${repo.owner}/${repo.name}`,
        stars_count: details.stargazers_count,
        forks_count: details.forks_count,
      });

      processed++;

      // Small delay between GitHub API calls (rate limiting)
      await sleep(1000);
    } catch (error) {
      console.error(`  Failed to process ${repo.full_name}:`, error);
      errors++;
      // Continue with next repo
    }
  }

  console.log(`  Processed: ${processed}/${repos.length} repos (${errors} errors)`);
}

/**
 * Handle repository snapshots (optional, can be separate queue or cron)
 */
async function handleSnapshotRepos(
  payload: ScraperQueueMessage,
  env: Env
): Promise<void> {
  const repoService = new RepositoryService(env);
  const github = new GitHubAPIService(env.GITHUB_TOKEN);

  const repoIds = payload.repoIds || [];

  console.log(`📸 Snapshotting ${repoIds.length} repositories...`);

  let processed = 0;

  for (const repoId of repoIds) {
    try {
      const [owner, name] = repoId.split('/');

      // Fetch fresh data from GitHub API
      const details = await github.getRepoDetails(owner, name);

      // Upsert with fresh GitHub data
      await repoService.upsertRepository(details);

      // Create star snapshot
      await repoService.createStarSnapshot({
        repo_id: repoId,
        stars_count: details.stargazers_count,
        forks_count: details.forks_count,
      });

      processed++;

      // Delay between API calls
      await sleep(2000);
    } catch (error) {
      console.error(`  Failed to snapshot ${repoId}:`, error);
      // Continue with next repo
    }
  }

  console.log(`  Snapshotted: ${processed}/${repoIds.length} repos`);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
