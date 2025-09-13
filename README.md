# HypeFeed - AI YouTube Channel Aggregation Platform

A comprehensive platform for discovering, aggregating, and evaluating AI-focused YouTube channels with automated RSS feed generation and content curation.

## 🎯 Overview

HypeFeed is a multi-component system designed to:
- **Discover** top AI pioneer YouTube channels through automated scraping
- **Aggregate** RSS feeds from curated channels into a unified feed
- **Evaluate** channel quality and content relevance
- **Serve** high-quality RSS feeds via Cloudflare Workers

## 📦 Components

### 1. **HypeFeed Worker** (`/hypefeed-worker`)
Cloudflare Workers application for RSS aggregation and serving
- **Technology**: TypeScript, Hono, Cloudflare Workers
- **Features**: 
  - Aggregates RSS feeds from 7+ AI YouTube channels
  - Updates every 10 minutes via cron triggers
  - R2 storage for feed persistence with versioning
  - KV cache for fast content delivery
  - RESTful API for feed access and management
- **Endpoints**:
  - `GET /feed.xml` - Latest combined RSS feed
  - `GET /channels` - Channel list and status
  - `GET /health` - Service health check

### 2. **YouTube RSS Generator** (`/youtube-rss-generator`)
Library and utilities for YouTube RSS feed extraction
- **NPM Package**: `youtube-rss-generator`
- **Features**:
  - Extract RSS URLs from YouTube channels/handles
  - Validate RSS feed accessibility
  - Batch processing support
  - Multiple URL format support

### 3. **YouTube Transcript Server** (`/youtube-transcript-server`)
MCP server for YouTube transcript extraction
- **Technology**: TypeScript, MCP SDK
- **Features**:
  - Retrieve transcripts/captions from YouTube videos
  - Multiple output formats (text, JSON, SRT)
  - Language support

### 4. **Channel Discovery & Evaluation**
Automated discovery and evaluation pipeline
- **Scraping Command**: `/scrape` - Discover AI YouTube channels
- **Evaluation Workflow**:
  - PENDING_EVALUATION → TRYOUT → CANDIDATE → LIVE
  - Channel quality assessment
  - Content relevance scoring

## 🚀 Quick Start

### Deploy RSS Aggregator
```bash
cd hypefeed-worker
bun install
wrangler r2 bucket create hypefeed-rss-storage
wrangler kv:namespace create "HYPEFEED_KV"
bun run deploy
```

### Use YouTube RSS Generator
```bash
cd youtube-rss-generator
bun install
bun run validate-formats
```

## 📊 Monitored AI Channels

| Channel | Subscribers | Category | Focus |
|---------|-------------|----------|--------|
| Two Minute Papers | 1.66M | Research | AI research papers |
| Krish Naik | 1.25M | Education | ML/Data Science |
| Matt Wolfe | 785K | Tools | AI tools, FutureTools.io |
| DeepLearning.AI | 429K | Academic | Andrew Ng content |
| Sentdex | 273K | Programming | Python ML |
| MattVidPro AI | 245K | Video Production | AI for video |
| Andrej Karpathy | 220K | Deep Learning | LLM expertise |

## 🏗️ Architecture

```
┌─────────────────────┐
│   Channel Discovery │ ← Scraping & Discovery
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │  Evaluation  │ ← Quality Assessment
    └──────┬───────┘
           │
    ┌──────▼──────────┐
    │ RSS Aggregator  │ ← Cloudflare Worker
    │   (10 min cron) │
    └──────┬──────────┘
           │
    ┌──────▼───────┐
    │  R2 Storage  │ ← Persistent Feed Storage
    └──────┬───────┘
           │
    ┌──────▼───────┐
    │  RSS Feed    │ ← Public API
    │  /feed.xml   │
    └──────────────┘
```

## 🔧 Development Workflow

### Overall Flow

**RECRUITER** → **TAPPER** → **EVALUATOR**

1. **RECRUITER**: Discovers new AI YouTube channels based on criteria
2. **TAPPER**: Aggregates RSS feeds and monitors content
3. **EVALUATOR**: Assesses channel quality and relevance

## 📁 Repository Structure

```
hypefeed/
├── hypefeed-worker/         # Cloudflare Workers RSS aggregator
│   ├── src/                 # Source code
│   ├── wrangler.toml        # Cloudflare config
│   └── README.md           
├── youtube-rss-generator/   # RSS URL extraction library
│   ├── src/                 # Source code
│   ├── dist/                # Built library
│   └── package.json        
├── youtube-transcript-server/ # MCP transcript server
│   ├── src/                 # Source code
│   └── package.json        
├── .claude/                 # Claude AI commands
│   └── commands/
│       └── scrape.md        # Channel discovery command
└── ai-youtube-channels-rss.json # Channel configuration
```

## 🛠️ Technologies

- **Runtime**: Cloudflare Workers, Node.js
- **Languages**: TypeScript
- **Frameworks**: Hono (HTTP), MCP SDK
- **Storage**: R2 (object), KV (cache)
- **Package Manager**: Bun
- **Infrastructure**: Cloudflare

## 📄 Configuration Files

- `ai-youtube-channels-rss.json` - Channel definitions and RSS URLs
- `wrangler.toml` - Cloudflare Workers configuration
- `.mcp.json` - MCP server configuration

## 🔗 Related Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
- [YouTube RSS Feed Format](https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID)

## 📝 License

MIT License - See individual component directories for specific licensing.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

---

Built with ❤️ for the AI community