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

- **Cloudflare Workflows**: Durable execution for long-running scraping tasks (solves "Too many API requests" limits)
- **Cloudflare Workers**: Serverless compute for API endpoints
- **Cloudflare D1**: SQLite database for repository metadata and time-series data
- **Cloudflare R2**: Object storage for HTML snapshots
- **Prisma ORM**: Type-safe database operations
- **Hono**: Fast web framework for API routes

### Why Workflows?

The trending scraper processes **63 pages** (21 languages × 3 time ranges) with **~1,500 repositories**, resulting in **4,500+ API calls**. This exceeds Cloudflare Workers' per-invocation limits.

Workflows solves this by:
- **Breaking work into steps**: Each step gets its own 1,000 subrequest quota
- **Automatic retries**: Failed steps retry automatically
- **Unlimited duration**: Can run for hours without timeout
- **Built-in rate limiting**: Use `step.sleep()` between operations
- **No extra cost**: Included in Paid Workers plan

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

### Testing Scheduled Tasks Locally

To test the scheduled cron tasks locally:

1. **Create `.dev.vars` file** in the project root:
```bash
GITHUB_TOKEN=your_github_token_here
```

2. **Start the dev server** with test-scheduled mode:
```bash
wrangler dev --test-scheduled --port 8787
```

3. **Trigger the scheduled event** using curl:
```bash
curl -X POST "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

4. **Monitor logs** in the terminal to verify:
   - Scheduled task starts
   - Trending pages are scraped
   - Repository snapshots are created
   - GitHub API calls succeed (no 401 errors)

**Note**: Database operations will fail locally (expected) since local D1 databases don't persist migrations. The production deployment has the full database schema and will work correctly.

### Testing Workflows Locally

To test the Trending Scraper Workflow:

1. **Start the dev server**:
```bash
wrangler dev --test-scheduled --port 8787
```

2. **Trigger the Workflow** via cron (triggers the Workflow):
```bash
curl -X POST "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

3. **Or trigger the Workflow directly** via API:
```bash
curl -X POST http://localhost:8787/api/trigger-workflow
```

4. **Monitor Workflow execution**:
   - Check terminal logs for Workflow steps
   - Each language/range will be a separate step
   - Observe automatic retries on failures
   - See `step.sleep()` delays between operations

5. **Check Workflow status** (if instance ID is known):
```bash
curl http://localhost:8787/api/workflow-status/<instance-id>
```

**Workflow Benefits Over Workers:**
- ✅ No "Too many API requests" errors
- ✅ Each step has 1,000 subrequest quota
- ✅ Automatic retries on failures
- ✅ Resume from last successful step
- ✅ Built-in observability

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

- **Daily (9:22 AM UTC / 6:22 PM KST)**:
  - **Triggers Trending Scraper Workflow** (runs in background)
  - Scrapes 63 trending pages (daily/weekly/monthly × 21 languages)
  - Processes ~1,500 repositories with GitHub API calls
  - Updates repository snapshots with fresh data
  - Executes as durable Workflow (no API limit issues)
- **Hourly**: Update star counts for active repos (Phase 2)
- **Weekly**: Topic extraction and staleness checks (Phase 3)

### Workflow Architecture

The daily scraping uses Cloudflare Workflows instead of direct Worker execution:
- **63 steps** (one per language/range combination)
- Each step processes ~25 repos = ~75 API calls
- Total execution can run for hours without timeout
- Automatic retries on failures
- Resume from last successful step if interrupted

## License

MIT
