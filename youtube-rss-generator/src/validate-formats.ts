#!/usr/bin/env node
/**
 * Comprehensive validation test for all YouTube URL formats
 */

import { YouTubeURLParser } from './parser.js';
import { generateRSSFeed } from './index.js';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

interface TestCase {
  format: string;
  examples: string[];
  expectedType: 'channel' | 'user' | 'playlist' | null;
  canGenerateRSS: boolean;
  notes?: string;
}

const testCases: TestCase[] = [
  {
    format: 'youtube.com/@username',
    examples: [
      'https://www.youtube.com/@mkbhd',
      'youtube.com/@LinusTechTips',
      'https://youtube.com/@veritasium'
    ],
    expectedType: 'channel',
    canGenerateRSS: true,
    notes: 'Handles are resolved to channel IDs by fetching the channel page'
  },
  {
    format: 'youtube.com/c/channelname',
    examples: [
      'https://www.youtube.com/c/LinusTechTips',
      'youtube.com/c/mkbhd',
      'https://youtube.com/c/veritasium'
    ],
    expectedType: 'channel',
    canGenerateRSS: true,
    notes: 'Custom channel names are resolved to channel IDs by fetching the channel page'
  },
  {
    format: 'youtube.com/channel/ID',
    examples: [
      'https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw',
      'youtube.com/channel/UCBJycsmduvYEL83R_U4JriQ',
      'https://youtube.com/channel/UCHnyfMqiRRG1u-2MsSQLbXA'
    ],
    expectedType: 'channel',
    canGenerateRSS: true,
    notes: 'Direct channel ID - works perfectly'
  },
  {
    format: 'youtube.com/user/username',
    examples: [
      'https://www.youtube.com/user/LinusTechTips',
      'youtube.com/user/marquesbrownlee',
      'https://youtube.com/user/1veritasium'
    ],
    expectedType: 'user',
    canGenerateRSS: true,
    notes: 'Legacy user format - works with RSS'
  },
  {
    format: 'youtube.com/watch?v=VIDEO_ID',
    examples: [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'youtube.com/watch?v=0SQor2z2QAU',
      'https://youtube.com/watch?v=jNQXAC9IVRw&t=42s'
    ],
    expectedType: null,
    canGenerateRSS: true,
    notes: 'Channel RSS feed is extracted from the video page'
  },
  {
    format: 'youtu.be/VIDEO_ID',
    examples: [
      'https://youtu.be/dQw4w9WgXcQ',
      'youtu.be/0SQor2z2QAU',
      'https://youtu.be/jNQXAC9IVRw?t=42'
    ],
    expectedType: null,
    canGenerateRSS: true,
    notes: 'Channel RSS feed is extracted from the video page'
  },
  {
    format: 'youtube.com/playlist?list=ID',
    examples: [
      'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
      'youtube.com/playlist?list=PL8mG-Ahe5lwT4lMSMBBx8H8ydzgGQvbTb'
    ],
    expectedType: 'playlist',
    canGenerateRSS: true,
    notes: 'Playlists have RSS feeds'
  },
  {
    format: 'youtube.com/shorts/VIDEO_ID',
    examples: [
      'https://www.youtube.com/shorts/abcdefghijk',
      'youtube.com/shorts/xyzabc12345'
    ],
    expectedType: null,
    canGenerateRSS: true,
    notes: 'Channel RSS feed is extracted from the shorts page'
  }
];

async function validateFormat(testCase: TestCase) {
  log(`\n${colors.bright}Testing: ${testCase.format}${colors.reset}`, colors.cyan);
  if (testCase.notes) {
    log(`  Note: ${testCase.notes}`, colors.gray);
  }
  
  let allPassed = true;
  
  for (const example of testCase.examples) {
    // Parse the URL
    const parsed = YouTubeURLParser.parse(example);
    
    // Generate RSS URL
    const rssUrl = await YouTubeURLParser.generateRSSUrl(parsed);
    
    // Check parsing
    const parseSuccess = parsed.type === testCase.expectedType;
    const rssSuccess = testCase.canGenerateRSS ? (rssUrl !== null) : (rssUrl === null);
    
    const overallSuccess = parseSuccess && rssSuccess;
    allPassed = allPassed && overallSuccess;
    
    // Display results
    if (overallSuccess) {
      log(`  ✅ ${example}`, colors.green);
      log(`     Type: ${parsed.type || 'none'}, Source: ${parsed.sourceType}, ID: ${parsed.id || 'none'}`, colors.green);
      if (rssUrl) {
        log(`     RSS: ${rssUrl}`, colors.green);
      } else if (testCase.canGenerateRSS) {
        log(`     RSS: Generation failed unexpectedly!`, colors.red);
      } else {
        log(`     RSS: Not available (as expected)`, colors.gray);
      }
    } else {
      log(`  ❌ ${example}`, colors.red);
      log(`     Type: ${parsed.type || 'none'} (expected: ${testCase.expectedType || 'none'})`, colors.red);
      log(`     Source: ${parsed.sourceType}, ID: ${parsed.id || 'none'}`, colors.red);
      if (!rssSuccess) {
        if (testCase.canGenerateRSS && !rssUrl) {
          log(`     RSS: Expected to generate but got null`, colors.red);
        } else if (!testCase.canGenerateRSS && rssUrl) {
          log(`     RSS: Should not generate but got: ${rssUrl}`, colors.red);
        }
      }
    }
    
    // Test with the actual generateRSSFeed function
    try {
      const result = await generateRSSFeed(example, false);
      if (result.success && result.feedUrl) {
        log(`     Full result: Success with feed URL`, colors.green);
      } else if (!result.success && !testCase.canGenerateRSS) {
        log(`     Full result: Failed as expected - ${result.validation.error}`, colors.gray);
      } else if (!result.success && testCase.canGenerateRSS) {
        log(`     Full result: Unexpected failure - ${result.validation.error}`, colors.yellow);
      }
    } catch (error) {
      log(`     Full result: Error - ${error}`, colors.red);
    }
  }
  
  return allPassed;
}

async function runAllTests() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('YouTube RSS Feed Generator - Format Validation Test', colors.bright + colors.cyan);
  log('='.repeat(60), colors.cyan);
  
  let totalFormats = 0;
  let passedFormats = 0;
  let totalUrls = 0;
  let workingRssFormats = 0;
  
  for (const testCase of testCases) {
    totalFormats++;
    const passed = await validateFormat(testCase);
    if (passed) {
      passedFormats++;
    }
    if (testCase.canGenerateRSS) {
      workingRssFormats++;
    }
    totalUrls += testCase.examples.length;
  }
  
  // Summary
  log('\n' + '='.repeat(60), colors.cyan);
  log('SUMMARY', colors.bright + colors.cyan);
  log('='.repeat(60), colors.cyan);
  
  log(`\nFormats tested: ${totalFormats}`, colors.blue);
  log(`Formats working correctly: ${passedFormats}/${totalFormats}`, 
    passedFormats === totalFormats ? colors.green : colors.yellow);
  log(`Total URLs tested: ${totalUrls}`, colors.blue);
  
  log(`\n${colors.bright}RSS Feed Support:${colors.reset}`, colors.cyan);
  log(`  ✅ Can generate RSS: ${workingRssFormats} formats`, colors.green);
  log(`     - youtube.com/channel/ID`, colors.green);
  log(`     - youtube.com/user/username`, colors.green);
  log(`     - youtube.com/playlist?list=ID`, colors.green);
  
  log(`\n  ⚠️  Cannot generate RSS directly: ${totalFormats - workingRssFormats} formats`, colors.yellow);
  log(`     - youtube.com/@username (needs channel ID resolution)`, colors.yellow);
  log(`     - youtube.com/c/channelname (needs channel ID resolution)`, colors.yellow);
  log(`     - youtube.com/watch?v=VIDEO_ID (individual videos)`, colors.yellow);
  log(`     - youtu.be/VIDEO_ID (individual videos)`, colors.yellow);
  log(`     - youtube.com/shorts/VIDEO_ID (shorts)`, colors.yellow);
  
  log('\n' + '='.repeat(60), colors.cyan);
  
  if (passedFormats === totalFormats) {
    log('✅ All formats are working as expected!', colors.green + colors.bright);
  } else {
    log(`⚠️  ${totalFormats - passedFormats} format(s) have issues`, colors.yellow + colors.bright);
  }
}

// Run tests
runAllTests().catch(console.error);