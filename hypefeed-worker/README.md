# HypeFeed - AI YouTube Channels RSS Aggregator

A Cloudflare Workers application that aggregates RSS feeds from top AI pioneer YouTube channels and serves a combined feed with rich metadata and proper caching.

## Features

- **🤖 AI-focused content**: Curated channels from top AI pioneers and educators
- **⚡ High performance**: Built on Cloudflare Workers with global edge distribution  
- **🔄 Automatic updates**: RSS feeds refreshed every 10 minutes via cron triggers
- **💾 Reliable storage**: R2 for feed storage with versioning and KV for caching
- **📊 Rich metadata**: Detailed channel information, statistics, and feed analytics
- **🌐 RESTful API**: Clean endpoints for feed access and management
- **📱 Mobile-friendly**: Optimized RSS XML with rich descriptions and thumbnails

## Architecture

Single Cloudflare Worker handling:
- **HTTP requests**: Hono framework for fast routing and middleware
- **Scheduled jobs**: Cron triggers for RSS aggregation (every 10 minutes)
- **Storage**: R2 for persistent feeds, KV for fast caching

## API Endpoints

### RSS Feed
- `GET /feed.xml` - Latest combined RSS feed
- `GET /feed/{timestamp}.xml` - Historical feed version
- `GET /feed/versions` - List available feed versions  
- `GET /feed/stats` - Feed statistics and metadata

### Management
- `GET /channels` - List all channels and their status
- `GET /channels/{channelId}` - Get specific channel details
- `GET /health` - Service health check
- `POST /refresh` - Manual feed refresh trigger

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) package manager
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) 
- Cloudflare account with Workers and R2 enabled

### Installation

1. **Install dependencies**:
   ```bash
   cd hypefeed-worker
   bun install
   ```

2. **Configure Cloudflare resources**:
   ```bash
   # Create R2 bucket
   wrangler r2 bucket create hypefeed-rss-storage
   
   # Create KV namespace  
   wrangler kv:namespace create "HYPEFEED_KV"
   wrangler kv:namespace create "HYPEFEED_KV" --preview
   ```

3. **Update wrangler.toml** with your KV namespace IDs

4. **Deploy**:
   ```bash
   bun run deploy
   ```

### Development

```bash
# Start local development server
bun run dev

# Type check
bun run type-check

# Build for production
bun run build
```

## Configuration

### Environment Variables (wrangler.toml)
- `FEED_TITLE` - RSS feed title
- `FEED_DESCRIPTION` - RSS feed description  
- `FEED_LANGUAGE` - RSS feed language (default: en-US)
- `MAX_FEED_ITEMS` - Maximum items per feed (default: 50)

### Channels Configuration
Channels are configured in `src/data/channels.ts` with:
- Channel metadata (name, subscribers, category)
- YouTube RSS feed URLs
- Status (LIVE, TRYOUT, CANDIDATE, etc.)

## Monitored Channels

Current channels being aggregated:

| Channel | Subscribers | Category | Focus |
|---------|-------------|----------|--------|
| Two Minute Papers | 1.66M | Research Analysis | AI research papers |
| Krish Naik | 1.25M | Education | ML/Data Science tutorials |
| Matt Wolfe | 785K | Tools & Practical | AI tools, FutureTools.io |
| DeepLearning.AI | 429K | Academic | Andrew Ng content |
| Sentdex | 273K | Programming | Python ML programming |
| MattVidPro AI | 245K | Video Production | AI for video/film |
| Andrej Karpathy | 220K | Deep Learning | LLM expert content |

## Storage Structure

### R2 Bucket Layout
```
feeds/
  current.xml              # Always latest feed
  2024-01-15T10-30-00.xml # Versioned feeds
  2024-01-15T10-20-00.xml
meta/
  last-update.json        # Feed metadata
data/
  channels.json          # Channel configuration
```

### KV Namespace
- `current_feed_xml` - Cached latest feed (5 min TTL)

## Cron Schedule

RSS aggregation runs every 10 minutes:
- Fetches all channel RSS feeds in parallel
- Parses and merges content chronologically  
- Generates rich XML with metadata
- Stores in R2 with versioning
- Updates KV cache for fast access

## Error Handling

- **Feed fetch failures**: Retries with exponential backoff
- **Storage errors**: Graceful degradation with logging
- **Parsing errors**: Individual feed failures don't break aggregation
- **Rate limiting**: Batched requests to avoid overwhelming sources

## Monitoring

Health endpoints provide:
- Service status and uptime
- Storage health and capacity
- Channel success/failure rates
- Last update timestamps
- Performance metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `bun run dev`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- 📖 [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- 🌐 [Hono Framework](https://hono.dev/)
- 💾 [R2 Storage Docs](https://developers.cloudflare.com/r2/)

---

Built with ❤️ using Cloudflare Workers, Hono, and TypeScript