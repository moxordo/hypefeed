# HypeGit (DevRadar)

Developer hype & mindshare tracker using GitHub trending data and star growth patterns.

## Overview

HypeGit tracks GitHub repository trends, detects surges in developer interest, and visualizes the tech landscape through star growth patterns. Built on the Cloudflare ecosystem (Workers, D1, R2).

## Key Features

- **Daily Trending Scraping**: Captures GitHub trending repos across multiple languages and time ranges
- **Star Growth Tracking**: Monitors repository star counts and detects surges
- **Historical Archives**: Preserves trending page snapshots in R2 for analysis
- **Surge Detection**: Identifies repositories experiencing rapid growth
- **Tech Radar**: Visualizes developer mindshare and emerging technologies

## Architecture

- **Cloudflare Workers**: Serverless compute for scraping and API
- **Cloudflare D1**: SQLite database for repository metadata and time-series data
- **Cloudflare R2**: Object storage for HTML snapshots
- **Prisma ORM**: Type-safe database operations
- **Hono**: Fast web framework for API routes

## Setup

### Prerequisites

- Bun package manager
- Cloudflare account with Workers access
- GitHub Personal Access Token (for API)

### Installation

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Create D1 database
wrangler d1 create hypegit-repos

# Create R2 bucket
wrangler r2 bucket create hypegit-snapshots

# Update wrangler.toml with database_id

# Run migrations
bun run db:migrate:local
bun run db:migrate:remote

# Set GitHub token
wrangler secret put GITHUB_TOKEN
```

### Development

```bash
# Build worker
bun run build

# Run locally
bun run dev

# Deploy to production
bun run deploy
```

## Database Schema

- **Repository**: Core repo metadata (name, owner, stars, language, etc.)
- **StarSnapshot**: Time-series star count data
- **TrendingCapture**: Record of trending page appearances
- **Topic**: Tech topics/tags
- **RepositoryTopic**: Many-to-many relationship

## API Endpoints

### Repositories
- `GET /api/repos` - List repositories
- `GET /api/repos/:owner/:name` - Repo details with star history

### Trending
- `GET /api/trending` - Current trending repos
- `GET /api/trending/:range/:language` - Filtered trending

### Analytics
- `GET /api/surges` - Currently surging repositories
- `GET /api/stats` - Platform statistics

## Implementation Phases

### Phase 1: Core Infrastructure (✅ Current)
- Database schema and migrations
- GitHub trending scraper
- R2 snapshot storage
- Daily cron job

### Phase 2: Star Tracking (Planned)
- Hourly star count updates
- Surge detection algorithm
- Staleness detection
- REST API endpoints

### Phase 3: Visualization (Planned)
- Dashboard frontend
- Growth charts
- Tech radar visualization
- Topic extraction

## Cron Schedule

- **Daily (2 AM UTC)**: Scrape trending pages (daily/weekly/monthly × 6 languages)
- **Hourly**: Update star counts for active repos (Phase 2)
- **Weekly**: Topic extraction and staleness checks (Phase 3)

## License

MIT
