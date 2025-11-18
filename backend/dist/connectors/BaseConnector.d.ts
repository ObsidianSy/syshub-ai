import { IConnector, ConnectionConfig, TableSchema, FetchOptions, QueryResult, ConnectorHealth } from './types.js';
/**
 * Base Connector Class
 * Provides common functionality for all connectors
 */
export declare abstract class BaseConnector implements IConnector {
    protected config: ConnectionConfig;
    protected connection: any;
    protected isConnected: boolean;
    constructor(config: ConnectionConfig);
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract testConnection(): Promise<ConnectorHealth>;
    abstract listTables(): Promise<string[]>;
    abstract getTableSchema(tableName: string): Promise<TableSchema>;
    abstract fetchRows(options: FetchOptions): Promise<QueryResult>;
    /**
     * Default row transformation - can be overridden
     */
    transformRow(row: any, schema: TableSchema): any;
    /**
     * Transform value based on type
     */
    protected transformValue(value: any, type: string): any;
    /**
     * Build WHERE clause from conditions
     */
    protected buildWhereClause(where?: Record<string, any>): {
        sql: string;
        params: any[];
    };
    /**
     * Build ORDER BY clause
     */
    protected buildOrderByClause(orderBy?: {
        column: string;
        direction: 'ASC' | 'DESC';
    }[]): string;
    /**
     * Build LIMIT/OFFSET clause
     */
    protected buildLimitClause(limit?: number, offset?: number): string;
    /**
     * Check if connected, throw if not
     */
    protected ensureConnected(): void;
    /**
     * Get connector metadata
     */
    abstract getMetadata(): {
        type: string;
        version: string;
        capabilities: string[];
    };
}
//# sourceMappingURL=BaseConnector.d.ts.map