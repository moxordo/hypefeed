# HypeGit Deployment Guide

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
- [Bun](https://bun.sh) installed
- GitHub Personal Access Token with `public_repo` scope

## Setup Steps

### 1. Install Dependencies

```bash
cd hypegit
bun install
```

### 2. Create Cloudflare D1 Database

```bash
# Create the database
wrangler d1 create hypegit-repos

# Copy the database_id from output and update wrangler.toml:
# [[d1_databases]]
# binding = "HYPEGIT_DB"
# database_name = "hypegit-repos"
# database_id = "YOUR_DATABASE_ID_HERE"
```

### 3. Create Cloudflare R2 Bucket

```bash
wrangler r2 bucket create hypegit-snapshots
```

### 4. Generate Prisma Client

```bash
bun run db:generate
```

### 5. Run Database Migrations

**Local (for testing):**
```bash
bun run db:migrate:local
```

**Remote (production):**
```bash
bun run db:migrate:remote
```

### 6. Set Environment Variables

```bash
# Set GitHub token
wrangler secret put GITHUB_TOKEN
# When prompted, paste your GitHub Personal Access Token

# Set environment name (optional)
wrangler secret put ENVIRONMENT
# Enter: production
```

### 7. Build the Worker

```bash
bun run build
```

This creates `dist/worker.js` - the bundled worker code.

### 8. Deploy to Cloudflare

```bash
bun run deploy
```

### 9. Verify Deployment

Once deployed, test the endpoints:

```bash
# Health check
curl https://hypegit.YOUR_SUBDOMAIN.workers.dev/health

# Root info
curl https://hypegit.YOUR_SUBDOMAIN.workers.dev/

# API stats
curl https://hypegit.YOUR_SUBDOMAIN.workers.dev/api/stats
```

## CRON Schedule

The worker is configured to run daily at 2 AM UTC:

```toml
[triggers]
crons = ["0 2 * * *"]
```

This will automatically scrape all trending variants (18 pages total):
- 3 time ranges: daily, weekly, monthly
- 6 languages: typescript, python, go, rust, javascript, all

## Manual Trigger (for testing)

To manually trigger the scrape without waiting for CRON:

```bash
# Trigger scheduled event locally
wrangler dev --test-scheduled

# Or deploy a test endpoint and call it
```

## Monitoring

### Check Logs

```bash
wrangler tail
```

### View Database

```bash
# Query D1 database
wrangler d1 execute hypegit-repos --command "SELECT COUNT(*) FROM Repository"

# Interactive SQL
wrangler d1 execute hypegit-repos --command "SELECT * FROM Repository LIMIT 10"
```

### View R2 Storage

```bash
# List R2 objects
wrangler r2 object list hypegit-snapshots --prefix trending/
```

## API Endpoints

### Health & Info
- `GET /` - Root info
- `GET /health` - Health check with stats

### Repositories
- `GET /api/repos?limit=50&active_only=true` - List repos
- `GET /api/repos/:owner/:name` - Repo details
- `GET /api/repos/:owner/:name/trending?limit=30` - Trending history
- `GET /api/repos/:owner/:name/stars?limit=100` - Star snapshots

### Trending
- `GET /api/trending?time_range=daily&language=typescript&limit=50` - Current trending

### Statistics
- `GET /api/stats` - Platform stats

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
bun install
bun run db:generate
bun run build
```

### Database Issues

```bash
# Check migration status
wrangler d1 migrations list hypegit-repos

# Re-run migrations
bun run db:migrate:remote
```

### Rate Limiting

The GitHub API has a rate limit of 5,000 requests/hour (authenticated). The scraper processes ~25 repos per trending page × 18 pages = ~450 repos per day, well within limits.

## Cost Estimates

**Cloudflare Free Tier:**
- Workers: 100,000 requests/day (free)
- D1: 5 GB storage, 5M reads/day (free)
- R2: 10 GB storage, 1M Class A ops/month (free)

**Expected Usage:**
- CRON runs: 1/day
- API requests: Variable (depends on traffic)
- D1 writes: ~450 repos/day
- R2 writes: 18 snapshots/day (~1-2 MB each)

The free tier should be sufficient for initial usage.
