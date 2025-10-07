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

# Set API key for admin endpoints (REQUIRED)
wrangler secret put ADMIN_API_KEY
# When prompted, paste a strong random key (32+ characters)
# Example: openssl rand -base64 32

# Set environment name (optional)
wrangler secret put ENVIRONMENT
# Enter: production
```

**Generating a secure API key:**
```bash
# macOS/Linux
openssl rand -base64 32

# Or use a password generator
# Example: xK9mP2vL8nQ5wR7tY3zA4bN6cH1dF0eG
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

### Public Endpoints (No Authentication Required)

**Health & Info:**
- `GET /` - Root info
- `GET /health` - Health check with stats

**Repositories:**
- `GET /api/repos?limit=50&active_only=true` - List repos
- `GET /api/repos/:owner/:name` - Repo details
- `GET /api/repos/:owner/:name/trending?limit=30` - Trending history
- `GET /api/repos/:owner/:name/stars?limit=100` - Star snapshots

**Trending:**
- `GET /api/trending?time_range=daily&language=typescript&limit=50` - Current trending

**Statistics:**
- `GET /api/stats` - Platform stats

### Protected Endpoints (Authentication Required)

**Manual Scraping:**
- `POST /api/refresh` - Trigger background scrape
- `POST /api/refresh-sync?language=go&range=daily` - Synchronous scrape

**Testing:**
- `GET /api/test-scrape` - Test scraping (debug endpoint)

**Authentication:**
All protected endpoints require a Bearer token in the Authorization header. You can use either:
1. **Database API Keys** - Managed keys stored in the database (recommended)
2. **ADMIN_API_KEY** - Legacy super admin key from environment secrets

```bash
curl -X POST "https://hypegit.andrew-kim0810.workers.dev/api/refresh" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE"
```

**Example authenticated requests:**

```bash
# Trigger manual refresh (background)
curl -X POST "https://hypegit.andrew-kim0810.workers.dev/api/refresh" \
  -H "Authorization: Bearer xK9mP2vL8nQ5wR7tY3zA4bN6cH1dF0eG"

# Trigger synchronous scrape for specific language
curl -X POST "https://hypegit.andrew-kim0810.workers.dev/api/refresh-sync?language=rust&range=daily" \
  -H "Authorization: Bearer xK9mP2vL8nQ5wR7tY3zA4bN6cH1dF0eG"

# Test scraping
curl "https://hypegit.andrew-kim0810.workers.dev/api/test-scrape" \
  -H "Authorization: Bearer xK9mP2vL8nQ5wR7tY3zA4bN6cH1dF0eG"
```

**Authentication errors:**

Missing token:
```json
{
  "error": "Unauthorized",
  "message": "Missing Authorization header",
  "hint": "Include: Authorization: Bearer YOUR_API_KEY"
}
```

Invalid token:
```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

### Admin Endpoints (Super Admin Only)

**API Key Management:**
These endpoints require the ADMIN_API_KEY (not regular database keys):

- `POST /admin/keys` - Create a new API key
- `GET /admin/keys` - List all API keys
- `DELETE /admin/keys/:id` - Deactivate an API key
- `POST /admin/keys/:id/reactivate` - Reactivate an API key
- `DELETE /admin/keys/:id/permanent` - Permanently delete an API key

**Creating an API key:**

```bash
curl -X POST "https://hypegit.andrew-kim0810.workers.dev/admin/keys" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CI/CD Pipeline",
    "description": "Key for automated deployments",
    "created_by": "admin@example.com"
  }'
```

Response:
```json
{
  "success": true,
  "message": "API key created successfully. Save this key - it will not be shown again!",
  "key": "rT9kL2mN8pQ5vR7sY3wA4bX6cH1dE0fG...",
  "info": {
    "id": "uuid-here",
    "name": "CI/CD Pipeline",
    "description": "Key for automated deployments",
    "created_at": "2025-10-07T15:30:00.000Z",
    "last_used": null,
    "is_active": true,
    "created_by": "admin@example.com"
  }
}
```

**Listing API keys:**

```bash
# List active keys only
curl "https://hypegit.andrew-kim0810.workers.dev/admin/keys" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"

# Include inactive keys
curl "https://hypegit.andrew-kim0810.workers.dev/admin/keys?include_inactive=true" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

**Deactivating a key:**

```bash
curl -X DELETE "https://hypegit.andrew-kim0810.workers.dev/admin/keys/uuid-here" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

**Permanently deleting a key:**

```bash
curl -X DELETE "https://hypegit.andrew-kim0810.workers.dev/admin/keys/uuid-here/permanent" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

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
