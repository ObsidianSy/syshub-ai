import { 
  IConnector, 
  ConnectionConfig, 
  NormalizedDocument, 
  SyncJobConfig,
  QueryResult 
} from '../connectors/types.js';
import { ConnectorFactory } from '../connectors/index.js';
import { normalizerService } from './normalizer.service.js';

/**
 * Sync Job Result
 */
export interface SyncJobResult {
  jobId: string;
  systemId: string;
  status: 'success' | 'failed' | 'partial';
  tablesProcessed: number;
  rowsProcessed: number;
  rowsInserted: number;
  rowsUpdated: number;
  errors: any[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

/**
 * Agent Service
 * Orchestrates data fetching, normalization, and indexing
 */
export class AgentService {
  private connectors: Map<string, IConnector> = new Map();
  private syncJobs: Map<string, SyncJobConfig> = new Map();

  /**
   * Register a new system connection
   */
  async registerSystem(systemId: string, config: ConnectionConfig): Promise<void> {
    try {
      const connector = ConnectorFactory.create(config);
      await connector.connect();
      
      const health = await connector.testConnection();
      if (!health.isConnected) {
        throw new Error(`Connection test failed: ${health.error}`);
      }

      this.connectors.set(systemId, connector);
      console.log(`✅ System registered: ${systemId} (${config.type})`);
    } catch (error: any) {
      console.error(`❌ Failed to register system ${systemId}:`, error.message);
      throw error;
    }
  }

  /**
   * Unregister a system and disconnect
   */
  async unregisterSystem(systemId: string): Promise<void> {
    const connector = this.connectors.get(systemId);
    if (connector) {
      await connector.disconnect();
      this.connectors.delete(systemId);
      console.log(`✅ System unregistered: ${systemId}`);
    }
  }

  /**
   * Get connector for a system
   */
  getConnector(systemId: string): IConnector | undefined {
    return this.connectors.get(systemId);
  }

  /**
   * Test connection to a system
   */
  async testSystemConnection(systemId: string) {
    const connector = this.connectors.get(systemId);
    if (!connector) {
      throw new Error(`System not found: ${systemId}`);
    }

    return await connector.testConnection();
  }

  /**
   * List all tables in a system
   */
  async listSystemTables(systemId: string): Promise<string[]> {
    const connector = this.connectors.get(systemId);
    if (!connector) {
      throw new Error(`System not found: ${systemId}`);
    }

    return await connector.listTables();
  }

  /**
   * Get schema for a table
   */
  async getTableSchema(systemId: string, tableName: string) {
    const connector = this.connectors.get(systemId);
    if (!connector) {
      throw new Error(`System not found: ${systemId}`);
    }

    return await connector.getTableSchema(tableName);
  }

  /**
   * Fetch rows from a table
   */
  async fetchTableRows(
    systemId: string, 
    table: string, 
    options: {
      limit?: number;
      offset?: number;
      since?: Date;
      sinceColumn?: string;
    } = {}
  ): Promise<QueryResult> {
    const connector = this.connectors.get(systemId);
    if (!connector) {
      throw new Error(`System not found: ${systemId}`);
    }

    return await connector.fetchRows({
      table,
      ...options
    });
  }

  /**
   * Execute custom query on a system
   */
  async executeQuery(
    systemId: string, 
    query: string, 
    params: any[] = []
  ): Promise<QueryResult> {
    const connector = this.connectors.get(systemId);
    if (!connector) {
      throw new Error(`System not found: ${systemId}`);
    }

    if (!connector.executeQuery) {
      throw new Error('Custom queries not supported by this connector');
    }

    return await connector.executeQuery(query, params);
  }

  /**
   * Normalize raw data to standard format using NormalizerService
   */
  normalizeData(
    systemId: string,
    tableName: string,
    rows: Record<string, unknown>[],
    schema: { primaryKeys: string[]; tableName: string }
  ): NormalizedDocument[] {
    return normalizerService.normalizeMany(systemId, tableName, rows, schema as any);
  }

  /**
   * Sync a specific table
   */
  async syncTable(
    systemId: string,
    tableName: string,
    incrementalColumn?: string,
    lastSyncAt?: Date
  ): Promise<{
    rowsProcessed: number;
    documents: NormalizedDocument[];
  }> {
    console.log(`🔄 Syncing table: ${systemId}.${tableName}`);

    const connector = this.connectors.get(systemId);
    if (!connector) {
      throw new Error(`System not found: ${systemId}`);
    }

    // Get table schema
    const schema = await connector.getTableSchema(tableName);

    // Fetch rows (incremental if lastSyncAt is provided)
    const result = await connector.fetchRows({
      table: tableName,
      since: lastSyncAt,
      sinceColumn: incrementalColumn,
      limit: 1000 // Process in batches
    });

    // Normalize data
    const documents = this.normalizeData(systemId, tableName, result.rows, schema);

    console.log(`✅ Synced ${documents.length} rows from ${systemId}.${tableName}`);

    return {
      rowsProcessed: documents.length,
      documents
    };
  }

  /**
   * Sync entire system (all tables)
   */
  async syncSystem(
    systemId: string,
    config: {
      tables?: string[];
      incrementalColumn?: string;
      lastSyncAt?: Date;
    } = {}
  ): Promise<SyncJobResult> {
    const startTime = new Date();
    const jobId = `sync-${systemId}-${Date.now()}`;

    console.log(`🚀 Starting sync job: ${jobId}`);

    try {
      const connector = this.connectors.get(systemId);
      if (!connector) {
        throw new Error(`System not found: ${systemId}`);
      }

      // Get tables to sync
      const tables = config.tables || await connector.listTables();
      
      let totalRows = 0;
      const errors: any[] = [];

      // Process each table
      for (const table of tables) {
        try {
          const result = await this.syncTable(
            systemId,
            table,
            config.incrementalColumn,
            config.lastSyncAt
          );
          
          totalRows += result.rowsProcessed;

          // TODO: Store normalized documents in index/database
          // await this.storeDocuments(result.documents);

        } catch (error: any) {
          console.error(`❌ Error syncing table ${table}:`, error.message);
          errors.push({
            table,
            error: error.message
          });
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const result: SyncJobResult = {
        jobId,
        systemId,
        status: errors.length === 0 ? 'success' : (totalRows > 0 ? 'partial' : 'failed'),
        tablesProcessed: tables.length,
        rowsProcessed: totalRows,
        rowsInserted: totalRows, // TODO: Track inserts vs updates
        rowsUpdated: 0,
        errors,
        startTime,
        endTime,
        duration
      };

      console.log(`✅ Sync job completed: ${jobId}`, result);
      return result;

    } catch (error: any) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        jobId,
        systemId,
        status: 'failed',
        tablesProcessed: 0,
        rowsProcessed: 0,
        rowsInserted: 0,
        rowsUpdated: 0,
        errors: [{ error: error.message }],
        startTime,
        endTime,
        duration
      };
    }
  }

  /**
   * Get all registered systems
   */
  getRegisteredSystems(): string[] {
    return Array.from(this.connectors.keys());
  }

  /**
   * Disconnect all systems
   */
  async disconnectAll(): Promise<void> {
    console.log('🔌 Disconnecting all systems...');
    
    for (const [systemId, connector] of this.connectors.entries()) {
      try {
        await connector.disconnect();
        console.log(`✅ Disconnected: ${systemId}`);
      } catch (error: any) {
        console.error(`❌ Error disconnecting ${systemId}:`, error.message);
      }
    }

    this.connectors.clear();
    console.log('✅ All systems disconnected');
  }
}

// Singleton instance
export const agentService = new AgentService();
