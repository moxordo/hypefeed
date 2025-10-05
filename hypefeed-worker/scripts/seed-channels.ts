#!/usr/bin/env bun

/**
 * Seed script to populate D1 database with existing channel data
 * Run with: bun run scripts/seed-channels.ts
 */

import { AI_CHANNELS } from '../src/data/channels';

// Import the existing channel data
const channels = AI_CHANNELS;

// Format for SQL insert
const insertStatements = channels.map(channel => {
  return `
    INSERT INTO channels (
      id, name, handle, channel_id, youtube_url, rss_feed_url,
      subscribers, description, posting_frequency, category, status,
      created_at, updated_at
    ) VALUES (
      '${crypto.randomUUID()}',
      '${channel.name.replace(/'/g, "''")}',
      '${channel.handle.replace(/'/g, "''")}',
      '${channel.channel_id}',
      '${channel.youtube_url}',
      '${channel.rss_feed_url}',
      '${channel.subscribers}',
      '${channel.description.replace(/'/g, "''")}',
      '${channel.posting_frequency.replace(/'/g, "''")}',
      '${channel.category}',
      '${channel.status}',
      datetime('now'),
      datetime('now')
    ) ON CONFLICT(channel_id) DO NOTHING;
  `;
}).join('\n');

// Also seed categories
const categories = [
  { code: 'research_analysis', name: 'Research Analysis', description: 'AI research papers and breakthrough analysis' },
  { code: 'education_tutorials', name: 'Education & Tutorials', description: 'Educational content and hands-on tutorials' },
  { code: 'tools_practical', name: 'Tools & Practical', description: 'AI tools exploration and practical applications' },
  { code: 'education_academic', name: 'Education Academic', description: 'Academic and structured learning content' },
  { code: 'programming_tutorials', name: 'Programming Tutorials', description: 'Coding tutorials and programming guides' },
  { code: 'ai_video_production', name: 'AI Video Production', description: 'AI for video and content creation' },
  { code: 'deep_learning_expert', name: 'Deep Learning Expert', description: 'Advanced deep learning and neural networks' }
];

const categoryInserts = categories.map(cat => {
  return `
    INSERT INTO categories (id, code, name, description, created_at)
    VALUES (
      '${crypto.randomUUID()}',
      '${cat.code}',
      '${cat.name}',
      '${cat.description}',
      datetime('now')
    ) ON CONFLICT(code) DO NOTHING;
  `;
}).join('\n');

// Create the full SQL script
const fullSql = `
-- Seed Categories
${categoryInserts}

-- Seed Channels
${insertStatements}
`;

// Write to file for manual execution
import { writeFileSync } from 'fs';
import { join } from 'path';

const outputPath = join(__dirname, '..', 'prisma', 'seed.sql');
writeFileSync(outputPath, fullSql);

console.log('✅ Seed SQL generated successfully!');
console.log(`📄 SQL file created at: ${outputPath}`);
console.log('\n📝 To apply the seed data, run:');
console.log('   npx wrangler d1 execute hypefeed-channels --file=prisma/seed.sql --remote');
console.log('\n📊 Summary:');
console.log(`   - ${channels.length} channels to seed`);
console.log(`   - ${categories.length} categories to seed`);

// Also output the data as JSON for reference
const seedData = {
  channels: channels.map(c => ({
    ...c,
    id: crypto.randomUUID()
  })),
  categories: categories.map(c => ({
    ...c,
    id: crypto.randomUUID()
  }))
};

const jsonPath = join(__dirname, '..', 'prisma', 'seed-data.json');
writeFileSync(jsonPath, JSON.stringify(seedData, null, 2));
console.log(`\n📋 JSON backup created at: ${jsonPath}`);