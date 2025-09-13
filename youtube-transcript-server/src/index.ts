#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { YouTubeTranscript } from './transcript.js';
import { YouTubeParser } from './parser.js';
import { TranscriptOptions } from './types.js';

// Define the MCP tools
const TOOLS = [
  {
    name: 'retrieve_transcript',
    description: 'Retrieve transcript/captions from a YouTube video with multiple output formats',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'YouTube video URL or video ID'
        },
        video_id: {
          type: 'string',
          description: 'YouTube video ID (alternative to url)'
        },
        lang: {
          type: 'string',
          description: 'Language code for transcript (e.g., "en", "es", "fr"). Default: "en"',
          default: 'en'
        },
        format: {
          type: 'string',
          enum: ['text', 'json', 'srt'],
          description: 'Output format: "text" (plain text), "json" (structured), or "srt" (subtitle format). Default: "json"',
          default: 'json'
        },
        include_timestamps: {
          type: 'boolean',
          description: 'Include timestamps in text format output. Default: false',
          default: false
        }
      },
      required: []
    }
  },
  {
    name: 'list_available_transcripts',
    description: 'List all available transcript languages for a YouTube video',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'YouTube video URL or video ID'
        },
        video_id: {
          type: 'string',
          description: 'YouTube video ID (alternative to url)'
        }
      },
      required: []
    }
  }
];

/**
 * Extract video ID from input parameters
 */
function extractVideoId(args: any): string | null {
  if (args.video_id) {
    return YouTubeParser.isValidVideoId(args.video_id) ? args.video_id : null;
  }
  if (args.url) {
    return YouTubeParser.extractVideoId(args.url);
  }
  return null;
}

/**
 * Create and run the MCP server
 */
async function main() {
  const server = new Server(
    {
      name: 'youtube-transcript-server',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'retrieve_transcript': {
        // Validate that at least one input is provided
        if (!args?.url && !args?.video_id) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Either "url" or "video_id" parameter is required'
              }, null, 2)
            }]
          };
        }
        
        const videoId = extractVideoId(args);
        
        if (!videoId) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Invalid YouTube URL or video ID provided'
              }, null, 2)
            }]
          };
        }

        const lang = args?.lang as string || 'en';
        const format = args?.format as 'text' | 'json' | 'srt' || 'json';
        const includeTimestamps = args?.include_timestamps as boolean || false;
        
        const options: TranscriptOptions = {
          lang,
          format,
          includeTimestamps
        };

        const result = await YouTubeTranscript.retrieve(videoId, options);
        
        // For text and SRT formats, return as plain text
        if (options.format === 'text' || options.format === 'srt') {
          return {
            content: [{
              type: 'text',
              text: typeof result.transcript === 'string' 
                ? result.transcript 
                : JSON.stringify(result, null, 2)
            }]
          };
        }

        // For JSON format, return the full result
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      case 'list_available_transcripts': {
        // Validate that at least one input is provided
        if (!args?.url && !args?.video_id) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Either "url" or "video_id" parameter is required'
              }, null, 2)
            }]
          };
        }
        
        const videoId = extractVideoId(args);
        
        if (!videoId) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Invalid YouTube URL or video ID provided'
              }, null, 2)
            }]
          };
        }

        // Get available languages by fetching with a dummy language
        const result = await YouTubeTranscript.retrieve(videoId, { lang: 'en' });
        
        if (result.metadata?.availableLanguages) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                videoId,
                title: result.metadata.title,
                availableLanguages: result.metadata.availableLanguages,
                count: result.metadata.availableLanguages.length
              }, null, 2)
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                videoId,
                error: result.error || 'Could not retrieve available languages'
              }, null, 2)
            }]
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log to stderr to avoid interfering with MCP communication
  console.error('YouTube Transcript MCP Server running...');
}

// Run the server
main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});