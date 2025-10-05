---
command: "/evaluate"
category: "Analysis & Validation"
purpose: "Validate and evaluate PENDING_EVALUATION channels for quality and technical requirements"
wave-enabled: false
performance-profile: "standard"
parameters:
  - name: "channel_id"
    type: "string"
    required: false
    description: "Specific channel ID to evaluate (if not provided, evaluates all PENDING_EVALUATION channels)"
  - name: "batch_size"
    type: "number"
    default: 5
    description: "Number of channels to evaluate in one batch"
usage: "/evaluate [channel_id] [--batch-size N]"
examples:
  - "/evaluate"
  - "/evaluate UCYO_jab_esuFRV4b17AJtAw"
  - "/evaluate --batch-size 3"
---

## Channel Evaluation Workflow

**API Base URL**: `https://hypefeed-worker.andrew-kim0810.workers.dev`

### Step 1: Fetch Channels for Evaluation
Retrieve channels that need evaluation from the database:
- If no `channel_id` parameter: Fetch all PENDING_EVALUATION channels via API
- If `channel_id` provided: Fetch that specific channel
- Process channels in batches based on `batch_size` parameter (default: 5)

**Endpoint**: `GET /api/channels?status=PENDING_EVALUATION` or `GET /api/channels/{channel_id}`

### Step 2: RSS Feed Validation
For each channel, verify the RSS feed is working:

**Test RSS Feed:**
1. Fetch the channel's `rss_feed_url` using WebFetch or curl
2. Verify RSS returns HTTP 200 and contains valid XML
3. Parse XML to check for video entries
4. Verify at least 1 video published in last 30 days

**If RSS Feed Fails:**
1. Try regenerating RSS URL using `mcp__youtube-rss__generate_rss_feed` tool with channel's YouTube URL
2. Test the newly generated RSS feed
3. If valid, update channel record with new `rss_feed_url` via `PATCH /api/channels/{channelId}`
4. If still failing, mark for manual review

**RSS Validation Criteria:**
-  HTTP 200 status
-  Valid XML structure
-  At least 1 video entry
-  Recent activity (videos within 30 days)

### Step 3: Monthly Views Estimation
Estimate monthly views based on recent video activity:

**Analysis Method:**
1. Parse RSS feed to extract recent video titles and publish dates
2. Count videos published in last 30 days
3. Search for view count estimates using Web Search with video titles
4. Calculate approximate monthly views:
   - Videos in last 30 days × average views per video (from search)
   - OR use subscriber count and posting frequency as proxy estimate

**Monthly Views Criteria:**
-  **HIGH**: >= 1M views/month
-   **MEDIUM**: 500K - 1M views/month
- L **LOW**: < 500K views/month

### Step 4: Evaluation Scoring
Calculate score based on validation results:

**Scoring System:**
```
RSS Feed Valid:           +40 points
Recent Activity:          +30 points (videos in last 30 days)
Monthly Views >= 1M:      +30 points
Monthly Views 500K-1M:    +15 points
Monthly Views < 500K:      +0 points
RSS Invalid:               +0 points
No Recent Activity:        +0 points
```

**Score-Based Recommendations:**
- **90-100 points** ’ `CANDIDATE` (High quality, ready for tryout)
- **70-89 points** ’ `TRYOUT` (Promising, monitor performance)
- **40-69 points** ’ Keep `PENDING_EVALUATION` (Manual review needed)
- **0-39 points** ’ `DROP` (Does not meet criteria)

### Step 5: Present Evaluation Results
For each evaluated channel, display:

```markdown
### Channel: {name} (@{handle})
- **Score**: {score}/100
- **RSS Feed**: { Valid | L Invalid | =' Fixed}
- **Recent Activity**: { Active ({X} videos/30d) | L Inactive}
- **Monthly Views**: ~{estimate} ({ High |   Medium | L Low})
- **Recommendation**: {CANDIDATE | TRYOUT | PENDING_EVALUATION | DROP}
- **Action Required**: {Update RSS | Change Status | Manual Review}
```

### Step 6: Update Channel Records
After presenting results, ask for confirmation to:

**RSS Feed Updates:**
- If RSS was fixed, update via `PATCH /api/channels/{channelId}` with new `rss_feed_url`

**Status Updates:**
- Update channel status via `PUT /api/channels/{channelId}/status` based on recommendation
- Batch update supported channels with same recommendation

### Step 7: Generate Summary Report
After evaluation batch completes:

```
=Ê Evaluation Summary
=====================
Total Evaluated: X channels

Recommendations:
 CANDIDATE:   X channels (90-100 pts) - Ready for feed
   TRYOUT:      X channels (70-89 pts) - Test in tryout stream
=Ë PENDING:      X channels (40-69 pts) - Manual review needed
L DROP:         X channels (0-39 pts) - Does not meet criteria

Actions Taken:
=' Fixed RSS:    X channels
=Ý Updated:      X channel statuses

Next Steps:
- Review channels marked for manual review
- Monitor TRYOUT channels for performance
- Add CANDIDATE channels to feed
```

## Error Handling

**RSS Feed Errors:**
- Retry once if fetch fails
- Try MCP RSS generator if retry fails
- Mark for manual review if all attempts fail

**API Errors:**
- Retry API calls once on failure
- Continue evaluation even if individual channels fail
- Log errors for operator review

**Data Quality:**
- Skip channels with missing required fields
- Report data issues in evaluation notes
- Suggest data cleanup for malformed records

## Tool Usage

**Required Tools:**
- `WebFetch` or `Bash(curl)` - Test RSS feeds
- `mcp__youtube-rss__generate_rss_feed` - Fix broken RSS feeds
- `WebSearch` - Estimate monthly views from video data
- API calls (`GET/PATCH/PUT`) - Fetch and update channel data

**Process Flow:**
1. Fetch pending channels ’ 2. Validate RSS ’ 3. Estimate views ’ 4. Score channels ’ 5. Update records ’ 6. Generate report
