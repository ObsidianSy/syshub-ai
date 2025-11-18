import { IConnector, ConnectionConfig, NormalizedDocument, QueryResult } from '../connectors/types.js';
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
export declare class AgentService {
    private connectors;
    private syncJobs;
    /**
     * Register a new system connection
     */
    registerSystem(systemId: string, config: ConnectionConfig): Promise<void>;
    /**
     * Unregister a system and disconnect
     */
    unregisterSystem(systemId: string): Promise<void>;
    /**
     * Get connector for a system
     */
    getConnector(systemId: string): IConnector | undefined;
    /**
     * Test connection to a system
     */
    testSystemConnection(systemId: string): Promise<import("../connectors/types.js").ConnectorHealth>;
    /**
     * List all tables in a system
     */
    listSystemTables(systemId: string): Promise<string[]>;
    /**
     * Get schema for a table
     */
    getTableSchema(systemId: string, tableName: string): Promise<import("../connectors/types.js").TableSchema>;
    /**
     * Fetch rows from a table
     */
    fetchTableRows(systemId: string, table: string, options?: {
        limit?: number;
        offset?: number;
        since?: Date;
        sinceColumn?: string;
    }): Promise<QueryResult>;
    /**
     * Execute custom query on a system
     */
    executeQuery(systemId: string, query: string, params?: any[]): Promise<QueryResult>;
    /**
     * Normalize raw data to standard format using NormalizerService
     */
    normalizeData(systemId: string, tableName: string, rows: Record<string, unknown>[], schema: {
        primaryKeys: string[];
        tableName: string;
    }): NormalizedDocument[];
    /**
     * Sync a specific table
     */
    syncTable(systemId: string, tableName: string, incrementalColumn?: string, lastSyncAt?: Date): Promise<{
        rowsProcessed: number;
        documents: NormalizedDocument[];
    }>;
    /**
     * Sync entire system (all tables)
     */
    syncSystem(systemId: string, config?: {
        tables?: string[];
        incrementalColumn?: string;
        lastSyncAt?: Date;
    }): Promise<SyncJobResult>;
    /**
     * Get all registered systems
     */
    getRegisteredSystems(): string[];
    /**
     * Disconnect all systems
     */
    disconnectAll(): Promise<void>;
}
export declare const agentService: AgentService;
//# sourceMappingURL=agent.service.d.ts.map