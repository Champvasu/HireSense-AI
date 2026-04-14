# Deployment Guide - HireSense AI

## Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- Environment variables configured

## Environment Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Configure required variables:
- `MONGODB_URI` - Database connection string
- `NEXTAUTH_SECRET` - Random 32+ character string
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `OPENROUTER_API_KEY` - For AI features

## Build & Deploy

### Option 1: Static Export (Recommended for Netlify/Vercel)

```bash
# Update next.config.mjs
# Add: output: 'export'

npm run build
# Output in /dist folder
```

### Option 2: Node.js Server (VPS/Dedicated)

```bash
npm ci --production
npm run build
npm start
# Runs on port 3000 by default
```

### Option 3: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Platform-Specific Instructions

### Vercel
1. Connect GitHub repo
2. Set environment variables in dashboard
3. Deploy automatically on push

### Netlify
1. Build command: `npm run build`
2. Publish directory: `dist` (if static) or `.next` (if SSR)
3. Set env vars in Netlify UI

### AWS/GCP/Azure
1. Build locally or use CI/CD
2. Upload to serverless function or VM
3. Configure reverse proxy (nginx)

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is strong (32+ chars)
- [ ] `NODE_ENV=production` in production
- [ ] MongoDB uses authentication
- [ ] HTTPS enabled
- [ ] Rate limiting active
- [ ] Security headers applied

## Monitoring

See `ANALYTICS.md` for monitoring setup.

## Troubleshooting

**Build fails**: Check `next.config.mjs` has proper ESM settings
**MongoDB errors**: Verify `MONGODB_URI` format
**AI features not working**: Check `OPENROUTER_API_KEY`
