import { ConnectorFactory } from '../connectors/index.js';
import { normalizerService } from './normalizer.service.js';
/**
 * Agent Service
 * Orchestrates data fetching, normalization, and indexing
 */
export class AgentService {
    connectors = new Map();
    syncJobs = new Map();
    /**
     * Register a new system connection
     */
    async registerSystem(systemId, config) {
        try {
            const connector = ConnectorFactory.create(config);
            await connector.connect();
            const health = await connector.testConnection();
            if (!health.isConnected) {
                throw new Error(`Connection test failed: ${health.error}`);
            }
            this.connectors.set(systemId, connector);
            console.log(`✅ System registered: ${systemId} (${config.type})`);
        }
        catch (error) {
            console.error(`❌ Failed to register system ${systemId}:`, error.message);
            throw error;
        }
    }
    /**
     * Unregister a system and disconnect
     */
    async unregisterSystem(systemId) {
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
    getConnector(systemId) {
        return this.connectors.get(systemId);
    }
    /**
     * Test connection to a system
     */
    async testSystemConnection(systemId) {
        const connector = this.connectors.get(systemId);
        if (!connector) {
            throw new Error(`System not found: ${systemId}`);
        }
        return await connector.testConnection();
    }
    /**
     * List all tables in a system
     */
    async listSystemTables(systemId) {
        const connector = this.connectors.get(systemId);
        if (!connector) {
            throw new Error(`System not found: ${systemId}`);
        }
        return await connector.listTables();
    }
    /**
     * Get schema for a table
     */
    async getTableSchema(systemId, tableName) {
        const connector = this.connectors.get(systemId);
        if (!connector) {
            throw new Error(`System not found: ${systemId}`);
        }
        return await connector.getTableSchema(tableName);
    }
    /**
     * Fetch rows from a table
     */
    async fetchTableRows(systemId, table, options = {}) {
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
    async executeQuery(systemId, query, params = []) {
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
    normalizeData(systemId, tableName, rows, schema) {
        return normalizerService.normalizeMany(systemId, tableName, rows, schema);
    }
    /**
     * Sync a specific table
     */
    async syncTable(systemId, tableName, incrementalColumn, lastSyncAt) {
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
    async syncSystem(systemId, config = {}) {
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
            const errors = [];
            // Process each table
            for (const table of tables) {
                try {
                    const result = await this.syncTable(systemId, table, config.incrementalColumn, config.lastSyncAt);
                    totalRows += result.rowsProcessed;
                    // TODO: Store normalized documents in index/database
                    // await this.storeDocuments(result.documents);
                }
                catch (error) {
                    console.error(`❌ Error syncing table ${table}:`, error.message);
                    errors.push({
                        table,
                        error: error.message
                    });
                }
            }
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            const result = {
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
        }
        catch (error) {
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
    getRegisteredSystems() {
        return Array.from(this.connectors.keys());
    }
    /**
     * Disconnect all systems
     */
    async disconnectAll() {
        console.log('🔌 Disconnecting all systems...');
        for (const [systemId, connector] of this.connectors.entries()) {
            try {
                await connector.disconnect();
                console.log(`✅ Disconnected: ${systemId}`);
            }
            catch (error) {
                console.error(`❌ Error disconnecting ${systemId}:`, error.message);
            }
        }
        this.connectors.clear();
        console.log('✅ All systems disconnected');
    }
}
// Singleton instance
export const agentService = new AgentService();
//# sourceMappingURL=agent.service.js.map