import winston from 'winston';
import path from 'path';
/**
 * Log levels
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (LogLevel = {}));
/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: process.env.NODE_ENV === 'production',
    logDirectory: process.env.LOG_DIR || './logs',
    maxFiles: 7, // Keep logs for 7 days
    maxSize: '20m', // 20MB per file
};
/**
 * Custom log format
 */
const customFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.splat(), winston.format.json());
/**
 * Console format (human-readable)
 */
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
        metaStr = JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${service || 'app'}] ${level}: ${message} ${metaStr}`;
}));
/**
 * Create transports based on config
 */
function createTransports(config) {
    const transports = [];
    // Console transport
    if (config.enableConsole) {
        transports.push(new winston.transports.Console({
            format: consoleFormat,
        }));
    }
    // File transports
    if (config.enableFile) {
        // Error log
        transports.push(new winston.transports.File({
            filename: path.join(config.logDirectory, 'error.log'),
            level: 'error',
            format: customFormat,
            maxsize: parseSize(config.maxSize),
            maxFiles: config.maxFiles,
        }));
        // Combined log
        transports.push(new winston.transports.File({
            filename: path.join(config.logDirectory, 'combined.log'),
            format: customFormat,
            maxsize: parseSize(config.maxSize),
            maxFiles: config.maxFiles,
        }));
        // Agent-specific logs
        transports.push(new winston.transports.File({
            filename: path.join(config.logDirectory, 'agent.log'),
            format: customFormat,
            maxsize: parseSize(config.maxSize),
            maxFiles: config.maxFiles,
        }));
        // Sync jobs log
        transports.push(new winston.transports.File({
            filename: path.join(config.logDirectory, 'sync.log'),
            format: customFormat,
            maxsize: parseSize(config.maxSize),
            maxFiles: config.maxFiles,
        }));
    }
    return transports;
}
/**
 * Parse size string to bytes
 */
function parseSize(sizeStr) {
    const units = {
        b: 1,
        k: 1024,
        m: 1024 * 1024,
        g: 1024 * 1024 * 1024,
    };
    const match = sizeStr.match(/^(\d+)([bkmg])?$/i);
    if (!match) {
        return 20 * 1024 * 1024; // Default 20MB
    }
    const value = parseInt(match[1], 10);
    const unit = (match[2] || 'b').toLowerCase();
    return value * (units[unit] || 1);
}
/**
 * Create logger instance
 */
function createLogger(config = DEFAULT_CONFIG) {
    return winston.createLogger({
        level: config.level,
        format: customFormat,
        defaultMeta: { service: 'syshub-agent' },
        transports: createTransports(config),
        exitOnError: false,
    });
}
/**
 * Main logger instance
 */
export const logger = createLogger();
/**
 * Agent logger (specialized for agent operations)
 */
export const agentLogger = logger.child({ service: 'agent' });
/**
 * Sync logger (specialized for sync operations)
 */
export const syncLogger = logger.child({ service: 'sync' });
/**
 * API logger (specialized for API operations)
 */
export const apiLogger = logger.child({ service: 'api' });
/**
 * Database logger (specialized for database operations)
 */
export const dbLogger = logger.child({ service: 'database' });
/**
 * Log agent sync operation
 */
export function logSyncOperation(operation, systemId, details) {
    const logData = {
        operation: 'sync',
        systemId,
        ...details,
    };
    switch (operation) {
        case 'start':
            syncLogger.info(`Sync started for system ${systemId}`, logData);
            break;
        case 'complete':
            syncLogger.info(`Sync completed for system ${systemId}`, logData);
            break;
        case 'error':
            syncLogger.error(`Sync failed for system ${systemId}`, logData);
            break;
    }
}
/**
 * Log agent connection
 */
export function logConnection(operation, systemId, success, details) {
    const logData = {
        operation,
        systemId,
        success,
        ...details,
    };
    const message = `${operation} ${success ? 'succeeded' : 'failed'} for system ${systemId}`;
    if (success) {
        agentLogger.info(message, logData);
    }
    else {
        agentLogger.error(message, logData);
    }
}
/**
 * Log API request
 */
export function logApiRequest(method, path, statusCode, duration, userId) {
    const logData = {
        method,
        path,
        statusCode,
        duration,
        userId,
    };
    if (statusCode >= 500) {
        apiLogger.error('API request failed', logData);
    }
    else if (statusCode >= 400) {
        apiLogger.warn('API request client error', logData);
    }
    else {
        apiLogger.info('API request', logData);
    }
}
/**
 * Log database query
 */
export function logDatabaseQuery(operation, table, duration, rowCount, error) {
    const logData = {
        operation,
        table,
        duration,
        rowCount,
    };
    if (error) {
        dbLogger.error(`Database ${operation} failed on ${table}`, {
            ...logData,
            error: error.message,
            stack: error.stack,
        });
    }
    else {
        dbLogger.debug(`Database ${operation} on ${table}`, logData);
    }
}
/**
 * Log normalizer operation
 */
export function logNormalizer(operation, systemId, tableName, count, details) {
    const logData = {
        operation,
        systemId,
        tableName,
        count,
        ...details,
    };
    agentLogger.info(`Normalizer ${operation}`, logData);
}
/**
 * Log queue operation
 */
export function logQueue(operation, queueName, jobId, details) {
    const logData = {
        operation,
        queue: queueName,
        jobId,
        ...details,
    };
    if (operation === 'job-failed') {
        syncLogger.error(`Queue job failed`, logData);
    }
    else {
        syncLogger.info(`Queue ${operation}`, logData);
    }
}
/**
 * Stream for Morgan HTTP logger
 */
export const morganStream = {
    write: (message) => {
        apiLogger.info(message.trim());
    },
};
/**
 * Reconfigure logger (useful for tests or dynamic config)
 */
export function reconfigureLogger(config) {
    const newConfig = { ...DEFAULT_CONFIG, ...config };
    const newLogger = createLogger(newConfig);
    // Replace transports
    logger.clear();
    newLogger.transports.forEach((transport) => {
        logger.add(transport);
    });
    logger.info('Logger reconfigured', newConfig);
}
/**
 * Create a child logger with custom metadata
 */
export function createChildLogger(metadata) {
    return logger.child(metadata);
}
export default logger;
//# sourceMappingURL=logger.service.js.map