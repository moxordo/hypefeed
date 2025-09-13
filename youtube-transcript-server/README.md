# YouTube Transcript MCP Server

A Model Context Protocol (MCP) server for retrieving YouTube video transcripts/captions. This implementation internalizes all transcript fetching logic, eliminating fragile external dependencies.

## Features

- 🎯 **Zero fragile dependencies** - All transcript fetching logic is internalized
- 🌍 **Multi-language support** - Retrieve transcripts in any available language
- 📝 **Multiple output formats** - JSON, plain text, or SRT subtitle format
- 🔄 **Robust error handling** - Graceful fallbacks and clear error messages
- ⚡ **Simple installation** - One-line npx setup
- 🎨 **Flexible input** - Accepts various YouTube URL formats or video IDs

## Installation

### Quick Setup (npx)

The simplest way to use the server:

```bash
npx youtube-transcript-server
```

### Install Globally

```bash
npm install -g youtube-transcript-server
```

### Install as Dependency

```bash
npm install youtube-transcript-server
```

### MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop, Cline, etc.):

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "command": "npx",
      "args": ["youtube-transcript-server"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "command": "youtube-transcript-server"
    }
  }
}
```

## MCP Tools

### `retrieve_transcript`

Retrieves the transcript from a YouTube video.

**Parameters:**
- `url` (string, optional): YouTube video URL in any format
- `video_id` (string, optional): YouTube video ID (alternative to url)
- `lang` (string, optional): Language code (default: "en")
- `format` (string, optional): Output format - "json", "text", or "srt" (default: "json")
- `include_timestamps` (boolean, optional): Include timestamps in text format (default: false)

**Example Usage:**

```javascript
// Using video URL
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "lang": "en",
  "format": "json"
}

// Using video ID
{
  "video_id": "dQw4w9WgXcQ",
  "format": "text",
  "include_timestamps": true
}

// Get SRT format
{
  "url": "https://youtu.be/dQw4w9WgXcQ",
  "format": "srt"
}
```

### `list_available_transcripts`

Lists all available transcript languages for a video.

**Parameters:**
- `url` (string, optional): YouTube video URL
- `video_id` (string, optional): YouTube video ID

**Example Usage:**

```javascript
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

## Supported URL Formats

The server accepts various YouTube URL formats:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/embed/VIDEO_ID`
- `https://youtube.com/shorts/VIDEO_ID`
- `https://youtube.com/live/VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`
- Direct video ID: `VIDEO_ID`

## Output Formats

### JSON Format (default)
Returns structured data with timing information:
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "language": "en",
  "transcript": [
    {
      "text": "Never gonna give you up",
      "start": 0.5,
      "duration": 2.3,
      "end": 2.8
    }
  ],
  "metadata": {
    "title": "Video Title",
    "duration": 213.5,
    "availableLanguages": ["en", "es", "fr"]
  }
}
```

### Text Format
Plain text output, optionally with timestamps:
```
Never gonna give you up Never gonna let you down
```

Or with timestamps:
```
[00:00] Never gonna give you up
[00:03] Never gonna let you down
```

### SRT Format
Standard subtitle format:
```
1
00:00:00,500 --> 00:00:02,800
Never gonna give you up

2
00:00:02,800 --> 00:00:05,100
Never gonna let you down
```

## Development

### Prerequisites
- Node.js >= 18.0.0
- TypeScript

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd youtube-transcript-server

# Install dependencies
npm install

# Build
npm run build

# Development mode
npm run dev

# Run tests
npm test
```

### Project Structure
```
youtube-transcript-server/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── transcript.ts      # Core transcript fetching logic
│   ├── parser.ts          # YouTube URL parser
│   └── types.ts           # TypeScript interfaces
├── dist/                  # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Key Improvements Over Original

1. **No External Dependencies**: Removed dependency on `youtube-captions-scraper`
2. **Internalized Logic**: All transcript fetching is handled internally
3. **Better Error Handling**: Clear error messages and graceful fallbacks
4. **Multiple Formats**: Support for JSON, text, and SRT output
5. **Robust Parsing**: Handles various YouTube URL formats
6. **Language Fallback**: Automatic fallback to available languages
7. **Simple Installation**: One-line npx setup

## Current Limitations

**Important Note**: YouTube has recently made changes to their transcript API that require authentication tokens and session cookies. The current implementation may not be able to retrieve transcripts for all videos due to these restrictions. 

The server correctly:
- ✅ Parses YouTube URLs and extracts video IDs
- ✅ Detects available caption tracks and languages
- ✅ Generates proper transcript URLs
- ⚠️ May receive empty responses from YouTube's API due to authentication requirements

This is a known limitation affecting all similar tools that don't use browser automation or official YouTube APIs. For production use cases requiring reliable transcript access, consider:
1. Using YouTube's official Data API (requires API key and has quotas)
2. Browser automation tools like Playwright that can maintain session state
3. Third-party services that provide transcript APIs

## Error Handling

The server provides clear error messages for common issues:

- Invalid YouTube URL or video ID
- No captions available for the video
- Requested language not available (with list of available languages)
- Network errors with retry logic
- Transcript parsing errors

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For issues or questions, please open an issue on the GitHub repository.