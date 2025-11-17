import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';
import { agentService } from '../services/agent.service.js';
import { queueService } from '../services/queue.service.js';
import { ConnectionConfig } from '../connectors/types.js';
import db from '../config/sqlite.js';

const router = Router();

// Todas as rotas requerem autenticação (exceto process que já tem)
router.use(authenticateToken);

/**
 * POST /api/agent/systems/register
 * Register a new system connection
 */
router.post('/systems/register', async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      systemId: z.string(),
      config: z.object({
        type: z.enum(['postgres', 'mysql', 'mssql', 'mongodb', 'rest']),
        host: z.string(),
        port: z.number(),
        database: z.string().optional(),
        username: z.string(),
        password: z.string(),
        ssl: z.boolean().optional()
      })
    });

    const { systemId, config } = schema.parse(req.body);

    await agentService.registerSystem(systemId, config as ConnectionConfig);

    res.json({
      success: true,
      systemId,
      message: 'System registered successfully'
    });
  } catch (error: any) {
    console.error('Error registering system:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/agent/systems/:systemId
 * Unregister a system
 */
router.delete('/systems/:systemId', async (req: AuthRequest, res: Response) => {
  try {
    const { systemId } = req.params;

    await agentService.unregisterSystem(systemId);

    res.json({
      success: true,
      systemId,
      message: 'System unregistered successfully'
    });
  } catch (error: any) {
    console.error('Error unregistering system:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agent/systems
 * List all registered systems
 */
router.get('/systems', async (req: AuthRequest, res: Response) => {
  try {
    const systems = agentService.getRegisteredSystems();

    res.json({
      systems,
      count: systems.length
    });
  } catch (error: any) {
    console.error('Error listing systems:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agent/systems/:systemId/health
 * Test system connection
 */
router.get('/systems/:systemId/health', async (req: AuthRequest, res: Response) => {
  try {
    const { systemId } = req.params;

    const health = await agentService.testSystemConnection(systemId);

    res.json(health);
  } catch (error: any) {
    console.error('Error testing connection:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agent/systems/:systemId/tables
 * List all tables in a system
 */
router.get('/systems/:systemId/tables', async (req: AuthRequest, res: Response) => {
  try {
    const { systemId } = req.params;

    const tables = await agentService.listSystemTables(systemId);

    res.json({
      systemId,
      tables,
      count: tables.length
    });
  } catch (error: any) {
    console.error('Error listing tables:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agent/systems/:systemId/tables/:tableName/schema
 * Get schema for a table
 */
router.get('/systems/:systemId/tables/:tableName/schema', async (req: AuthRequest, res: Response) => {
  try {
    const { systemId, tableName } = req.params;

    const schema = await agentService.getTableSchema(systemId, tableName);

    res.json(schema);
  } catch (error) {
    console.error('Error getting table schema:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * POST /api/agent/systems/:systemId/query
 * Execute custom query on a system
 */
router.post('/systems/:systemId/query', async (req: AuthRequest, res: Response) => {
  try {
    const { systemId } = req.params;
    const schema = z.object({
      query: z.string(),
      params: z.array(z.any()).optional()
    });

    const { query, params = [] } = schema.parse(req.body);

    const result = await agentService.executeQuery(systemId, query, params);

    res.json(result);
  } catch (error) {
    console.error('Error executing query:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * POST /api/agent/sync
 * Trigger sync for a system (queued if Redis available, otherwise synchronous)
 */
router.post('/sync', async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      systemId: z.string(),
      tables: z.array(z.string()).optional(),
      incremental: z.boolean().optional(),
      incrementalColumn: z.string().optional(),
      priority: z.number().optional(),
      delay: z.number().optional(),
    });

    const { systemId, tables, incremental, incrementalColumn, priority, delay } = schema.parse(req.body);

    // Get last sync time if incremental
    let lastSyncAt: Date | undefined;
    if (incremental) {
      // TODO: Get from database (system_logs or agent_config)
      // For now, sync all data
    }

    try {
      // Try to queue the sync job (requires Redis)
      const job = await queueService.addSyncJob(systemId, {
        tables,
        incrementalColumn,
        lastSyncAt,
        priority,
        delay,
      });

      res.json({
        success: true,
        jobId: job.id,
        systemId,
        message: 'Sync job queued successfully',
        queued: true,
      });
    } catch (queueError) {
      // Redis not available - run sync synchronously
      console.warn('Queue not available, running sync synchronously');
      
      const result = await agentService.syncSystem(systemId, {
        tables,
        incrementalColumn,
        lastSyncAt,
      });

      res.json({
        success: result.status === 'success',
        systemId,
        message: result.status === 'success' ? 'Sync completed successfully' : 'Sync completed with errors',
        queued: false,
        result: {
          tablesProcessed: result.tablesProcessed,
          rowsProcessed: result.rowsProcessed,
          duration: result.duration,
          errors: result.errors,
        },
      });
    }
  } catch (error) {
    console.error('Error syncing:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/agent/sync/status/:jobId
 * Get status of a specific sync job
 */
router.get('/sync/status/:jobId', async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const { queue = 'sync' } = req.query;

    if (!['sync', 'index', 'embedding'].includes(queue as string)) {
      return res.status(400).json({ error: 'Invalid queue name' });
    }

    const status = await queueService.getJobStatus(jobId, queue as 'sync' | 'index' | 'embedding');

    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(status);
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/agent/sync/stats
 * Get statistics for all queues
 */
router.get('/sync/stats', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await queueService.getAllStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * POST /api/agent/sync/retry/:jobId
 * Retry a failed job
 */
router.post('/sync/retry/:jobId', async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const schema = z.object({
      queue: z.enum(['sync', 'index', 'embedding']),
    });

    const { queue } = schema.parse(req.body);

    await queueService.retryJob(jobId, queue);

    res.json({
      success: true,
      message: 'Job retry scheduled',
    });
  } catch (error) {
    console.error('Error retrying job:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * DELETE /api/agent/sync/cancel/:jobId
 * Cancel a job
 */
router.delete('/sync/cancel/:jobId', async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const { queue = 'sync' } = req.query;

    if (!['sync', 'index', 'embedding'].includes(queue as string)) {
      return res.status(400).json({ error: 'Invalid queue name' });
    }

    await queueService.cancelJob(jobId, queue as 'sync' | 'index' | 'embedding');

    res.json({
      success: true,
      message: 'Job cancelled',
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/agent/sync/failed
 * Get failed jobs
 */
router.get('/sync/failed', async (req: AuthRequest, res: Response) => {
  try {
    const { queue = 'sync', limit = '50' } = req.query;

    if (!['sync', 'index', 'embedding'].includes(queue as string)) {
      return res.status(400).json({ error: 'Invalid queue name' });
    }

    const failedJobs = await queueService.getFailedJobs(
      queue as 'sync' | 'index' | 'embedding',
      parseInt(limit as string)
    );

    res.json({
      queue,
      count: failedJobs.length,
      jobs: failedJobs,
    });
  } catch (error) {
    console.error('Error getting failed jobs:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * POST /api/agent/sync/schedule
 * Schedule recurring sync job
 */
router.post('/sync/schedule', async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      systemId: z.string(),
      cronPattern: z.string(), // e.g., '0 * * * *' for hourly
      tables: z.array(z.string()).optional(),
      incrementalColumn: z.string().optional(),
    });

    const { systemId, cronPattern, tables, incrementalColumn } = schema.parse(req.body);

    const job = await queueService.scheduleSyncJob(systemId, cronPattern, {
      tables,
      incrementalColumn,
    });

    res.json({
      success: true,
      jobId: job.id,
      systemId,
      cronPattern,
      message: 'Recurring sync job scheduled',
    });
  } catch (error) {
    console.error('Error scheduling sync job:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
