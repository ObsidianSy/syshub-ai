import { BaseConnector } from './BaseConnector.js';
import { ConnectionConfig, TableSchema, FetchOptions, QueryResult, ConnectorHealth } from './types.js';
/**
 * PostgreSQL Connector
 * Implements IConnector for PostgreSQL databases
 */
export declare class PostgreSQLConnector extends BaseConnector {
    private pool;
    constructor(config: ConnectionConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<ConnectorHealth>;
    listTables(): Promise<string[]>;
    getTableSchema(tableName: string): Promise<TableSchema>;
    fetchRows(options: FetchOptions): Promise<QueryResult>;
    executeQuery(query: string, params?: any[]): Promise<QueryResult>;
    getMetadata(): {
        type: string;
        version: string;
        capabilities: string[];
    };
}
//# sourceMappingURL=PostgreSQLConnector.d.ts.map