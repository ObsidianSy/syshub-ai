import { BaseConnector } from './BaseConnector.js';
import { ConnectionConfig, TableSchema, FetchOptions, QueryResult, ConnectorHealth } from './types.js';
/**
 * MySQL Connector
 * Implements IConnector for MySQL/MariaDB databases
 */
export declare class MySQLConnector extends BaseConnector {
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
//# sourceMappingURL=MySQLConnector.d.ts.map