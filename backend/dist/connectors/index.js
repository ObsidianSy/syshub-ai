import { PostgreSQLConnector } from './PostgreSQLConnector.js';
import { MySQLConnector } from './MySQLConnector.js';
/**
 * Connector Factory
 * Creates appropriate connector based on type
 */
export class ConnectorFactory {
    static create(config) {
        switch (config.type) {
            case 'postgres':
                return new PostgreSQLConnector(config);
            case 'mysql':
                return new MySQLConnector(config);
            case 'mssql':
                throw new Error('MSSQL connector not yet implemented');
            case 'mongodb':
                throw new Error('MongoDB connector not yet implemented');
            case 'rest':
                throw new Error('REST connector not yet implemented');
            default:
                throw new Error(`Unknown connector type: ${config.type}`);
        }
    }
    static getSupportedTypes() {
        return ['postgres', 'mysql', 'mssql', 'mongodb', 'rest'];
    }
    static isSupported(type) {
        return this.getSupportedTypes().includes(type);
    }
}
export * from './types.js';
export * from './BaseConnector.js';
export * from './PostgreSQLConnector.js';
export * from './MySQLConnector.js';
//# sourceMappingURL=index.js.map