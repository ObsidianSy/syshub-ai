import { IConnector, ConnectionConfig } from './types.js';
/**
 * Connector Factory
 * Creates appropriate connector based on type
 */
export declare class ConnectorFactory {
    static create(config: ConnectionConfig): IConnector;
    static getSupportedTypes(): string[];
    static isSupported(type: string): boolean;
}
export * from './types.js';
export * from './BaseConnector.js';
export * from './PostgreSQLConnector.js';
export * from './MySQLConnector.js';
//# sourceMappingURL=index.d.ts.map