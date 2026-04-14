# Analytics & Monitoring - HireSense AI

## Performance Metrics

### Current Build Analysis

| Metric | Value | Status |
|--------|-------|--------|
| First Load JS | 87.3 kB | ✅ Good |
| Shared Chunks | 53.6 kB | ✅ Good |
| Total Routes | 17 | ✅ |
| Static Routes | 9 | ✅ |
| Dynamic Routes | 8 | ✅ |

### Performance Budget

- First Load JS: < 100 kB ✅
- Route JS: < 20 kB per route (most are) ✅
- Shared chunks: < 100 kB ✅

## Recommended Monitoring Setup

### 1. Vercel Analytics (if deploying to Vercel)

Add to `next.config.mjs`:
```javascript
const nextConfig = {
  analyticsId: 'your-analytics-id', // From Vercel dashboard
}
```

### 2. Google Analytics 4

Create `src/lib/analytics/gtag.js`:
```javascript
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

export const pageview = (url) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  })
}
```

### 3. Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

Create `sentry.client.config.js`:
```javascript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### 4. Uptime Monitoring

Recommended services:
- UptimeRobot (free tier)
- Pingdom
- BetterStack

### 5. Server Logging

Current logging system in `src/lib/logging/logger.js` supports:
- Error tracking
- AI call metrics
- Security events
- Database operations

View logs:
```bash
# Development
npm run dev

# Production (pm2)
pm2 logs hiresense-ai
```

## Key Metrics to Track

### User Engagement
- Page views per session
- Time on page
- Bounce rate
- Conversion (apply rate)

### Performance
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to First Byte (TTFB)
- API response times

### Business
- Internships posted
- Applications submitted
- AI match scores
- Verification pass rates

### Security
- Failed auth attempts
- Rate limit triggers
- Suspicious activity
- AI prompt injection attempts

## Dashboard Setup

Create admin metrics endpoint at `/api/admin/metrics`:
- Daily active users
- New internships
- Application volume
- AI usage stats

## Alerts

Configure alerts for:
- Error rate > 1%
- API response time > 2s
- 500 errors > 5/minute
- MongoDB connection failures

## Health Check Endpoint

Already implemented in `src/app/api/health/route.js`:
```
GET /api/health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "ai_service": "ready"
}
```
