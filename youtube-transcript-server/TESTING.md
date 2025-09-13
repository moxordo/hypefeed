# Testing Guide for YouTube Transcript MCP Server

This guide provides multiple ways to test the YouTube Transcript MCP Server functionality.

## Prerequisites

First, ensure the project is built:

```bash
cd youtube-transcript-server
bun install  # or npm install
bun run build  # or npm run build
```

## Testing Methods

### Method 1: Standalone Test (Recommended for Quick Testing)

The standalone test directly tests the transcript fetching logic without the MCP wrapper:

```bash
# Run the standalone test
bun run tsx src/standalone-test.ts

# Or if you prefer Node
node --loader tsx src/standalone-test.ts
```

This test will:
- ✅ Test URL parsing for various YouTube URL formats
- ✅ Test video ID extraction
- ✅ Test transcript retrieval in JSON, text, and SRT formats
- ✅ Test error handling for invalid inputs
- ⚠️ Show if transcripts are empty due to YouTube API restrictions

### Method 2: MCP Test Client

The MCP test client spawns the server and communicates with it using the MCP protocol:

```bash
# Build first if not already done
bun run build

# Run the MCP test client
bun run tsx src/test-client.ts
```

This test will:
- Start the MCP server as a subprocess
- Connect to it using the MCP protocol
- List available tools
- Test various tool calls with different parameters
- Show the results

### Method 3: Claude Desktop Integration

To test with Claude Desktop:

1. **Locate your Claude Desktop configuration file:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Add the server to your configuration:**

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "command": "node",
      "args": ["/absolute/path/to/youtube-transcript-server/dist/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/` with your actual path.

3. **Restart Claude Desktop**

4. **Test in Claude:**
   - Ask Claude: "Can you get the transcript for https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   - Claude should use the `retrieve_transcript` tool

### Method 4: Direct Server Testing

You can manually start the server and send MCP messages:

```bash
# Start the server
node dist/index.js

# The server expects MCP protocol messages via stdin/stdout
# This is not recommended for manual testing as it requires 
# formatting JSON-RPC messages correctly
```

### Method 5: NPX Testing

Once published, you can test with npx:

```bash
# This would work after publishing to npm
npx youtube-transcript-server

# Currently, for local testing:
npm link  # in the youtube-transcript-server directory
npx youtube-transcript-server  # should now work globally
```

## Test Videos

Here are some videos you can use for testing:

1. **Rick Astley - Never Gonna Give You Up**
   - URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Video ID: `dQw4w9WgXcQ`
   - Has multiple language captions

2. **First YouTube Video**
   - URL: `https://www.youtube.com/watch?v=jNQXAC9IVRw`
   - Video ID: `jNQXAC9IVRw`
   - Short video with captions

3. **Your Test Video**
   - URL: `https://www.youtube.com/watch?v=0SQor2z2QAU`
   - Video ID: `0SQor2z2QAU`
   - Has English captions

## Expected Results

### Successful Response (when captions are available):
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "language": "en",
  "transcript": [...],
  "metadata": {
    "title": "Video Title",
    "duration": 213,
    "availableLanguages": ["en", "es", "fr"]
  }
}
```

### Current Limitation Response:
```json
{
  "success": false,
  "videoId": "dQw4w9WgXcQ",
  "language": "en",
  "error": "Transcript is empty",
  "metadata": {
    "title": "Video Title",
    "availableLanguages": ["en", "es", "fr"]
  }
}
```

## Debugging

If tests are failing:

1. **Check video availability:**
   - Ensure the video is public and not age-restricted
   - Try the URL in a browser first

2. **Check build output:**
   ```bash
   ls -la dist/
   # Should show compiled .js files
   ```

3. **Check for TypeScript errors:**
   ```bash
   bun run build
   # or
   npx tsc --noEmit
   ```

4. **Enable debug output:**
   - Run the debug test: `bun run tsx src/debug-test.ts`
   - This shows detailed information about caption detection

## Known Issues

1. **Empty Transcripts:** Due to YouTube's authentication requirements, the server may detect captions but receive empty transcript data. This is a limitation of the current YouTube API access method.

2. **Rate Limiting:** Making too many requests quickly may result in temporary blocks from YouTube.

3. **Regional Restrictions:** Some videos may have different caption availability based on geographic location.

## Adding New Tests

To add new test videos, edit `src/standalone-test.ts`:

```typescript
const testVideos = [
  {
    name: 'Your Video Name',
    url: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID',
    expectedId: 'YOUR_VIDEO_ID'
  },
  // Add more videos here
];
```

## Performance Testing

To test server performance:

```bash
# Time a single request
time bun run tsx src/standalone-test.ts

# Run multiple iterations
for i in {1..10}; do
  bun run tsx src/standalone-test.ts
done
```

## Troubleshooting

### "Cannot find module" errors
```bash
# Rebuild the project
bun run build
```

### "Server not starting" in MCP client
```bash
# Check if the server runs standalone
node dist/index.js
# Should output: "YouTube Transcript MCP Server running..."
```

### Claude Desktop not finding the tool
1. Check the configuration file is valid JSON
2. Ensure the path to index.js is absolute
3. Restart Claude Desktop completely
4. Check Claude Desktop logs for errors

## Contributing Tests

When contributing, please:
1. Add test cases to `src/standalone-test.ts`
2. Document any new test videos in this file
3. Ensure all existing tests still pass
4. Test with at least 2 different video URLs