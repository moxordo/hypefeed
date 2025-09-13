# YouTube Transcript MCP Server - NPM Package

## 🎉 Successfully Published to NPM!

The package is now available on npm as `youtube-transcript-mcp-server`.

### Package Details
- **Name**: youtube-transcript-mcp-server
- **Version**: 1.0.0
- **NPM Page**: https://www.npmjs.com/package/youtube-transcript-mcp-server
- **Author**: moxordo

## Installation & Usage

### Quick Start with npx (No Installation Required)
```bash
npx youtube-transcript-mcp-server@latest
```

### Global Installation
```bash
npm install -g youtube-transcript-mcp-server

# Then run:
youtube-transcript-mcp-server
```

### As a Project Dependency
```bash
npm install youtube-transcript-mcp-server
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
    "youtube-transcript": {
      "command": "npx",
      "args": ["youtube-transcript-mcp-server@latest"]
    }
  }
}
```

### Using Global Installation
```json
{
  "mcpServers": {
    "youtube-transcript": {
      "command": "youtube-transcript-mcp-server"
    }
  }
}
```

## Available MCP Tools

Once integrated, Claude will have access to:

1. **`retrieve_transcript`** - Get transcripts from YouTube videos
   - Supports multiple URL formats
   - Output formats: JSON, text, SRT
   - Language selection

2. **`list_available_transcripts`** - List available languages for a video

## Example Usage in Claude

After configuring Claude Desktop, you can ask:
- "Get the transcript for https://www.youtube.com/watch?v=dQw4w9WgXcQ"
- "List available transcripts for this YouTube video: [URL]"
- "Get the Spanish transcript for [YouTube URL]"

## Package Statistics

- **Size**: ~12.7 KB (packed)
- **Unpacked Size**: ~50.6 KB
- **Dependencies**: 1 (only @modelcontextprotocol/sdk)
- **Files**: 18 (compiled JavaScript + TypeScript definitions)

## Updates

To update to the latest version:
```bash
# If using npx, it always fetches the latest
npx youtube-transcript-mcp-server@latest

# If globally installed
npm update -g youtube-transcript-mcp-server

# Check current version
npm view youtube-transcript-mcp-server version
```

## Troubleshooting

### If npx doesn't work
1. Clear npm cache: `npm cache clean --force`
2. Try with full registry URL: `npx --registry https://registry.npmjs.org youtube-transcript-mcp-server`

### If Claude doesn't see the tools
1. Restart Claude Desktop completely
2. Check the configuration file is valid JSON
3. Ensure the command path is correct

## Source Code

The source code is available at the repository specified in package.json.

## License

MIT