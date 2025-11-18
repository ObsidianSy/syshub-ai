/**
 * Connector Types & Interfaces
 * Base types for database/system connectors
 */
export interface ConnectionConfig {
    type: 'postgres' | 'mysql' | 'mssql' | 'mongodb' | 'rest';
    host: string;
    port: number;
    database?: string;
    username: string;
    password: string;
    ssl?: boolean;
    extra?: Record<string, any>;
}
export interface TableSchema {
    tableName: string;
    columns: ColumnDefinition[];
    primaryKeys: string[];
    indexes: IndexDefinition[];
}
export interface ColumnDefinition {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: any;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    references?: {
        table: string;
        column: string;
    };
}
export interface IndexDefinition {
    name: string;
    columns: string[];
    unique: boolean;
    type?: string;
}
export interface FetchOptions {
    table: string;
    columns?: string[];
    where?: Record<string, any>;
    orderBy?: {
        column: string;
        direction: 'ASC' | 'DESC';
    }[];
    limit?: number;
    offset?: number;
    since?: Date;
    sinceColumn?: string;
}
export interface QueryResult {
    rows: any[];
    fields: ColumnDefinition[];
    rowCount: number;
    executionTime: number;
}
export interface ConnectorHealth {
    isConnected: boolean;
    latency?: number;
    version?: string;
    lastCheck: Date;
    error?: string;
}
/**
 * Base Connector Interface
 * All connectors must implement this interface
 */
export interface IConnector {
    /**
     * Connect to the database/system
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the database/system
     */
    disconnect(): Promise<void>;
    /**
     * Test connection and return health status
     */
    testConnection(): Promise<ConnectorHealth>;
    /**
     * List all available tables/collections
     */
    listTables(): Promise<string[]>;
    /**
     * Get schema for a specific table
     */
    getTableSchema(tableName: string): Promise<TableSchema>;
    /**
     * Fetch rows from a table with options
     */
    fetchRows(options: FetchOptions): Promise<QueryResult>;
    /**
     * Execute a custom query (optional, for advanced use)
     */
    executeQuery?(query: string, params?: any[]): Promise<QueryResult>;
    /**
     * Transform raw row to normalized format
     */
    transformRow(row: any, schema: TableSchema): any;
    /**
     * Get connector metadata
     */
    getMetadata(): {
        type: string;
        version: string;
        capabilities: string[];
    };
}
/**
 * Normalized Document Schema
 * Standard format for all data after transformation
 */
export interface NormalizedDocument {
    id: string;
    systemId: string;
    tableName: string;
    entityType: string;
    title: string;
    description?: string;
    searchableText: string;
    metadata: Record<string, any>;
    tags?: string[];
    timestamp?: Date;
    author?: string;
}
/**
 * Sync Job Configuration
 */
export interface SyncJobConfig {
    id: string;
    systemId: string;
    connectionConfig: ConnectionConfig;
    tables: string[];
    schedule?: string;
    incrementalColumn?: string;
    lastSyncAt?: Date;
    isActive: boolean;
}
//# sourceMappingURL=types.d.ts.map