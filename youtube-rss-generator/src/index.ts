#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { YouTubeURLParser } from './parser.js';
import { RSSValidator } from './validator.js';
import { RSSFeedResult, BatchResult } from './types.js';

// Define the tools
const TOOLS = [
  {
    name: 'generate_rss_feed',
    description: 'Generate a valid YouTube RSS feed URL from various YouTube URL formats',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'YouTube URL in any supported format'
        },
        validate: {
          type: 'boolean',
          description: 'Whether to validate the RSS feed is accessible (default: true)',
          default: true
        }
      },
      required: ['url']
    }
  },
  {
    name: 'batch_generate_rss_feeds',
    description: 'Process multiple YouTube URLs at once to generate RSS feeds',
    inputSchema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Array of YouTube URLs'
        },
        validate: {
          type: 'boolean',
          description: 'Whether to validate each RSS feed',
          default: true
        },
        continueOnError: {
          type: 'boolean',
          description: 'Continue processing if a URL fails',
          default: true
        }
      },
      required: ['urls']
    }
  }
];

/**
 * Generate RSS feed result for a single URL
 */
async function generateRSSFeed(url: string, validate: boolean = true): Promise<RSSFeedResult> {
  const parsed = YouTubeURLParser.parse(url);
  const feedUrl = YouTubeURLParser.generateRSSUrl(parsed);

  const result: RSSFeedResult = {
    success: false,
    feedUrl: null,
    feedType: parsed.type,
    sourceType: parsed.sourceType,
    extractedId: parsed.id,
    validation: {
      performed: false,
      isValid: false,
      statusCode: null,
      error: null
    },
    metadata: {
      originalUrl: parsed.originalUrl,
      normalizedUrl: parsed.normalizedUrl
    }
  };

  if (!feedUrl) {
    if (parsed.sourceType === 'handle' || parsed.sourceType === 'custom_name') {
      result.validation.error = 'Cannot directly generate RSS feed for handles or custom channel names. These require channel ID resolution.';
    } else if (parsed.sourceType === 'video' || parsed.sourceType === 'short' || parsed.sourceType === 'live') {
      result.validation.error = 'Cannot generate RSS feed for individual videos. Please provide a channel or playlist URL.';
    } else {
      result.validation.error = 'Unable to generate RSS feed URL from the provided YouTube URL';
    }
    return result;
  }

  result.feedUrl = feedUrl;

  if (validate) {
    result.validation = await RSSValidator.validate(feedUrl);
    result.success = result.validation.isValid;
  } else {
    result.success = true;
    result.validation.performed = false;
  }

  return result;
}

/**
 * Process multiple URLs in batch
 */
async function batchGenerateRSSFeeds(
  urls: string[],
  validate: boolean = true,
  continueOnError: boolean = true
): Promise<BatchResult> {
  const results: RSSFeedResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const url of urls) {
    try {
      const result = await generateRSSFeed(url, validate);
      results.push(result);
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
        if (!continueOnError) {
          break;
        }
      }
    } catch (error: any) {
      failureCount++;
      
      const errorResult: RSSFeedResult = {
        success: false,
        feedUrl: null,
        feedType: null,
        sourceType: 'video',
        extractedId: null,
        validation: {
          performed: false,
          isValid: false,
          statusCode: null,
          error: error.message || 'Unknown error'
        },
        metadata: {
          originalUrl: url,
          normalizedUrl: url
        }
      };
      
      results.push(errorResult);
      
      if (!continueOnError) {
        break;
      }
    }
  }

  return {
    results,
    totalProcessed: results.length,
    successCount,
    failureCount
  };
}

/**
 * Create and run the MCP server
 */
async function main() {
  const server = new Server(
    {
      name: 'youtube-rss-generator',
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
      case 'generate_rss_feed': {
        const { url, validate = true } = args as { url: string; validate?: boolean };
        
        if (!url) {
          throw new Error('URL is required');
        }

        const result = await generateRSSFeed(url, validate);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'batch_generate_rss_feeds': {
        const { 
          urls, 
          validate = true, 
          continueOnError = true 
        } = args as { 
          urls: string[]; 
          validate?: boolean; 
          continueOnError?: boolean 
        };
        
        if (!urls || !Array.isArray(urls)) {
          throw new Error('URLs array is required');
        }

        if (urls.length === 0) {
          throw new Error('URLs array cannot be empty');
        }

        const result = await batchGenerateRSSFeeds(urls, validate, continueOnError);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Run the server
main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});