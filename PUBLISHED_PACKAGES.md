# Published NPM Packages

## Successfully Published MCP Servers

### 1. YouTube Transcript MCP Server
- **Package Name**: `youtube-transcript-mcp-server`
- **Version**: 1.0.0
- **NPM URL**: https://www.npmjs.com/package/youtube-transcript-mcp-server
- **Description**: Retrieves YouTube video transcripts with internalized logic
- **Size**: ~12.7 KB packed
- **Install**: `npx youtube-transcript-mcp-server@latest`

**MCP Tools:**
- `retrieve_transcript` - Get transcripts in JSON/text/SRT formats
- `list_available_transcripts` - List available languages

**Status**: ⚠️ Limited by YouTube API authentication requirements (detects captions but may receive empty data)

---

### 2. YouTube RSS MCP Server
- **Package Name**: `youtube-rss-mcp-server`
- **Version**: 1.0.0
- **NPM URL**: https://www.npmjs.com/package/youtube-rss-mcp-server
- **Description**: Generates YouTube RSS feed URLs from various URL formats
- **Size**: ~12.1 KB packed
- **Install**: `npx youtube-rss-mcp-server@latest`

**MCP Tools:**
- `generate_rss_feed` - Generate RSS URL from YouTube URL
- `batch_generate_rss_feeds` - Process multiple URLs at once

**Status**: ✅ Fully functional

---

## Quick Claude Desktop Setup

Add both servers to your Claude Desktop config:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "command": "npx",
      "args": ["youtube-transcript-mcp-server@latest"]
    },
    "youtube-rss": {
      "command": "npx",
      "args": ["youtube-rss-mcp-server@latest"]
    }
  }
}
```

**Config Location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

## Usage Examples

### With npx (no installation needed):
```bash
# Run YouTube Transcript Server
npx youtube-transcript-mcp-server@latest

# Run YouTube RSS Server
npx youtube-rss-mcp-server@latest
```

### Global Installation:
```bash
# Install globally
npm install -g youtube-transcript-mcp-server youtube-rss-mcp-server

# Run servers
youtube-transcript-mcp-server
youtube-rss-mcp-server
```

## Author
- NPM Username: moxordo
- Packages: 2 MCP servers for YouTube functionality

## Summary Statistics
- **Total Packages**: 2
- **Combined Size**: ~25 KB
- **Total MCP Tools**: 4
- **Dependencies**: Minimal (only MCP SDK + node-fetch for RSS)

Both packages are now live on npm and can be used immediately with npx!