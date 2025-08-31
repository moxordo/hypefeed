# YouTube RSS Feed Generator MCP Server

An MCP (Model Context Protocol) server that generates RSS feed URLs from various YouTube URL formats.

## Quick Start

1. **Add to Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
```json
{
  "mcpServers": {
    "youtube-rss": {
      "command": "npx",
      "args": ["-y", "youtube-rss-generator"]
    }
  }
}
```

2. **Restart Claude Desktop**

3. **Use it!** Ask Claude: "Generate RSS feed for https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw"

## Features

- **Comprehensive URL Support**: Handles 20+ YouTube URL formats including:
  - Channel IDs (`youtube.com/channel/[CHANNEL_ID]`)
  - Handles (`youtube.com/@[HANDLE]`)
  - Custom names (`youtube.com/c/[CUSTOM_NAME]`)
  - Usernames (`youtube.com/user/[USERNAME]`)
  - Playlists (`youtube.com/playlist?list=[PLAYLIST_ID]`)
  - Videos, Shorts, Live streams, and more
  - Mobile URLs (`m.youtube.com`)
  - International TLDs (`youtube.co.uk`, `youtube.de`, etc.)
  - Short URLs (`youtu.be`)

- **RSS Feed Validation**: Automatically validates generated RSS feeds are accessible
- **Batch Processing**: Process multiple URLs at once
- **Intelligent Caching**: Cache validation results to improve performance
- **Error Handling**: Comprehensive error messages with helpful guidance

## Installation & Setup

### Option 1: Install Locally (Development)

```bash
# Clone or navigate to the project directory
cd /path/to/youtube-rss-generator

# Install dependencies using bun (recommended)
bun install

# Or using npm
npm install

# Build the project
bun run build
# or
npm run build
```

### Option 2: Use via npx (No Installation)

You can run the server directly without installation:

```bash
npx -y youtube-rss-generator
```

## Usage

### Integrating with Claude Desktop

To use this MCP server with Claude Desktop, you need to add it to your configuration file:

#### 1. Locate your Claude Desktop configuration

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

#### 2. Edit the configuration

Open the config file and add the youtube-rss server:

```json
{
  "mcpServers": {
    "youtube-rss": {
      "command": "npx",
      "args": ["-y", "youtube-rss-generator"]
    }
  }
}
```

If you have other MCP servers already configured, add it to the existing list:

```json
{
  "mcpServers": {
    "existing-server": {
      "command": "...",
      "args": [...]
    },
    "youtube-rss": {
      "command": "npx",
      "args": ["-y", "youtube-rss-generator"]
    }
  }
}
```

#### 3. Restart Claude Desktop

After saving the configuration, restart Claude Desktop for the changes to take effect.

### Using the MCP Server in Claude

Once configured, you can use the tools in Claude by asking:

- "Generate an RSS feed for this YouTube channel: https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw"
- "Convert these YouTube URLs to RSS feeds: [list of URLs]"
- "Get the RSS feed for LinusTechTips YouTube channel"

The server will automatically be invoked when Claude detects you need to generate YouTube RSS feeds.

### Running Standalone (for testing)

You can also run the server standalone for testing:

```bash
# Using npx
npx -y youtube-rss-generator

# Or if installed locally
node dist/index.js
```

The server will start and wait for MCP protocol commands via stdio.

## Example Usage Scenarios

### Example 1: Get RSS feed for a YouTube Channel

**Input**: 
```
"Generate RSS feed for https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw"
```

**Output**:
```
RSS Feed URL: https://www.youtube.com/feeds/videos.xml?channel_id=UCXuqSBlHAE6Xw-yeJA0Tunw
✅ Feed validated and accessible
```

### Example 2: Convert a Playlist URL

**Input**:
```
"Get RSS for https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf"
```

**Output**:
```
RSS Feed URL: https://www.youtube.com/feeds/videos.xml?playlist_id=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
✅ Feed validated and accessible
```

### Example 3: Batch Process Multiple URLs

**Input**:
```
"Convert these to RSS feeds:
- youtube.com/user/LinusTechTips
- youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw
- youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf"
```

**Output**:
```
Processed 3 URLs:
✅ https://www.youtube.com/feeds/videos.xml?user=LinusTechTips
✅ https://www.youtube.com/feeds/videos.xml?channel_id=UCXuqSBlHAE6Xw-yeJA0Tunw  
✅ https://www.youtube.com/feeds/videos.xml?playlist_id=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
Success: 3/3
```

### Example 4: Handling Unsupported URLs

**Input**:
```
"Get RSS for https://www.youtube.com/@mkbhd"
```

**Output**:
```
⚠️ Cannot generate RSS feed for YouTube handles (@mkbhd)
Handles require channel ID resolution which needs API access.
Please find the channel ID or use the /user/ or /channel/ URL format.
```

## Available Tools

### `generate_rss_feed`

Generate a RSS feed URL from a single YouTube URL.

**Parameters:**
- `url` (string, required): YouTube URL in any supported format
- `validate` (boolean, optional): Whether to validate the RSS feed is accessible (default: true)

**Example Response:**
```json
{
  "success": true,
  "feedUrl": "https://www.youtube.com/feeds/videos.xml?channel_id=UCXuqSBlHAE6Xw-yeJA0Tunw",
  "feedType": "channel",
  "sourceType": "channel_id",
  "extractedId": "UCXuqSBlHAE6Xw-yeJA0Tunw",
  "validation": {
    "performed": true,
    "isValid": true,
    "statusCode": 200,
    "error": null
  },
  "metadata": {
    "originalUrl": "youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw",
    "normalizedUrl": "https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw"
  }
}
```

### `batch_generate_rss_feeds`

Process multiple YouTube URLs at once.

**Parameters:**
- `urls` (string[], required): Array of YouTube URLs
- `validate` (boolean, optional): Whether to validate each RSS feed (default: true)
- `continueOnError` (boolean, optional): Continue processing if a URL fails (default: true)

**Example Response:**
```json
{
  "results": [...],
  "totalProcessed": 5,
  "successCount": 4,
  "failureCount": 1
}
```

## Supported URL Formats

### Channels
- `youtube.com/channel/[CHANNEL_ID]` → ✅ Direct RSS generation
- `youtube.com/@[HANDLE]` → ⚠️ Requires channel ID resolution
- `youtube.com/c/[CUSTOM_NAME]` → ⚠️ Requires channel ID resolution
- `youtube.com/user/[USERNAME]` → ✅ Direct RSS generation
- `youtube.com/[CUSTOM_NAME]` → ⚠️ Requires channel ID resolution

### Playlists
- `youtube.com/playlist?list=[PLAYLIST_ID]` → ✅ Direct RSS generation
- `youtube.com/watch?v=[VIDEO_ID]&list=[PLAYLIST_ID]` → ✅ Extracts playlist RSS

### Videos (Not supported for RSS)
- `youtube.com/watch?v=[VIDEO_ID]` → ❌ Individual videos don't have RSS feeds
- `youtu.be/[VIDEO_ID]` → ❌ Individual videos don't have RSS feeds
- `youtube.com/shorts/[VIDEO_ID]` → ❌ Shorts don't have RSS feeds
- `youtube.com/live/[VIDEO_ID]` → ❌ Live streams don't have RSS feeds

## Output RSS Feed Formats

The server generates three types of RSS feed URLs:

1. **Channel Feed**: `https://www.youtube.com/feeds/videos.xml?channel_id=[CHANNEL_ID]`
2. **User Feed**: `https://www.youtube.com/feeds/videos.xml?user=[USERNAME]`
3. **Playlist Feed**: `https://www.youtube.com/feeds/videos.xml?playlist_id=[PLAYLIST_ID]`

## Limitations

- **Handles and Custom Names**: YouTube handles (`@username`) and custom channel names (`/c/name`) cannot be directly converted to RSS feeds. These require resolving to a channel ID first, which would require additional API access.

- **Individual Videos**: RSS feeds are not available for individual videos, shorts, or live streams. You need to provide the channel or playlist URL instead.

- **Rate Limiting**: YouTube may rate limit RSS feed access. The server includes caching to minimize repeated validation requests.

## Development

### Running Tests

```bash
bun test
# or
npm test
```

### Running in Development

```bash
bun run dev
# or
npm run dev
```

## Error Handling

The server provides detailed error messages for common issues:

- Invalid URL formats
- Unsupported content types (individual videos)
- Network errors during validation
- Rate limiting issues

## License

MIT