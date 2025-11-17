import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { agentService } from './agent.service.js';
import { logQueue, syncLogger } from './logger.service.js';

// Define job data types
export interface SyncJobData {
  systemId: string;
  tables?: string[];
  incrementalColumn?: string;
  lastSyncAt?: Date;
}

export interface IndexJobData {
  systemId: string;
  tableName: string;
  documentIds: string[];
}

export interface EmbeddingJobData {
  documentId: string;
  text: string;
  systemId: string;
  tableName: string;
}

export interface JobResult {
  success: boolean;
  processedCount?: number;
  errors?: string[];
  duration?: number;
}

// Redis connection configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Check if Redis is available
let redisAvailable = false;
let connection: Redis | null = null;

try {
  connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: () => null, // Don't retry if fails
  });

  // Test connection
  await connection.connect().catch(() => {
    console.warn('⚠️  Redis not available - queue features disabled');
    connection = null;
  });

  if (connection) {
    redisAvailable = true;
    console.log('✅ Redis connected - queue system active');
  }
} catch (error) {
  console.warn('⚠️  Redis not available - running without queue features');
  connection = null;
}

// Queue options
const defaultQueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 3600, // Keep for 1 hour
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs
      age: 86400, // Keep for 24 hours
    },
  },
};

// Create queues only if Redis is available
export const syncQueue = redisAvailable && connection ? new Queue<SyncJobData>('agent-sync', { ...defaultQueueOptions, connection }) : null;
export const indexQueue = redisAvailable && connection ? new Queue<IndexJobData>('agent-index', { ...defaultQueueOptions, connection }) : null;
export const embeddingQueue = redisAvailable && connection ? new Queue<EmbeddingJobData>('agent-embedding', { ...defaultQueueOptions, connection }) : null;

// Queue events for monitoring
const syncQueueEvents = redisAvailable && connection ? new QueueEvents('agent-sync', { connection }) : null;
const indexQueueEvents = redisAvailable && connection ? new QueueEvents('agent-index', { connection }) : null;
const embeddingQueueEvents = redisAvailable && connection ? new QueueEvents('agent-embedding', { connection }) : null;

// Sync job processor (only if Redis available)
const syncWorker = redisAvailable && connection ? new Worker<SyncJobData, JobResult>(
  'agent-sync',
  async (job: Job<SyncJobData>) => {
    const { systemId, tables, incrementalColumn, lastSyncAt } = job.data;
    const startTime = Date.now();

    syncLogger.info(`Starting sync job for system ${systemId}`, {
      jobId: job.id,
      tables,
      incrementalColumn,
    });

    try {
      // Update job progress
      await job.updateProgress(10);

      // Perform the sync
      const result = await agentService.syncSystem(systemId, {
        tables,
        incrementalColumn,
        lastSyncAt,
      });

      await job.updateProgress(80);

      // Queue indexing jobs for synced data
      // TODO: Implement document ID tracking in syncSystem
      // if (result.rowsProcessed > 0) {
      //   await indexQueue.add(
      //     'index-table',
      //     {
      //       systemId,
      //       tableName: 'all',
      //       documentIds: [],
      //     },
      //     {
      //       priority: 2,
      //     }
      //   );
      // }

      await job.updateProgress(100);

      const duration = Date.now() - startTime;
      console.log(`[SyncWorker] Completed sync for system ${systemId} in ${duration}ms`);

      return {
        success: result.status === 'success',
        processedCount: result.rowsProcessed || 0,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[SyncWorker] Error syncing system ${systemId}:`, error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
        duration,
      };
    }
  },
  {
    connection,
    concurrency: 3, // Process 3 sync jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // per minute
    },
  }
) : null;

// Index job processor (only if Redis available)
const indexWorker = redisAvailable && connection ? new Worker<IndexJobData, JobResult>(
  'agent-index',
  async (job: Job<IndexJobData>) => {
    const { systemId, tableName, documentIds } = job.data;
    const startTime = Date.now();

    console.log(`[IndexWorker] Indexing ${documentIds.length} documents from ${systemId}.${tableName}`);

    try {
      await job.updateProgress(10);

      // TODO: Implement actual indexing logic
      // For now, just simulate indexing
      const batchSize = 100;
      for (let i = 0; i < documentIds.length; i += batchSize) {
        const batch = documentIds.slice(i, i + batchSize);
        
        // TODO: Store in vector DB or search index
        // await vectorStore.indexDocuments(systemId, tableName, batch);
        
        const progress = Math.floor(((i + batch.length) / documentIds.length) * 90) + 10;
        await job.updateProgress(progress);
      }

      await job.updateProgress(100);

      const duration = Date.now() - startTime;
      console.log(`[IndexWorker] Indexed ${documentIds.length} documents in ${duration}ms`);

      return {
        success: true,
        processedCount: documentIds.length,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[IndexWorker] Error indexing:`, error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
        duration,
      };
    }
  },
  {
    connection,
    concurrency: 5, // Process 5 index jobs concurrently
  }
) : null;

// Embedding job processor (only if Redis available)
const embeddingWorker = redisAvailable && connection ? new Worker<EmbeddingJobData, JobResult>(
  'agent-embedding',
  async (job: Job<EmbeddingJobData>) => {
    const { documentId, text, systemId, tableName } = job.data;
    const startTime = Date.now();

    console.log(`[EmbeddingWorker] Generating embedding for document ${documentId}`);

    try {
      await job.updateProgress(20);

      // TODO: Implement actual embedding generation
      // const embedding = await openai.embeddings.create({
      //   model: 'text-embedding-3-small',
      //   input: text,
      // });

      await job.updateProgress(80);

      // TODO: Store embedding in vector DB
      // await vectorStore.storeEmbedding(documentId, embedding.data[0].embedding);

      await job.updateProgress(100);

      const duration = Date.now() - startTime;
      console.log(`[EmbeddingWorker] Generated embedding for ${documentId} in ${duration}ms`);

      return {
        success: true,
        processedCount: 1,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[EmbeddingWorker] Error generating embedding:`, error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
        duration,
      };
    }
  },
  {
    connection,
    concurrency: 10, // Process 10 embedding jobs concurrently
    limiter: {
      max: 100, // Max 100 embeddings
      duration: 60000, // per minute (respects OpenAI rate limits)
    },
  }
) : null;

// Worker event handlers (only if Redis available)
if (syncWorker) {
  syncWorker.on('completed', (job) => {
    logQueue('job-completed', 'agent-sync', job.id || 'unknown', {
      result: job.returnvalue,
    });
    console.log(`[SyncWorker] Job ${job.id} completed`);
  });

  syncWorker.on('failed', (job, err) => {
    logQueue('job-failed', 'agent-sync', job?.id || 'unknown', {
      error: err.message,
      stack: err.stack,
    });
    console.error(`[SyncWorker] Job ${job?.id} failed:`, err.message);
  });
}

if (indexWorker) {
  indexWorker.on('completed', (job) => {
    logQueue('job-completed', 'agent-index', job.id || 'unknown');
    console.log(`[IndexWorker] Job ${job.id} completed`);
  });

  indexWorker.on('failed', (job, err) => {
    logQueue('job-failed', 'agent-index', job?.id || 'unknown', {
      error: err.message,
    });
    console.error(`[IndexWorker] Job ${job?.id} failed:`, err.message);
  });
}

if (embeddingWorker) {
  embeddingWorker.on('completed', (job) => {
    logQueue('job-completed', 'agent-embedding', job.id || 'unknown');
    console.log(`[EmbeddingWorker] Job ${job.id} completed`);
  });

  embeddingWorker.on('failed', (job, err) => {
    logQueue('job-failed', 'agent-embedding', job?.id || 'unknown', {
      error: err.message,
    });
    console.error(`[EmbeddingWorker] Job ${job?.id} failed:`, err.message);
  });
}

// Queue service API
export class QueueService {
  /**
   * Add a sync job to the queue
   */
  async addSyncJob(
    systemId: string,
    options?: {
      tables?: string[];
      incrementalColumn?: string;
      lastSyncAt?: Date;
      priority?: number;
      delay?: number;
    }
  ): Promise<Job<SyncJobData>> {
    if (!redisAvailable || !syncQueue) {
      throw new Error('Queue system not available - Redis not connected');
    }

    return syncQueue.add(
      'sync-system',
      {
        systemId,
        tables: options?.tables,
        incrementalColumn: options?.incrementalColumn,
        lastSyncAt: options?.lastSyncAt,
      },
      {
        priority: options?.priority || 1,
        delay: options?.delay || 0,
      }
    );
  }

  /**
   * Schedule a recurring sync job
   */
  async scheduleSyncJob(
    systemId: string,
    cronPattern: string,
    options?: {
      tables?: string[];
      incrementalColumn?: string;
    }
  ): Promise<Job<SyncJobData>> {
    if (!redisAvailable || !syncQueue) {
      throw new Error('Queue system not available - Redis not connected');
    }

    return syncQueue.add(
      `sync-system-${systemId}`,
      {
        systemId,
        tables: options?.tables,
        incrementalColumn: options?.incrementalColumn,
      },
      {
        repeat: {
          pattern: cronPattern,
        },
      }
    );
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string, queueName: 'sync' | 'index' | 'embedding'): Promise<Job | null> {
    if (!redisAvailable) {
      return null;
    }
    const queue = queueName === 'sync' ? syncQueue : queueName === 'index' ? indexQueue : embeddingQueue;
    if (!queue) return null;
    const job = await queue.getJob(jobId);
    return job || null;
  }

  /**
   * Get job status and progress
   */
  async getJobStatus(jobId: string, queueName: 'sync' | 'index' | 'embedding') {
    const job = await this.getJob(jobId, queueName);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;
    const failedReason = job.failedReason;
    const returnvalue = job.returnvalue;

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      state,
      progress,
      failedReason,
      result: returnvalue,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: 'sync' | 'index' | 'embedding') {
    if (!redisAvailable) {
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, total: 0 };
    }

    const queue = queueName === 'sync' ? syncQueue : queueName === 'index' ? indexQueue : embeddingQueue;
    if (!queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, total: 0 };
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllStats() {
    const [syncStats, indexStats, embeddingStats] = await Promise.all([
      this.getQueueStats('sync'),
      this.getQueueStats('index'),
      this.getQueueStats('embedding'),
    ]);

    return {
      sync: syncStats,
      index: indexStats,
      embedding: embeddingStats,
    };
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string, queueName: 'sync' | 'index' | 'embedding'): Promise<void> {
    const job = await this.getJob(jobId, queueName);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const state = await job.getState();
    if (state !== 'failed') {
      throw new Error(`Job ${jobId} is not in failed state (current state: ${state})`);
    }

    await job.retry();
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string, queueName: 'sync' | 'index' | 'embedding'): Promise<void> {
    const job = await this.getJob(jobId, queueName);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.remove();
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(queueName: 'sync' | 'index' | 'embedding', limit = 50) {
    if (!redisAvailable) {
      return [];
    }

    const queue = queueName === 'sync' ? syncQueue : queueName === 'index' ? indexQueue : embeddingQueue;
    if (!queue) {
      return [];
    }

    const jobs = await queue.getFailed(0, limit - 1);

    return jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
    }));
  }

  /**
   * Clean old jobs
   */
  async cleanQueue(
    queueName: 'sync' | 'index' | 'embedding',
    grace: number = 86400000 // 24 hours in ms
  ): Promise<string[]> {
    if (!redisAvailable) return [];
    const queue = queueName === 'sync' ? syncQueue : queueName === 'index' ? indexQueue : embeddingQueue;
    if (!queue) return [];
    return queue.clean(grace, 1000, 'completed');
  }

  /**
   * Pause queue processing
   */
  async pauseQueue(queueName: 'sync' | 'index' | 'embedding'): Promise<void> {
    if (!redisAvailable) return;
    const queue = queueName === 'sync' ? syncQueue : queueName === 'index' ? indexQueue : embeddingQueue;
    if (!queue) return;
    await queue.pause();
  }

  /**
   * Resume queue processing
   */
  async resumeQueue(queueName: 'sync' | 'index' | 'embedding'): Promise<void> {
    if (!redisAvailable) return;
    const queue = queueName === 'sync' ? syncQueue : queueName === 'index' ? indexQueue : embeddingQueue;
    if (!queue) return;
    await queue.resume();
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    if (!redisAvailable || !connection) return;
    
    const promises = [];
    if (syncWorker) promises.push(syncWorker.close());
    if (indexWorker) promises.push(indexWorker.close());
    if (embeddingWorker) promises.push(embeddingWorker.close());
    if (syncQueue) promises.push(syncQueue.close());
    if (indexQueue) promises.push(indexQueue.close());
    if (embeddingQueue) promises.push(embeddingQueue.close());
    if (connection) promises.push(connection.quit());
    
    await Promise.all(promises);
  }
}

// Export singleton instance
export const queueService = new QueueService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing queue service...');
  await queueService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing queue service...');
  await queueService.close();
  process.exit(0);
});
