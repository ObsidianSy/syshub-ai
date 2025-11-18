import winston from 'winston';
/**
 * Log levels
 */
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
/**
 * Logger configuration
 */
interface LoggerConfig {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
    logDirectory: string;
    maxFiles: number;
    maxSize: string;
}
/**
 * Main logger instance
 */
export declare const logger: winston.Logger;
/**
 * Agent logger (specialized for agent operations)
 */
export declare const agentLogger: winston.Logger;
/**
 * Sync logger (specialized for sync operations)
 */
export declare const syncLogger: winston.Logger;
/**
 * API logger (specialized for API operations)
 */
export declare const apiLogger: winston.Logger;
/**
 * Database logger (specialized for database operations)
 */
export declare const dbLogger: winston.Logger;
/**
 * Log agent sync operation
 */
export declare function logSyncOperation(operation: 'start' | 'complete' | 'error', systemId: string, details?: Record<string, unknown>): void;
/**
 * Log agent connection
 */
export declare function logConnection(operation: 'register' | 'unregister' | 'test', systemId: string, success: boolean, details?: Record<string, unknown>): void;
/**
 * Log API request
 */
export declare function logApiRequest(method: string, path: string, statusCode: number, duration: number, userId?: string): void;
/**
 * Log database query
 */
export declare function logDatabaseQuery(operation: 'select' | 'insert' | 'update' | 'delete', table: string, duration: number, rowCount?: number, error?: Error): void;
/**
 * Log normalizer operation
 */
export declare function logNormalizer(operation: 'normalize' | 'mapping-loaded' | 'mapping-added', systemId: string, tableName?: string, count?: number, details?: Record<string, unknown>): void;
/**
 * Log queue operation
 */
export declare function logQueue(operation: 'job-added' | 'job-started' | 'job-completed' | 'job-failed' | 'job-retry', queueName: string, jobId: string, details?: Record<string, unknown>): void;
/**
 * Stream for Morgan HTTP logger
 */
export declare const morganStream: {
    write: (message: string) => void;
};
/**
 * Reconfigure logger (useful for tests or dynamic config)
 */
export declare function reconfigureLogger(config: Partial<LoggerConfig>): void;
/**
 * Create a child logger with custom metadata
 */
export declare function createChildLogger(metadata: Record<string, unknown>): winston.Logger;
export default logger;
//# sourceMappingURL=logger.service.d.ts.map