# HypeFeed Architecture Documentation

## System Overview

HypeFeed is a distributed system for aggregating and serving AI-focused YouTube channel RSS feeds, built on Cloudflare's edge infrastructure.

## Core Components

### 1. RSS Aggregation Layer (`hypefeed-worker`)

#### Architecture Pattern
- **Single Worker Pattern**: One Cloudflare Worker handles both HTTP requests and scheduled tasks
- **Event-Driven**: Dual handler exports for `fetch` (HTTP) and `scheduled` (cron)

#### Data Flow
```
YouTube RSS Feeds → Aggregator Service → XML Renderer → R2 Storage → CDN Edge
                         ↓                     ↓             ↓
                    Parse & Merge         Rich Metadata   Versioning
```

#### Services Architecture
```
src/
├── services/
│   ├── aggregator.ts  # Parallel feed fetching with retry logic
│   ├── renderer.ts    # XML generation with rich HTML descriptions
│   └── storage.ts     # R2 persistence & KV caching layer
```

### 2. Storage Architecture

#### Multi-Tier Storage Strategy
1. **KV Cache** (Layer 1)
   - TTL: 5 minutes
   - Purpose: Ultra-fast edge delivery
   - Key: `current_feed_xml`

2. **R2 Object Storage** (Layer 2)
   - Current feed: `feeds/current.xml`
   - Versioned feeds: `feeds/{timestamp}.xml`
   - Metadata: `meta/last-update.json`
   - Retention: 100 versions

3. **Request Flow**
```
Request → KV Cache (hit) → Return
          ↓ (miss)
          R2 Storage → Update KV → Return
```

### 3. Cron Aggregation Pipeline

#### Execution Flow (Every 10 minutes)
```
Trigger → Fetch Channels → Parse RSS → Merge Items → Generate XML → Store
            ↓                 ↓           ↓              ↓            ↓
         Parallel         XML Parser   Sort by Date   Rich HTML    R2 + KV
         Batch=5          Validation   Deduplication  Thumbnails   Version
```

#### Error Handling
- **Retry Strategy**: 3 attempts with exponential backoff
- **Partial Failures**: Continue with available feeds
- **Error Reporting**: Logged but don't break aggregation

### 4. HTTP API Layer (Hono Framework)

#### Route Architecture
```
/ (root)
├── /feed.xml                 # Current RSS feed
├── /feed/{timestamp}.xml     # Historical versions
├── /feed/versions            # List all versions
├── /feed/stats              # Aggregation statistics
├── /channels                # Channel management
├── /channels/{id}           # Channel details
├── /health                  # Service health
└── /refresh                 # Manual trigger
```

#### Middleware Stack
1. **CORS**: Open access for RSS readers
2. **Cache Headers**: 5-minute public cache
3. **ETag**: Conditional requests support
4. **Security Headers**: XSS, frame protection

## Data Models

### Channel Configuration
```typescript
interface Channel {
  name: string;
  channel_id: string;
  rss_feed_url: string;
  status: 'LIVE' | 'TRYOUT' | 'CANDIDATE';
  category: string;
  subscribers: string;
}
```

### Feed Item Structure
```typescript
interface FeedItem {
  guid: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  channelName: string;
  thumbnailUrl?: string;
  category: string;
}
```

## Performance Optimizations

### Parallel Processing
- Batch size: 5 channels concurrent
- Timeout: 10 seconds per feed
- Total aggregation: < 30 seconds

### Caching Strategy
- **Edge Cache**: 5 minutes via CDN
- **KV Cache**: 5 minutes for feed content
- **Browser Cache**: 5 minutes public

### Resource Efficiency
- **Bundle Size**: ~217KB compressed
- **Memory Usage**: < 128MB per invocation
- **CPU Time**: < 10ms median response

## Scalability Considerations

### Horizontal Scaling
- **Automatic**: Cloudflare Workers scale to millions of requests
- **Global Distribution**: 200+ edge locations
- **Zero Cold Starts**: Always warm at edge

### Storage Scaling
- **R2 Capacity**: Unlimited object storage
- **KV Operations**: 1000 reads/second per key
- **Versioning**: Auto-cleanup after 100 versions

## Security Architecture

### Input Validation
- RSS URL validation
- XML parsing with size limits
- HTML sanitization in descriptions

### Access Control
- Read-only public feeds
- No authentication required for RSS
- Admin endpoints could add auth

### Data Protection
- No PII storage
- Public YouTube data only
- HTTPS everywhere

## Monitoring & Observability

### Health Checks
```
GET /health
{
  "status": "healthy",
  "storage": {
    "currentFeedExists": true,
    "versionCount": 42
  },
  "channels": {
    "active": 7,
    "total": 10
  }
}
```

### Metrics Tracked
- Feed aggregation success rate
- Channel fetch failures
- Storage usage
- Response times

## Deployment Architecture

### CI/CD Pipeline
```
Code Push → GitHub → Wrangler Build → Deploy to Edge
              ↓           ↓              ↓
           Validate    TypeScript    Global Distribution
```

### Environment Strategy
- **Development**: Local with Miniflare
- **Preview**: Deployment previews
- **Production**: Main branch auto-deploy

## Future Architecture Considerations

### Potential Enhancements
1. **GraphQL API**: For flexible queries
2. **WebSocket**: Real-time feed updates
3. **Analytics**: Durable Objects for metrics
4. **Personalization**: User-specific feeds

### Scaling Strategies
1. **Sharding**: Split channels across workers
2. **Queue**: Queued aggregation with SQS
3. **Database**: D1 for structured metadata
4. **CDN**: Custom domain with caching rules

## Technology Stack Rationale

### Why Cloudflare Workers?
- **Global edge deployment**
- **Zero cold starts**
- **Integrated storage (R2, KV)**
- **Cost-effective at scale**

### Why Hono?
- **Lightweight** (< 20KB)
- **Fast routing**
- **TypeScript native**
- **Middleware ecosystem**

### Why Bun?
- **Fast package management**
- **Native TypeScript execution**
- **Quick build times**
- **Modern toolchain**

## Operational Runbook

### Common Issues & Solutions

#### Feed Fetch Failures
- **Symptom**: Missing channel updates
- **Check**: `/health` endpoint
- **Solution**: Manual `/refresh` or wait for next cron

#### Storage Errors
- **Symptom**: 503 on `/feed.xml`
- **Check**: R2 bucket permissions
- **Solution**: Verify wrangler.toml bindings

#### High Latency
- **Symptom**: Slow feed loading
- **Check**: KV cache hit rate
- **Solution**: Increase cache TTL

---

This architecture provides a robust, scalable foundation for RSS aggregation with room for growth while maintaining simplicity and performance.