# HypeGit Language Coverage

## Current Status

**Last Updated:** 2025-10-07
**Total Repositories:** 325
**Total Star Snapshots:** 446
**Total Trending Captures:** 446

## Tracked Languages

### Priority 1: Top Developer Languages ✅
- [x] TypeScript
- [x] Python
- [x] JavaScript
- [x] Go
- [x] Rust

### Priority 2: Major Languages ✅
- [x] Java
- [x] C++
- [x] C#
- [x] C
- [x] Kotlin
- [x] Swift
- [x] Ruby
- [x] PHP

### Priority 3: Additional Languages ✅
- [x] Dart
- [x] Elixir
- [x] Scala
- [x] Zig
- [x] HTML
- [x] CSS
- [x] Shell

### Special Category ✅
- [x] All Languages (no filter)

## Scraping Schedule

**CRON Schedule:** Daily at 5:00 AM UTC (2:00 PM KST)

**Pages Scraped per Run:** 63 total
- 21 languages × 3 time ranges (daily, weekly, monthly)

## Manual Scraping

To manually scrape a specific language:

```bash
curl -X POST "https://hypegit.andrew-kim0810.workers.dev/api/refresh-sync?language=<LANG>&range=daily"
```

Examples:
```bash
# Scrape TypeScript daily trending
curl -X POST "https://hypegit.andrew-kim0810.workers.dev/api/refresh-sync?language=typescript&range=daily"

# Scrape C# daily trending (note: c%23 is URL-encoded C#)
curl -X POST "https://hypegit.andrew-kim0810.workers.dev/api/refresh-sync?language=c%23&range=daily"

# Scrape all languages daily trending
curl -X POST "https://hypegit.andrew-kim0810.workers.dev/api/refresh-sync?language=all&range=daily"
```

## Batch Scraping

To scrape all languages at once:

```bash
./scripts/scrape-all-languages.sh
```

This script will:
1. Scrape all Priority 2 languages (8 languages)
2. Scrape all Priority 3 languages (7 languages)
3. Scrape the "All Languages" category
4. Display progress and results

**Estimated time:** ~5-8 minutes (depending on repo counts and API response times)

## Notes

- Each scrape processes 15-25 repositories per language/range combination
- GitHub API rate limit: 5,000 requests/hour (authenticated)
- Daily CRON scrape uses ~500-750 GitHub API calls
- R2 storage: HTML snapshots stored at `trending/{date}/{range}-{language}.html`
- Database: Prisma + Cloudflare D1 (SQLite)
