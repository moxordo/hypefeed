# YouTube RSS MCP Server - NPM Package

## 🎉 Successfully Published to NPM!

The YouTube RSS Generator MCP Server is now available on npm as `youtube-rss-mcp-server`.

### Package Details
- **Name**: youtube-rss-mcp-server
- **Version**: 1.0.0
- **NPM Page**: https://www.npmjs.com/package/youtube-rss-mcp-server
- **Author**: moxordo
- **Description**: Model Context Protocol (MCP) server for generating YouTube RSS feed URLs from various YouTube URL formats

## Installation & Usage

### Quick Start with npx (No Installation Required)
```bash
npx youtube-rss-mcp-server@latest
```

### Global Installation
```bash
npm install -g youtube-rss-mcp-server

# Then run:
youtube-rss-mcp-server
```

### As a Project Dependency
```bash
npm install youtube-rss-mcp-server
```

## Claude Desktop Integration

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

### Using npx (Recommended)
```json
{
  "mcpServers": {
    "youtube-rss": {
      "command": "npx",
      "args": ["youtube-rss-mcp-server@latest"]
    }
  }
}
```

### Using Global Installation
```json
{
  "mcpServers": {
    "youtube-rss": {
      "command": "youtube-rss-mcp-server"
    }
  }
}
```

## Available MCP Tools

Once integrated, Claude will have access to:

### 1. `generate_rss_feed`
Generates a valid YouTube RSS feed URL from various YouTube URL formats.

**Parameters:**
- `url` (string): YouTube URL in any supported format
- `validate` (boolean, optional): Whether to validate the RSS feed is accessible (default: true)

**Supported URL Formats:**
- Channel URLs: `youtube.com/channel/CHANNEL_ID`
- User URLs: `youtube.com/user/USERNAME`
- Custom URLs: `youtube.com/c/CUSTOM_NAME`
- Handle URLs: `youtube.com/@handle`
- Playlist URLs: `youtube.com/playlist?list=PLAYLIST_ID`
- Video URLs: `youtube.com/watch?v=VIDEO_ID` (extracts channel feed)

### 2. `batch_generate_rss_feeds`
Process multiple YouTube URLs at once to generate RSS feeds.

**Parameters:**
- `urls` (array): Array of YouTube URLs
- `validate` (boolean, optional): Whether to validate each RSS feed (default: true)
- `continueOnError` (boolean, optional): Continue processing if a URL fails (default: true)

## Example Usage in Claude

After configuring Claude Desktop, you can ask:
- "Generate an RSS feed for https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw"
- "Create RSS feeds for these YouTube channels: [list of URLs]"
- "Get the RSS feed URL for @mkbhd on YouTube"
- "Convert this YouTube playlist to an RSS feed: [playlist URL]"

## Features

- ✅ **Multiple URL Format Support**: Handles all YouTube URL formats
- ✅ **Validation**: Optional RSS feed validation
- ✅ **Batch Processing**: Process multiple URLs at once
- ✅ **Error Handling**: Detailed error messages for troubleshooting
- ✅ **Type Safety**: Full TypeScript support with type definitions

## Package Statistics

- **Size**: ~12.1 KB (packed)
- **Unpacked Size**: ~47.5 KB
- **Dependencies**: 2 (@modelcontextprotocol/sdk, node-fetch)
- **Files**: 18 (compiled JavaScript + TypeScript definitions)

## Updates

To update to the latest version:
```bash
# If using npx, it always fetches the latest
npx youtube-rss-mcp-server@latest

# If globally installed
npm update -g youtube-rss-mcp-server

# Check current version
npm view youtube-rss-mcp-server version
```

## Testing the Server

### Test if it's working:
```bash
# Start the server (it will wait for MCP commands)
npx youtube-rss-mcp-server@latest

# In another terminal, you can check if it's running
ps aux | grep youtube-rss-mcp-server
```

### Sample RSS Feed URLs Generated:
- Channel: `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`
- Playlist: `https://www.youtube.com/feeds/videos.xml?playlist_id=PLAYLIST_ID`

## Troubleshooting

### If npx doesn't work
1. Clear npm cache: `npm cache clean --force`
2. Try with full registry URL: `npx --registry https://registry.npmjs.org youtube-rss-mcp-server`

### If Claude doesn't see the tools
1. Restart Claude Desktop completely
2. Check the configuration file is valid JSON
3. Ensure the command path is correct
4. Check Claude Desktop logs for errors

### Common Issues
- **"Command not found"**: Make sure Node.js 18+ is installed
- **"RSS feed validation failed"**: The channel/playlist might be private or deleted
- **"Invalid YouTube URL"**: Check the URL format is supported

## Source Code

The source code is available at the repository specified in package.json.

## License

MIT

## Support

For issues or questions, please open an issue on the GitHub repository.