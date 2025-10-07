# HypeGit Implementation Plan

## Project Overview

Developer hype & mindshare tracker using GitHub trending data. Tracks repository star growth, detects surges, and visualizes the tech landscape.

---

## Phase 1: Core Infrastructure & Data Collection ✅

**Goal**: Setup database, GitHub trending scraper, and R2 storage

### Tasks

- [x] 1.1: Project initialization
  - [x] Create directory structure
  - [x] Setup package.json with Bun
  - [x] Configure TypeScript
  - [x] Create .gitignore and README

- [x] 1.2: Database schema & migrations
  - [x] Create Prisma schema
  - [x] Generate initial migration
  - [x] Create seed data
  - [x] Write seed.sql for D1

- [ ] 1.3: Cloudflare infrastructure
  - [ ] Create D1 database
  - [ ] Create R2 bucket
  - [ ] Configure wrangler.toml with database_id
  - [ ] Set GitHub token secret

- [x] 1.4: Type definitions
  - [x] Create bindings.ts with Env types
  - [x] Define Repository, TrendingRepo interfaces

- [x] 1.5: Core services
  - [x] Implement GitHubAPIService
  - [x] Implement TrendingScraperService
  - [x] Implement StorageService (R2)
  - [x] Implement RepositoryService (database CRUD)

- [x] 1.6: Daily cron handler
  - [x] Implement trending scraper logic
  - [x] Loop through 18 variants (3 ranges × 6 languages)
  - [x] Store HTML to R2
  - [x] Parse and upsert repos
  - [x] Create TrendingCapture + StarSnapshot

- [x] 1.7: Main worker entry
  - [x] Setup Hono app
  - [x] Add health endpoint
  - [x] Add API endpoints
  - [x] Wire up cron trigger
  - [x] Add error handling

- [ ] 1.8: Testing & deployment
  - [ ] Build worker
  - [ ] Test locally with wrangler dev
  - [ ] Deploy to production
  - [ ] Verify cron execution

**Expected Outcome**:
- ✅ Working database with schema
- ✅ Daily trending scraper collecting 200-300 repos/day
- ✅ R2 snapshots preserving HTML
- ✅ Foundation for Phase 2

---

## Phase 2: Star Tracking & Surge Detection 📅

**Goal**: Continuous monitoring and surge identification

### Tasks

- [ ] 2.1: Repository tracker service
  - [ ] Hourly star count updates
  - [ ] Priority queue for active repos
  - [ ] Batch GitHub API requests

- [ ] 2.2: Surge detection service
  - [ ] Implement detectSurge(repoId, window)
  - [ ] Calculate growth metrics
  - [ ] Compare to baseline
  - [ ] Generate confidence scores

- [ ] 2.3: Staleness checker
  - [ ] Detect zero growth (90 days)
  - [ ] Check last commit (180 days)
  - [ ] Mark inactive repos

- [ ] 2.4: Hourly cron job
  - [ ] Update star counts
  - [ ] Run staleness checks weekly

- [ ] 2.5: REST API endpoints
  - [ ] GET /api/repos
  - [ ] GET /api/repos/:owner/:name
  - [ ] GET /api/repos/:owner/:name/surge
  - [ ] GET /api/surges
  - [ ] GET /api/trending

- [ ] 2.6: Testing & optimization
  - [ ] Test surge detection accuracy
  - [ ] Optimize D1 queries
  - [ ] Monitor API response times

**Expected Outcome**:
- ✅ Hourly star tracking
- ✅ Surge detection working
- ✅ REST API operational
- ✅ 1,000+ repositories tracked

---

## Phase 3: Visualization & Advanced Features 📅

**Goal**: Dashboard, analytics, topic extraction

### Tasks

- [ ] 3.1: Topic extraction
  - [ ] Extract from GitHub API
  - [ ] Parse description keywords
  - [ ] Build topic relationships

- [ ] 3.2: Advanced analytics
  - [ ] Trending history queries
  - [ ] Topic-level trends
  - [ ] Growth velocity rankings

- [ ] 3.3: Frontend (Cloudflare Pages)
  - [ ] Initialize Next.js app
  - [ ] Setup routing
  - [ ] Deploy to Pages

- [ ] 3.4: Dashboard components
  - [ ] Home: Surges + trending
  - [ ] Repo detail page
  - [ ] Trending page with filters
  - [ ] Topics page

- [ ] 3.5: Visualizations
  - [ ] Star growth charts
  - [ ] Surge timeline
  - [ ] Topic heatmap
  - [ ] Tech radar

- [ ] 3.6: Advanced API
  - [ ] Topic endpoints
  - [ ] Search functionality
  - [ ] Statistics

**Expected Outcome**:
- ✅ Full dashboard
- ✅ Interactive visualizations
- ✅ Topic navigation
- ✅ 5,000+ repositories tracked

---

## Technical Decisions

### Stack
- **Backend**: Cloudflare Workers (TypeScript + Bun)
- **Database**: Cloudflare D1 (SQLite) + Prisma ORM
- **Storage**: Cloudflare R2 for HTML snapshots
- **Framework**: Hono.js
- **Frontend**: Next.js on Cloudflare Pages

### Rate Limits
- GitHub API: 5,000 req/hour (authenticated)
- Daily trending: ~450 API calls
- Hourly updates: ~500 API calls
- Total: ~12,000-15,000/day (within limits)

### Data Retention
- StarSnapshots: Forever (cheap storage)
- R2 Snapshots: 90 days, then archive
- Inactive repos: Mark but don't delete

---

## Success Metrics

### Phase 1 (Week 1)
- [ ] 100+ repositories seeded
- [ ] Daily scraper running reliably
- [ ] R2 snapshots created

### Phase 2 (Week 2)
- [ ] 1,000+ repositories tracked
- [ ] 5-10 surges detected daily
- [ ] API < 200ms response time

### Phase 3 (Weeks 3-4)
- [ ] 5,000+ repositories tracked
- [ ] Dashboard deployed
- [ ] 100+ topics extracted

---

## Current Status

**Phase**: 1 - Core Infrastructure (Code Complete)
**Progress**: 95% (Ready for deployment)
**Next**: Deploy Cloudflare infrastructure and test
