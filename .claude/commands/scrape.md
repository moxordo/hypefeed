---
command: "/scrape"
category: "Analysis & Investigation"
purpose: "AI YouTube channel discovery and database recruitment workflow"
wave-enabled: false
performance-profile: "standard"
parameters:
  - name: "topic"
    type: "string"
    default: "AI pioneer"
    description: "Topic or niche to search for (e.g., 'AI pioneer', 'ML research', 'tech review')"
  - name: "count"
    type: "number"
    default: 50
    description: "Number of channels to find"
  - name: "min_subscribers"
    type: "number"
    default: 100000
    description: "Minimum subscriber count (e.g., 100000 for 100K)"
  - name: "posts_per_month"
    type: "number"
    default: 2
    description: "Minimum posts per month"
  - name: "min_monthly_views"
    type: "number"
    default: 1000000
    description: "Minimum monthly views (e.g., 1000000 for 1M)"
usage: "/scrape [topic] [--count N] [--min-subscribers N] [--posts-per-month N] [--min-monthly-views N]"
examples:
  - "/scrape \"ML research\" --count 25"
  - "/scrape --min-subscribers 500000 --count 30"
  - "/scrape \"tech tutorials\""
---

## Channel Discovery Workflow

**API Base URL**: `https://hypefeed-worker.andy-hypefeed.workers.dev`

### Step 1: Fetch Existing Channels from Database
Before searching, retrieve all existing channels from the database to avoid duplicates:
- **Endpoint**: `GET /api/channels`
- Store the list of existing channel IDs, handles, and names for comparison
- This prevents duplicate scraping

### Step 2: Search for New Channels
Using Web Search, find the top {{count}} {{topic}} YouTube channels that meet these criteria:

**Quality Criteria:**
- More than {{min_subscribers}} subscribers
- Posts regularly ({{posts_per_month}}+ times per month)
- Generates more than {{min_monthly_views}} views per month

### Step 3: Filter & Deduplicate
- Compare found channels against existing database channels
- Filter out duplicates by channel ID, handle, or name
- Keep only genuinely new channels

### Step 4: Extract Channel Information
For each new channel, gather:
- **name**: Channel display name
- **handle**: Channel handle (e.g., @channelname)
- **channel_id**: YouTube channel ID (from channel URL)
- **youtube_url**: Full YouTube channel URL
- **rss_feed_url**: YouTube RSS feed URL (format: `https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}`)
- **subscribers**: Subscriber count as string (e.g., "1.2M", "500K")
- **description**: Brief channel description
- **posting_frequency**: Posting frequency as string (e.g., "2-3 times/week")
- **category**: Channel category (e.g., "research_analysis", "education_tutorials", "tools_practical")

### Step 5: Add to Database
Use the Channel API to add new channels:
- **Endpoint**: `POST /api/channels`
- **Status**: All new channels are automatically marked as `PENDING_EVALUATION`
- Present summary to user with count of channels added

## Channel Status Lifecycle

New channels go through these evaluation stages:
- **PENDING_EVALUATION**: Newly discovered, awaiting operator review (default for new channels)
- **CANDIDATE**: Under evaluation, content appears promising
- **TRYOUT**: Being tested in tryout feed stream
- **LIVE**: Approved and included in main RSS feed
- **DUPLICATE**: Duplicate of existing channel
- **DROP**: Not suitable for feed

**Note**: The operator reviews and updates channel status manually via `PUT /api/channels/:channelId/status` endpoint.