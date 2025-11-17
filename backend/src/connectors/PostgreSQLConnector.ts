import pg from 'pg';
import { BaseConnector } from './BaseConnector.js';
import {
  ConnectionConfig,
  TableSchema,
  ColumnDefinition,
  IndexDefinition,
  FetchOptions,
  QueryResult,
  ConnectorHealth
} from './types.js';

const { Pool } = pg;

/**
 * PostgreSQL Connector
 * Implements IConnector for PostgreSQL databases
 */
export class PostgreSQLConnector extends BaseConnector {
  private pool: pg.Pool | null = null;

  constructor(config: ConnectionConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      client.release();
      
      this.isConnected = true;
      console.log(`✅ PostgreSQL connected: ${this.config.host}:${this.config.port}/${this.config.database}`);
    } catch (error: any) {
      this.isConnected = false;
      throw new Error(`Failed to connect to PostgreSQL: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('✅ PostgreSQL disconnected');
    }
  }

  async testConnection(): Promise<ConnectorHealth> {
    const startTime = Date.now();
    
    try {
      this.ensureConnected();
      
      const result = await this.pool!.query('SELECT version() as version');
      const latency = Date.now() - startTime;
      
      return {
        isConnected: true,
        latency,
        version: result.rows[0].version,
        lastCheck: new Date()
      };
    } catch (error: any) {
      return {
        isConnected: false,
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  async listTables(): Promise<string[]> {
    this.ensureConnected();

    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const result = await this.pool!.query(query);
    return result.rows.map(row => row.table_name);
  }

  async getTableSchema(tableName: string): Promise<TableSchema> {
    this.ensureConnected();

    // Get columns
    const columnsQuery = `
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        tc.constraint_type,
        kcu2.table_name as foreign_table,
        kcu2.column_name as foreign_column
      FROM information_schema.columns c
      LEFT JOIN information_schema.key_column_usage kcu
        ON c.table_name = kcu.table_name 
        AND c.column_name = kcu.column_name
      LEFT JOIN information_schema.table_constraints tc
        ON kcu.constraint_name = tc.constraint_name
      LEFT JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      LEFT JOIN information_schema.key_column_usage kcu2
        ON rc.unique_constraint_name = kcu2.constraint_name
      WHERE c.table_schema = 'public' 
        AND c.table_name = $1
      ORDER BY c.ordinal_position
    `;

    const columnsResult = await this.pool!.query(columnsQuery, [tableName]);
    
    const columns: ColumnDefinition[] = columnsResult.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      isPrimaryKey: row.constraint_type === 'PRIMARY KEY',
      isForeignKey: row.constraint_type === 'FOREIGN KEY',
      references: row.foreign_table ? {
        table: row.foreign_table,
        column: row.foreign_column
      } : undefined
    }));

    // Get primary keys
    const pkQuery = `
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = $1
        AND tc.constraint_type = 'PRIMARY KEY'
    `;

    const pkResult = await this.pool!.query(pkQuery, [tableName]);
    const primaryKeys = pkResult.rows.map(row => row.column_name);

    // Get indexes
    const indexQuery = `
      SELECT
        i.relname as index_name,
        array_agg(a.attname ORDER BY a.attnum) as column_names,
        ix.indisunique as is_unique
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relkind = 'r'
        AND t.relname = $1
      GROUP BY i.relname, ix.indisunique
    `;

    const indexResult = await this.pool!.query(indexQuery, [tableName]);
    const indexes: IndexDefinition[] = indexResult.rows.map(row => ({
      name: row.index_name,
      columns: row.column_names,
      unique: row.is_unique
    }));

    return {
      tableName,
      columns,
      primaryKeys,
      indexes
    };
  }

  async fetchRows(options: FetchOptions): Promise<QueryResult> {
    this.ensureConnected();
    
    const startTime = Date.now();
    const columns = options.columns && options.columns.length > 0 
      ? options.columns.join(', ') 
      : '*';

    let query = `SELECT ${columns} FROM ${options.table}`;
    const params: any[] = [];
    let paramIndex = 1;

    // WHERE clause
    if (options.where) {
      const { sql, params: whereParams } = this.buildWhereClause(options.where);
      query += ` ${sql}`;
      params.push(...whereParams);
      paramIndex += whereParams.length;
    }

    // Incremental sync (since)
    if (options.since && options.sinceColumn) {
      const connector = params.length > 0 ? 'AND' : 'WHERE';
      query += ` ${connector} ${options.sinceColumn} > $${paramIndex++}`;
      params.push(options.since);
    }

    // ORDER BY
    if (options.orderBy && options.orderBy.length > 0) {
      query += ` ${this.buildOrderByClause(options.orderBy)}`;
    }

    // LIMIT/OFFSET
    if (options.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }
    if (options.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    const result = await this.pool!.query(query, params);
    const executionTime = Date.now() - startTime;

    // Get table schema for field info
    const schema = await this.getTableSchema(options.table);

    return {
      rows: result.rows,
      fields: schema.columns,
      rowCount: result.rowCount || 0,
      executionTime
    };
  }

  async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    this.ensureConnected();
    
    const startTime = Date.now();
    const result = await this.pool!.query(query, params);
    const executionTime = Date.now() - startTime;

    return {
      rows: result.rows,
      fields: result.fields.map(f => ({
        name: f.name,
        type: f.dataTypeID.toString(),
        nullable: true,
        isPrimaryKey: false,
        isForeignKey: false
      })),
      rowCount: result.rowCount || 0,
      executionTime
    };
  }

  getMetadata() {
    return {
      type: 'postgres',
      version: '1.0.0',
      capabilities: [
        'incremental-sync',
        'schema-introspection',
        'full-text-search',
        'vector-search',
        'transactions'
      ]
    };
  }
}
