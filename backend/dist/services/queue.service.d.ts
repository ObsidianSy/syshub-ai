import { Queue, Job } from 'bullmq';
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
export declare const syncQueue: Queue<SyncJobData, any, string, SyncJobData, any, string> | null;
export declare const indexQueue: Queue<IndexJobData, any, string, IndexJobData, any, string> | null;
export declare const embeddingQueue: Queue<EmbeddingJobData, any, string, EmbeddingJobData, any, string> | null;
export declare class QueueService {
    /**
     * Add a sync job to the queue
     */
    addSyncJob(systemId: string, options?: {
        tables?: string[];
        incrementalColumn?: string;
        lastSyncAt?: Date;
        priority?: number;
        delay?: number;
    }): Promise<Job<SyncJobData>>;
    /**
     * Schedule a recurring sync job
     */
    scheduleSyncJob(systemId: string, cronPattern: string, options?: {
        tables?: string[];
        incrementalColumn?: string;
    }): Promise<Job<SyncJobData>>;
    /**
     * Get job by ID
     */
    getJob(jobId: string, queueName: 'sync' | 'index' | 'embedding'): Promise<Job | null>;
    /**
     * Get job status and progress
     */
    getJobStatus(jobId: string, queueName: 'sync' | 'index' | 'embedding'): Promise<{
        id: string | undefined;
        name: string;
        data: any;
        state: "unknown" | import("bullmq").JobState;
        progress: import("bullmq").JobProgress;
        failedReason: string;
        result: any;
        attemptsMade: number;
        processedOn: number | undefined;
        finishedOn: number | undefined;
    } | null>;
    /**
     * Get queue statistics
     */
    getQueueStats(queueName: 'sync' | 'index' | 'embedding'): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        total: number;
    }>;
    /**
     * Get all queue statistics
     */
    getAllStats(): Promise<{
        sync: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
            delayed: number;
            total: number;
        };
        index: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
            delayed: number;
            total: number;
        };
        embedding: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
            delayed: number;
            total: number;
        };
    }>;
    /**
     * Retry a failed job
     */
    retryJob(jobId: string, queueName: 'sync' | 'index' | 'embedding'): Promise<void>;
    /**
     * Cancel a job
     */
    cancelJob(jobId: string, queueName: 'sync' | 'index' | 'embedding'): Promise<void>;
    /**
     * Get failed jobs
     */
    getFailedJobs(queueName: 'sync' | 'index' | 'embedding', limit?: number): Promise<{
        id: string | undefined;
        name: string;
        data: SyncJobData | IndexJobData | EmbeddingJobData;
        failedReason: string;
        attemptsMade: number;
        timestamp: number;
    }[]>;
    /**
     * Clean old jobs
     */
    cleanQueue(queueName: 'sync' | 'index' | 'embedding', grace?: number): Promise<string[]>;
    /**
     * Pause queue processing
     */
    pauseQueue(queueName: 'sync' | 'index' | 'embedding'): Promise<void>;
    /**
     * Resume queue processing
     */
    resumeQueue(queueName: 'sync' | 'index' | 'embedding'): Promise<void>;
    /**
     * Close all connections
     */
    close(): Promise<void>;
}
export declare const queueService: QueueService;
//# sourceMappingURL=queue.service.d.ts.map