import { 
  IConnector, 
  ConnectionConfig, 
  TableSchema, 
  FetchOptions, 
  QueryResult,
  ConnectorHealth 
} from './types.js';

/**
 * Base Connector Class
 * Provides common functionality for all connectors
 */
export abstract class BaseConnector implements IConnector {
  protected config: ConnectionConfig;
  protected connection: any;
  protected isConnected: boolean = false;

  constructor(config: ConnectionConfig) {
    this.config = config;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<ConnectorHealth>;
  abstract listTables(): Promise<string[]>;
  abstract getTableSchema(tableName: string): Promise<TableSchema>;
  abstract fetchRows(options: FetchOptions): Promise<QueryResult>;

  /**
   * Default row transformation - can be overridden
   */
  transformRow(row: any, schema: TableSchema): any {
    const transformed: any = {};
    
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
  protected transformValue(value: any, type: string): any {
    if (value === null || value === undefined) return null;

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
  protected buildWhereClause(where?: Record<string, any>): { sql: string; params: any[] } {
    if (!where || Object.keys(where).length === 0) {
      return { sql: '', params: [] };
    }

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    Object.entries(where).forEach(([key, value]) => {
      if (value === null) {
        conditions.push(`${key} IS NULL`);
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`${key} IN (${placeholders})`);
        params.push(...value);
      } else {
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
  protected buildOrderByClause(orderBy?: { column: string; direction: 'ASC' | 'DESC' }[]): string {
    if (!orderBy || orderBy.length === 0) return '';
    
    const clauses = orderBy.map(o => `${o.column} ${o.direction}`).join(', ');
    return `ORDER BY ${clauses}`;
  }

  /**
   * Build LIMIT/OFFSET clause
   */
  protected buildLimitClause(limit?: number, offset?: number): string {
    const parts: string[] = [];
    if (limit) parts.push(`LIMIT ${limit}`);
    if (offset) parts.push(`OFFSET ${offset}`);
    return parts.join(' ');
  }

  /**
   * Check if connected, throw if not
   */
  protected ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error('Not connected. Call connect() first.');
    }
  }

  /**
   * Get connector metadata
   */
  abstract getMetadata(): {
    type: string;
    version: string;
    capabilities: string[];
  };
}
