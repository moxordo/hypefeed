#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

/**
 * Test client for YouTube Transcript MCP Server
 */
async function testMCPServer() {
  console.log('🚀 Starting YouTube Transcript MCP Server Test Client\n');
  
  // Create transport with server command
  const serverPath = new URL('../dist/index.js', import.meta.url).pathname;
  console.log(`Server path: ${serverPath}`);
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
  });

  const client = new Client({
    name: 'youtube-transcript-test-client',
    version: '1.0.0',
  }, {
    capabilities: {}
  });


  try {
    // Connect to the server
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // List available tools
    console.log('📋 Listing available tools:');
    const toolsResponse = await client.listTools();
    console.log('Available tools:');
    toolsResponse.tools.forEach((tool: any) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Test cases
    const testCases = [
      {
        name: 'Test 1: Retrieve transcript with video URL',
        tool: 'retrieve_transcript',
        args: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          lang: 'en',
          format: 'json'
        }
      },
      {
        name: 'Test 2: Retrieve transcript with video ID',
        tool: 'retrieve_transcript',
        args: {
          video_id: 'dQw4w9WgXcQ',
          format: 'text',
          include_timestamps: true
        }
      },
      {
        name: 'Test 3: List available transcripts',
        tool: 'list_available_transcripts',
        args: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        }
      },
      {
        name: 'Test 4: Test with short URL',
        tool: 'retrieve_transcript',
        args: {
          url: 'https://youtu.be/dQw4w9WgXcQ',
          format: 'srt'
        }
      }
    ];

    // Run tests
    for (const testCase of testCases) {
      console.log(`\n🧪 ${testCase.name}`);
      console.log(`   Tool: ${testCase.tool}`);
      console.log(`   Args: ${JSON.stringify(testCase.args, null, 2)}`);
      
      try {
        const result = await client.callTool({
          name: testCase.tool,
          arguments: testCase.args
        });
        
        console.log('   Result:');
        if (result.content && result.content.length > 0) {
          const content = result.content[0];
          if (content.type === 'text') {
            const text = content.text;
            // Parse and display result
            try {
              const parsed = JSON.parse(text);
              if (parsed.success) {
                console.log(`   ✅ Success!`);
                console.log(`      Video ID: ${parsed.videoId}`);
                console.log(`      Language: ${parsed.language}`);
                if (parsed.metadata) {
                  console.log(`      Title: ${parsed.metadata.title}`);
                  console.log(`      Available Languages: ${parsed.metadata.availableLanguages?.join(', ')}`);
                }
                if (typeof parsed.transcript === 'string') {
                  console.log(`      Transcript preview: ${parsed.transcript.substring(0, 100)}...`);
                } else if (Array.isArray(parsed.transcript)) {
                  console.log(`      Transcript entries: ${parsed.transcript.length}`);
                }
              } else {
                console.log(`   ❌ Failed: ${parsed.error}`);
              }
            } catch (e) {
              // If not JSON, just show the text
              console.log(`      ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error}`);
      }
    }

    console.log('\n✨ All tests completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Cleanup
    await client.close();
    process.exit(0);
  }
}

// Run the test
testMCPServer().catch(console.error);