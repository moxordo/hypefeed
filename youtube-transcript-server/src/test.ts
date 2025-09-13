import { YouTubeTranscript } from './transcript.js';
import { YouTubeParser } from './parser.js';

async function test() {
  console.log('Testing YouTube Transcript Server...\n');
  
  // Test URL parsing
  console.log('1. Testing URL Parser:');
  const testUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'dQw4w9WgXcQ',
    'https://youtube.com/shorts/abcd1234567'
  ];
  
  for (const url of testUrls) {
    const result = YouTubeParser.parse(url);
    console.log(`  ${url} -> ${result.videoId || 'INVALID'}`);
  }
  
  console.log('\n2. Testing Transcript Retrieval:');
  // Test with a known video that should have captions
  const testVideoId = '0SQor2z2QAU'; // User-provided video
  
  console.log(`  Fetching transcript for video: ${testVideoId}`);
  
  try {
    // Test JSON format
    const jsonResult = await YouTubeTranscript.retrieve(testVideoId, {
      lang: 'en',
      format: 'json'
    });
    
    if (jsonResult.success) {
      console.log(`  ✅ Successfully retrieved transcript`);
      console.log(`     Language: ${jsonResult.language}`);
      console.log(`     Title: ${jsonResult.metadata?.title}`);
      console.log(`     Available languages: ${jsonResult.metadata?.availableLanguages?.join(', ')}`);
      if (Array.isArray(jsonResult.transcript)) {
        console.log(`     Transcript entries: ${jsonResult.transcript.length}`);
        if (jsonResult.transcript.length > 0) {
          console.log(`     First entry: "${jsonResult.transcript[0].text.substring(0, 50)}..."`);
        }
      }
    } else {
      console.log(`  ❌ Failed to retrieve transcript: ${jsonResult.error}`);
    }
    
    // Test text format
    console.log('\n  Testing text format:');
    const textResult = await YouTubeTranscript.retrieve(testVideoId, {
      lang: 'en',
      format: 'text',
      includeTimestamps: true
    });
    
    if (textResult.success && typeof textResult.transcript === 'string') {
      const preview = textResult.transcript.substring(0, 200);
      console.log(`  ✅ Text format successful`);
      console.log(`     Preview: ${preview}...`);
    }
    
  } catch (error) {
    console.error('  ❌ Error:', error);
  }
  
  console.log('\n✨ Test complete!');
}

test().catch(console.error);