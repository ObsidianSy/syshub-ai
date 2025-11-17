# Agent System - Quick Start Guide

## Prerequisites

1. **Redis** is required for the queue system
2. **Node.js 20+** must be installed
3. **PostgreSQL or MySQL** databases to connect to

## 1. Install Dependencies

```bash
cd backend
npm install
```

## 2. Start Redis

### Option A: Docker (Recommended)
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Option B: Local Installation
```bash
# On macOS
brew install redis
brew services start redis

# On Ubuntu
sudo apt install redis-server
sudo systemctl start redis

# On Windows
# Download from https://github.com/microsoftarchive/redis/releases
```

### Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

## 3. Set Environment Variables

Create `.env` file in `backend/` directory:

```env
# Redis (required)
REDIS_URL=redis://localhost:6379

# Logging (optional)
LOG_LEVEL=info
LOG_DIR=./logs

# Future: OpenAI for embeddings
# OPENAI_API_KEY=sk-...
```

## 4. Build and Start Backend

```bash
# Build TypeScript
npm run build

# Start server
npm run dev

# Or for production
npm start
```

Server will start on `http://localhost:3001`

## 5. Test the API

### Get Auth Token

First, login to get a JWT token:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "password": "your-password"}'
```

Save the `token` from the response.

### Register a System

Replace `YOUR_TOKEN` with your JWT token:

```bash
# PostgreSQL Example
curl -X POST http://localhost:3001/api/agent/systems/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "systemId": "test-postgres",
    "config": {
      "type": "postgres",
      "host": "localhost",
      "port": 5432,
      "database": "test_db",
      "username": "postgres",
      "password": "password",
      "ssl": false
    }
  }'

# MySQL Example
curl -X POST http://localhost:3001/api/agent/systems/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "systemId": "test-mysql",
    "config": {
      "type": "mysql",
      "host": "localhost",
      "port": 3306,
      "database": "test_db",
      "username": "root",
      "password": "password"
    }
  }'
```

### List Systems

```bash
curl http://localhost:3001/api/agent/systems \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Connection

```bash
curl http://localhost:3001/api/agent/systems/test-postgres/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List Tables

```bash
curl http://localhost:3001/api/agent/systems/test-postgres/tables \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Table Schema

```bash
curl http://localhost:3001/api/agent/systems/test-postgres/tables/users/schema \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Trigger Sync Job

```bash
# Full sync
curl -X POST http://localhost:3001/api/agent/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "systemId": "test-postgres",
    "tables": ["users", "orders"]
  }'

# Incremental sync
curl -X POST http://localhost:3001/api/agent/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "systemId": "test-postgres",
    "tables": ["orders"],
    "incremental": true,
    "incrementalColumn": "updated_at"
  }'
```

Save the `jobId` from the response.

### Check Job Status

```bash
curl http://localhost:3001/api/agent/sync/status/YOUR_JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Queue Statistics

```bash
curl http://localhost:3001/api/agent/sync/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Schedule Recurring Sync

```bash
curl -X POST http://localhost:3001/api/agent/sync/schedule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "systemId": "test-postgres",
    "cronPattern": "0 * * * *",
    "tables": ["orders"],
    "incrementalColumn": "updated_at"
  }'
```

Cron patterns:
- `"* * * * *"` - Every minute
- `"0 * * * *"` - Every hour
- `"0 0 * * *"` - Daily at midnight
- `"0 2 * * *"` - Daily at 2 AM
- `"0 0 * * 0"` - Weekly on Sunday

### View Failed Jobs

```bash
curl "http://localhost:3001/api/agent/sync/failed?queue=sync&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Retry Failed Job

```bash
curl -X POST http://localhost:3001/api/agent/sync/retry/YOUR_JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"queue": "sync"}'
```

### Cancel Job

```bash
curl -X DELETE "http://localhost:3001/api/agent/sync/cancel/YOUR_JOB_ID?queue=sync" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 6. Monitor Logs

```bash
# Watch all logs
tail -f backend/logs/combined.log

# Watch agent operations
tail -f backend/logs/agent.log

# Watch sync jobs
tail -f backend/logs/sync.log

# Watch errors only
tail -f backend/logs/error.log
```

## 7. Check Queue Dashboard (Optional)

Install BullMQ Board:

```bash
npm install @bull-board/express @bull-board/api @bull-board/api/bullMQAdapter
```

Add to `server-sqlite.ts`:

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { syncQueue, indexQueue, embeddingQueue } from './services/queue.service.js';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(syncQueue),
    new BullMQAdapter(indexQueue),
    new BullMQAdapter(embeddingQueue),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

Access at: `http://localhost:3001/admin/queues`

## Troubleshooting

### Issue: "Cannot connect to Redis"

**Solution 1**: Start Redis
```bash
docker start redis
# or
redis-server
```

**Solution 2**: Check Redis URL
```bash
# Test connection
redis-cli ping

# Check if it's listening on correct port
redis-cli -p 6379 ping
```

**Solution 3**: Update REDIS_URL in .env
```env
REDIS_URL=redis://localhost:6379
```

### Issue: "System registration failed"

**Possible causes**:
1. Database not accessible (check host, port, firewall)
2. Wrong credentials
3. Database doesn't exist
4. SSL required but not enabled

**Debug steps**:
```bash
# Test PostgreSQL connection
psql -h HOST -p PORT -U USERNAME -d DATABASE

# Test MySQL connection
mysql -h HOST -P PORT -u USERNAME -p DATABASE
```

### Issue: "Sync job failed"

**Check logs**:
```bash
tail -f logs/sync.log
tail -f logs/error.log
```

**Common fixes**:
1. Increase timeout in connector
2. Reduce batch size
3. Check database permissions (SELECT required)
4. Use incremental sync for large tables

### Issue: High memory usage

**Solutions**:
1. Reduce queue concurrency in `queue.service.ts`
2. Process fewer tables at once
3. Use incremental sync
4. Increase available RAM

## Production Deployment (Easypanel/Docker)

### 1. Update docker-compose.yml

Add Redis service:

```yaml
services:
  backend:
    # ... existing config ...
    environment:
      - REDIS_URL=redis://redis:6379
      # ... other env vars ...
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

### 2. Set Environment Variables in Easypanel

Go to your app settings and add:
- `REDIS_URL=redis://redis:6379` (or your Redis connection string)
- `LOG_LEVEL=info`
- `NODE_ENV=production`

### 3. Deploy

```bash
# Commit changes
git add .
git commit -m "Add agent system with Redis"
git push

# Easypanel will auto-deploy
```

### 4. Verify

```bash
# Check if Redis is running
docker ps | grep redis

# Check logs
docker logs syshub-backend

# Test API
curl https://your-domain.com/api/agent/systems \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Performance Tips

1. **Use incremental sync** for large tables:
   ```json
   {
     "incremental": true,
     "incrementalColumn": "updated_at"
   }
   ```

2. **Sync during off-peak hours**:
   ```json
   {
     "cronPattern": "0 2 * * *"  // 2 AM daily
   }
   ```

3. **Limit tables** to only what's needed:
   ```json
   {
     "tables": ["orders", "customers"]
   }
   ```

4. **Use read replicas** for production databases

5. **Monitor queue stats** regularly:
   ```bash
   curl http://localhost:3001/api/agent/sync/stats \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Next Steps

1. ✅ Test basic connectivity
2. ✅ Register first system
3. ✅ Trigger test sync
4. ✅ Monitor logs and queue
5. ⏳ Add vector search (pgvector + OpenAI)
6. ⏳ Build frontend UI
7. ⏳ Set up monitoring/alerts

## Support

- **Logs**: `backend/logs/`
- **Documentation**: `backend/AGENT-SYSTEM-README.md`
- **Implementation**: `backend/IMPLEMENTATION-SUMMARY.md`
- **Queue Dashboard**: `http://localhost:3001/admin/queues` (if installed)

For issues:
1. Check logs first
2. Test connection health endpoint
3. Review queue stats
4. Check Redis connection
