/**
 * Base Connector Class
 * Provides common functionality for all connectors
 */
export class BaseConnector {
    config;
    connection;
    isConnected = false;
    constructor(config) {
        this.config = config;
    }
    /**
     * Default row transformation - can be overridden
     */
    transformRow(row, schema) {
        const transformed = {};
        schema.columns.forEach(col => {
            if (row[col.name] !== undefined) {
                transformed[col.name] = this.transformValue(row[col.name], col.type);
            }
        });
        return transformed;
    }
    /**
     * Transform value based on type
     */
    transformValue(value, type) {
        if (value === null || value === undefined)
            return null;
        switch (type.toLowerCase()) {
            case 'timestamp':
            case 'timestamptz':
            case 'datetime':
                return value instanceof Date ? value : new Date(value);
            case 'json':
            case 'jsonb':
                return typeof value === 'string' ? JSON.parse(value) : value;
            case 'boolean':
            case 'bool':
                return Boolean(value);
            case 'integer':
            case 'int':
            case 'bigint':
                return parseInt(value, 10);
            case 'numeric':
            case 'decimal':
            case 'float':
            case 'double':
                return parseFloat(value);
            default:
                return value;
        }
    }
    /**
     * Build WHERE clause from conditions
     */
    buildWhereClause(where) {
        if (!where || Object.keys(where).length === 0) {
            return { sql: '', params: [] };
        }
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        Object.entries(where).forEach(([key, value]) => {
            if (value === null) {
                conditions.push(`${key} IS NULL`);
            }
            else if (Array.isArray(value)) {
                const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
                conditions.push(`${key} IN (${placeholders})`);
                params.push(...value);
            }
            else {
                conditions.push(`${key} = $${paramIndex++}`);
                params.push(value);
            }
        });
        return {
            sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
            params
        };
    }
    /**
     * Build ORDER BY clause
     */
    buildOrderByClause(orderBy) {
        if (!orderBy || orderBy.length === 0)
            return '';
        const clauses = orderBy.map(o => `${o.column} ${o.direction}`).join(', ');
        return `ORDER BY ${clauses}`;
    }
    /**
     * Build LIMIT/OFFSET clause
     */
    buildLimitClause(limit, offset) {
        const parts = [];
        if (limit)
            parts.push(`LIMIT ${limit}`);
        if (offset)
            parts.push(`OFFSET ${offset}`);
        return parts.join(' ');
    }
    /**
     * Check if connected, throw if not
     */
    ensureConnected() {
        if (!this.isConnected) {
            throw new Error('Not connected. Call connect() first.');
        }
    }
}
//# sourceMappingURL=BaseConnector.js.map