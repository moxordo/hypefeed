/**
 * Cron handlers for scheduled tasks
 * Producer that queues scraping tasks to Cloudflare Queues
 */

import type { Env, ExecutionContext, ScheduledEvent, ScraperQueueMessage } from '../types/bindings';
import { format } from 'date-fns';

/**
 * Main scheduled event handler
 * Queues trending scraping tasks to be processed by queue consumers
 */
export async function handleScheduledEvent(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const startTime = Date.now();

  console.log('🕒 Starting scheduled task at', new Date(event.scheduledTime).toISOString());

  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    // All tracked languages (21 total)
    const languages: Array<string | null> = [
      // Priority 1: Top developer languages
      'typescript',
      'python',
      'javascript',
      'go',
      'rust',
      // Priority 2: Major languages
      'java',
      'c++',
      'c%23', // C#
      'c',
      'kotlin',
      'swift',
      'ruby',
      'php',
      // Priority 3: Additional languages
      'dart',
      'elixir',
      'scala',
      'zig',
      'html',
      'css',
      'shell',
      // All languages combined
      null,
    ];

    const ranges: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];

    // Create messages for all language/range combinations
    const messages = [];

    for (const range of ranges) {
      for (const language of languages) {
        messages.push({
          body: {
            task: 'scrape-trending' as const,
            range,
            language,
            date: today,
          }
        });
      }
    }

    // Add repository snapshot batch messages
    // Process all repos in batches of 50
    const batchSize = 50;
    const estimatedTotalRepos = 4000; // Estimate, will stop early if no repos found
    const numBatches = Math.ceil(estimatedTotalRepos / batchSize);

    for (let i = 0; i < numBatches; i++) {
      messages.push({
        body: {
          task: 'snapshot-repos' as const,
          date: today,
          batchOffset: i * batchSize,
          batchLimit: batchSize,
        }
      });
    }

    console.log(`📤 Queuing ${messages.length} tasks (63 trending + ${numBatches} snapshot batches)...`);

    // Send messages in batches of 100 (Cloudflare Queue limit)
    const maxBatchSize = 100;
    for (let i = 0; i < messages.length; i += maxBatchSize) {
      const batch = messages.slice(i, i + maxBatchSize);
      await env.SCRAPER_QUEUE.sendBatch(batch);
      console.log(`  Sent batch ${Math.floor(i / maxBatchSize) + 1}: ${batch.length} messages`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Queued ${messages.length} tasks in ${duration}ms`);

  } catch (error) {
    console.error('❌ Failed to queue tasks:', error);
    throw error;
  }
}

/**
 * Manual refresh handler (for testing)
 * Queues messages to the scraper queue
 */
export async function handleManualRefresh(
  env: Env,
  ctx: ExecutionContext
): Promise<{ success: boolean; message: string }> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    // Queue a single test message
    await env.SCRAPER_QUEUE.send({
      task: 'scrape-trending',
      range: 'daily',
      language: 'typescript',
      date: today,
    });

    return {
      success: true,
      message: 'Manual refresh triggered - queued 1 test message'
    };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
