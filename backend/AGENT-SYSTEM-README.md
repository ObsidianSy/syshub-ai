# SysHub AI - Agent System

## Overview

The Agent System is a comprehensive data synchronization and indexing framework that connects to multiple database systems, extracts data, normalizes it, and prepares it for semantic search and RAG (Retrieval-Augmented Generation) operations.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Agent System                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐   ┌──────────────┐  │
│  │  Connectors  │───▶│    Agent     │──▶│  Normalizer  │  │
│  │              │    │   Service    │   │   Service    │  │
│  │ - PostgreSQL │    │              │   │              │  │
│  │ - MySQL      │    │  Orchestrates│   │  Transforms  │  │
│  │ - MSSQL*     │    │  sync jobs   │   │  to standard │  │
│  │ - MongoDB*   │    │              │   │    format    │  │
│  └──────────────┘    └──────────────┘   └──────────────┘  │
│         │                    │                   │          │
│         └────────────────────┼───────────────────┘          │
│                              ▼                               │
│                     ┌──────────────┐                        │
│                     │ Queue Service│                        │
│                     │              │                        │
│                     │   BullMQ     │                        │
│                     │   + Redis    │                        │
│                     └──────────────┘                        │
│                              │                               │
│                              ▼                               │
│                     ┌──────────────┐                        │
│                     │Vector DB*    │                        │
│                     │              │                        │
│                     │  pgvector    │                        │
│                     │  embeddings  │                        │
│                     └──────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   REST API       │
                    │                  │
                    │  Agent Routes    │
                    └──────────────────┘

* = Planned, not yet implemented
```

## Components

### 1. Connectors (`backend/src/connectors/`)

Database connectors implement the `IConnector` interface and provide:

- **Connection Management**: Connect, disconnect, test connection
- **Schema Introspection**: List tables, get table schemas with columns, PKs, FKs, indexes
- **Data Fetching**: Fetch rows with filtering, pagination, incremental sync
- **Query Execution**: Execute custom SQL queries

#### Implemented Connectors:
- ✅ **PostgreSQL** (`PostgreSQLConnector.ts`) - Full support with pg.Pool
- ✅ **MySQL** (`MySQLConnector.ts`) - Full support with mysql2/promise
- ⏳ **MSSQL** - Planned
- ⏳ **MongoDB** - Planned
- ⏳ **REST API** - Planned

#### Base Classes:
- `BaseConnector.ts` - Abstract base with common functionality
- `types.ts` - Interface definitions and types
- `index.ts` - ConnectorFactory for creating connectors

### 2. Agent Service (`backend/src/services/agent.service.ts`)

The orchestrator for all agent operations:

- **System Registration**: Connect to databases and test connections
- **Sync Jobs**: Fetch data from tables and normalize
- **Table Operations**: List tables, get schemas, fetch rows
- **Query Execution**: Execute custom queries on connected systems

Key Methods:
```typescript
registerSystem(systemId, config)     // Register new system
unregisterSystem(systemId)           // Disconnect system
syncSystem(systemId, config)         // Sync all or specific tables
syncTable(systemId, tableName)       // Sync single table
normalizeData(systemId, table, rows) // Normalize raw data
```

### 3. Queue Service (`backend/src/services/queue.service.ts`)

Manages background job processing with BullMQ + Redis:

- **Sync Queue**: Database synchronization jobs
- **Index Queue**: Document indexing jobs (planned)
- **Embedding Queue**: Embedding generation jobs (planned)

Features:
- Job retry with exponential backoff
- Job progress tracking
- Dead letter queue for failed jobs
- Rate limiting
- Cron-based scheduling

Key Methods:
```typescript
addSyncJob(systemId, options)         // Queue sync job
scheduleSyncJob(systemId, cron)       // Schedule recurring sync
getJobStatus(jobId, queueName)        // Get job status
retryJob(jobId, queueName)            // Retry failed job
cancelJob(jobId, queueName)           // Cancel job
getQueueStats(queueName)              // Get queue statistics
```

### 4. Normalizer Service (`backend/src/services/normalizer.service.ts`)

Transforms raw database rows into standardized documents:

- **Entity Detection**: Auto-detect entity types (user, product, order, etc.)
- **Field Mapping**: Custom mappings per system/table
- **Searchable Text**: Extract and combine text fields
- **Tag Generation**: Auto-generate tags from metadata

Features:
- Smart field detection (title, description, timestamps)
- Sensitive field exclusion (passwords, tokens)
- Configurable text length limits
- System-specific mappings

Output Format:
```typescript
interface NormalizedDocument {
  id: string;               // system:table:primaryKey
  systemId: string;
  tableName: string;
  entityType: string;       // user, product, order, etc.
  title: string;
  description?: string;
  searchableText: string;   // Combined text for search
  metadata: Record<string, any>;
  tags?: string[];
  timestamp?: Date;
  author?: string;
}
```

### 5. Logger Service (`backend/src/services/logger.service.ts`)

Structured logging with Winston:

- **Multiple Transports**: Console (dev), file (production)
- **Log Rotation**: Daily rotation, size limits
- **Specialized Loggers**: API, sync, agent, database
- **Structured Data**: JSON format with metadata

Specialized Logging Functions:
```typescript
logSyncOperation(operation, systemId, details)
logConnection(operation, systemId, success, details)
logApiRequest(method, path, statusCode, duration, userId)
logDatabaseQuery(operation, table, duration, rowCount, error)
logNormalizer(operation, systemId, tableName, count, details)
logQueue(operation, queueName, jobId, details)
```

### 6. REST API (`backend/src/routes/agent-management.routes.ts`)

Comprehensive REST API for agent management:

#### System Management
- `POST /api/agent/systems/register` - Register new system connection
- `DELETE /api/agent/systems/:systemId` - Unregister system
- `GET /api/agent/systems` - List all registered systems
- `GET /api/agent/systems/:systemId/health` - Test connection health

#### Schema Introspection
- `GET /api/agent/systems/:systemId/tables` - List all tables
- `GET /api/agent/systems/:systemId/tables/:tableName/schema` - Get table schema

#### Query Execution
- `POST /api/agent/systems/:systemId/query` - Execute custom query

#### Sync Operations
- `POST /api/agent/sync` - Queue sync job
- `POST /api/agent/sync/schedule` - Schedule recurring sync (cron)
- `GET /api/agent/sync/status/:jobId` - Get job status
- `GET /api/agent/sync/stats` - Get queue statistics
- `POST /api/agent/sync/retry/:jobId` - Retry failed job
- `DELETE /api/agent/sync/cancel/:jobId` - Cancel job
- `GET /api/agent/sync/failed` - List failed jobs

## Setup

### Prerequisites

1. **Redis** - Required for BullMQ queue
   ```bash
   # Docker
   docker run -d -p 6379:6379 redis:7-alpine
   
   # Or install locally
   ```

2. **Node.js 20+** - Required runtime

### Environment Variables

```env
# Redis connection
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info          # error, warn, info, debug
LOG_DIR=./logs

# Optional: OpenAI for embeddings (future)
OPENAI_API_KEY=sk-...
```

### Installation

```bash
cd backend
npm install
npm run build
```

### Running

```bash
# Development
npm run dev

# Production
npm start
```

## Usage Examples

### 1. Register a PostgreSQL System

```bash
POST /api/agent/systems/register
Authorization: Bearer <token>

{
  "systemId": "erp-production",
  "config": {
    "type": "postgres",
    "host": "postgres.example.com",
    "port": 5432,
    "database": "erp_db",
    "username": "readonly_user",
    "password": "secret",
    "ssl": true
  }
}
```

### 2. List Tables

```bash
GET /api/agent/systems/erp-production/tables
Authorization: Bearer <token>
```

Response:
```json
{
  "systemId": "erp-production",
  "tables": ["customers", "orders", "products", "invoices"]
}
```

### 3. Get Table Schema

```bash
GET /api/agent/systems/erp-production/tables/customers/schema
Authorization: Bearer <token>
```

Response:
```json
{
  "systemId": "erp-production",
  "tableName": "customers",
  "schema": {
    "tableName": "customers",
    "columns": [
      {
        "name": "id",
        "type": "integer",
        "nullable": false,
        "isPrimaryKey": true,
        "isForeignKey": false
      },
      {
        "name": "email",
        "type": "character varying",
        "nullable": false,
        "isPrimaryKey": false,
        "isForeignKey": false
      }
    ],
    "primaryKeys": ["id"],
    "indexes": [...]
  }
}
```

### 4. Trigger Sync (One-time)

```bash
POST /api/agent/sync
Authorization: Bearer <token>

{
  "systemId": "erp-production",
  "tables": ["customers", "orders"],
  "incremental": true,
  "incrementalColumn": "updated_at"
}
```

Response:
```json
{
  "success": true,
  "jobId": "12345",
  "systemId": "erp-production",
  "message": "Sync job queued successfully"
}
```

### 5. Check Job Status

```bash
GET /api/agent/sync/status/12345?queue=sync
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "12345",
  "name": "sync-system",
  "data": { "systemId": "erp-production", ... },
  "state": "completed",
  "progress": 100,
  "result": {
    "success": true,
    "processedCount": 1250,
    "duration": 3456
  }
}
```

### 6. Schedule Recurring Sync

```bash
POST /api/agent/sync/schedule
Authorization: Bearer <token>

{
  "systemId": "erp-production",
  "cronPattern": "0 * * * *",  // Every hour
  "tables": ["orders", "invoices"],
  "incrementalColumn": "updated_at"
}
```

### 7. Get Queue Statistics

```bash
GET /api/agent/sync/stats
Authorization: Bearer <token>
```

Response:
```json
{
  "sync": {
    "waiting": 2,
    "active": 1,
    "completed": 45,
    "failed": 3,
    "delayed": 0,
    "total": 51
  },
  "index": { ... },
  "embedding": { ... }
}
```

## Configuration

### Custom Field Mappings

Add custom field mappings for better normalization:

```typescript
import { normalizerService } from './services/normalizer.service.js';

// Add custom mapping
normalizerService.addMapping({
  systemId: 'erp-production',
  tableName: 'customers',
  entityType: 'customer',
  mappings: {
    titleFields: ['company_name', 'full_name'],
    descriptionFields: ['bio', 'notes'],
    searchableFields: ['email', 'phone', 'company_name', 'address'],
    timestampField: 'updated_at',
    authorField: 'created_by',
    statusField: 'status',
    tagsField: 'tags',
  },
});
```

### Load Mappings from Database

```typescript
// Load all mappings from agent_config table
const configRow = await db.get(
  "SELECT config_value FROM agent_config WHERE config_key = 'entity_mappings'"
);

if (configRow) {
  const mappings = JSON.parse(configRow.config_value);
  await normalizerService.loadConfig({ entityMappings: mappings });
}
```

## Monitoring

### Logs

Logs are written to:
- **Console**: Development (colored, human-readable)
- **Files** (Production):
  - `logs/error.log` - Errors only
  - `logs/combined.log` - All logs
  - `logs/agent.log` - Agent operations
  - `logs/sync.log` - Sync jobs

### Queue Dashboard (Optional)

Install BullMQ Board for web UI:

```bash
npm install @bull-board/express
```

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
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

## Roadmap

### ✅ Completed
- [x] Connector architecture (PostgreSQL, MySQL)
- [x] Agent service orchestrator
- [x] Queue system (BullMQ + Redis)
- [x] Normalizer service with entity detection
- [x] Logger service (Winston)
- [x] REST API endpoints
- [x] Job management (retry, cancel, status)

### ⏳ In Progress
- [ ] Vector database integration (pgvector)
- [ ] Embedding generation (OpenAI API)
- [ ] Semantic search

### 📋 Planned
- [ ] MSSQL connector
- [ ] MongoDB connector
- [ ] REST API connector (for APIs without databases)
- [ ] Incremental sync with change tracking
- [ ] Conflict resolution for duplicate data
- [ ] Data quality scoring
- [ ] Frontend UI for system management
- [ ] Audit logging to database
- [ ] Webhook notifications for job completion
- [ ] Rate limiting per system
- [ ] Cost tracking (API calls, storage)
- [ ] Multi-tenancy support

## Troubleshooting

### Connection Issues

**Problem**: "Connection test failed"

**Solutions**:
1. Verify host, port, credentials in config
2. Check firewall/network rules
3. Test connection manually:
   ```bash
   psql -h host -p 5432 -U user -d database
   ```
4. Check SSL requirements

### Sync Job Failures

**Problem**: Jobs stuck in "failed" state

**Solutions**:
1. Check logs: `logs/sync.log`
2. View failed jobs:
   ```bash
   GET /api/agent/sync/failed?queue=sync&limit=10
   ```
3. Retry manually:
   ```bash
   POST /api/agent/sync/retry/JOB_ID
   { "queue": "sync" }
   ```
4. Check system connection health:
   ```bash
   GET /api/agent/systems/SYSTEM_ID/health
   ```

### Redis Connection Issues

**Problem**: "ECONNREFUSED ::1:6379"

**Solutions**:
1. Start Redis: `docker start redis` or `redis-server`
2. Check REDIS_URL env var
3. Verify Redis is listening: `redis-cli ping` (should return PONG)

### Memory Issues

**Problem**: High memory usage during sync

**Solutions**:
1. Reduce batch size in connector fetchRows
2. Process tables sequentially instead of parallel
3. Adjust queue concurrency in `queue.service.ts`
4. Enable incremental sync with `incrementalColumn`

## Performance Tips

1. **Use Incremental Sync**: Only fetch changed rows
   ```json
   {
     "incremental": true,
     "incrementalColumn": "updated_at"
   }
   ```

2. **Limit Tables**: Sync only needed tables
   ```json
   {
     "tables": ["orders", "customers"]
   }
   ```

3. **Schedule During Off-Peak**: Use cron for overnight syncs
   ```json
   {
     "cronPattern": "0 2 * * *"  // 2 AM daily
   }
   ```

4. **Monitor Queue Stats**: Watch for bottlenecks
   ```bash
   GET /api/agent/sync/stats
   ```

5. **Use Read Replicas**: Connect to read replicas for production DBs

## Security

1. **Encrypted Credentials**: Store in environment variables or secrets manager
2. **Read-Only Access**: Use read-only database users
3. **Network Isolation**: Use VPCs, firewalls, SSH tunnels
4. **Audit Logging**: All operations logged with user ID
5. **Rate Limiting**: Prevent abuse of API endpoints
6. **JWT Authentication**: All endpoints require valid token

## Support

For issues or questions:
1. Check logs: `logs/combined.log`, `logs/agent.log`
2. Review queue stats: `GET /api/agent/sync/stats`
3. Test connections: `GET /api/agent/systems/:id/health`
4. Contact: support@syshub.ai
