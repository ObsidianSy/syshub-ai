import mysql from 'mysql2/promise';
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

/**
 * MySQL Connector
 * Implements IConnector for MySQL/MariaDB databases
 */
export class MySQLConnector extends BaseConnector {
  private pool: mysql.Pool | null = null;

  constructor(config: ConnectionConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    try {
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl ? {} : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Test connection
      const connection = await this.pool.getConnection();
      connection.release();
      
      this.isConnected = true;
      console.log(`✅ MySQL connected: ${this.config.host}:${this.config.port}/${this.config.database}`);
    } catch (error: any) {
      this.isConnected = false;
      throw new Error(`Failed to connect to MySQL: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('✅ MySQL disconnected');
    }
  }

  async testConnection(): Promise<ConnectorHealth> {
    const startTime = Date.now();
    
    try {
      this.ensureConnected();
      
      const [rows] = await this.pool!.query('SELECT VERSION() as version');
      const latency = Date.now() - startTime;
      const version = (rows as any)[0].version;
      
      return {
        isConnected: true,
        latency,
        version,
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

    const [rows] = await this.pool!.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    return (rows as any[]).map(row => row.table_name || row.TABLE_NAME);
  }

  async getTableSchema(tableName: string): Promise<TableSchema> {
    this.ensureConnected();

    // Get columns
    const [columnsRows] = await this.pool!.query(`
      SELECT 
        COLUMN_NAME as column_name,
        DATA_TYPE as data_type,
        IS_NULLABLE as is_nullable,
        COLUMN_DEFAULT as column_default,
        COLUMN_KEY as column_key
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
      ORDER BY ordinal_position
    `, [tableName]);

    const columns: ColumnDefinition[] = (columnsRows as any[]).map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      isPrimaryKey: row.column_key === 'PRI',
      isForeignKey: row.column_key === 'MUL',
      references: undefined // MySQL foreign key info requires additional query
    }));

    // Get primary keys
    const [pkRows] = await this.pool!.query(`
      SELECT COLUMN_NAME as column_name
      FROM information_schema.key_column_usage
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND constraint_name = 'PRIMARY'
    `, [tableName]);

    const primaryKeys = (pkRows as any[]).map(row => row.column_name);

    // Get indexes
    const [indexRows] = await this.pool!.query(`
      SELECT 
        INDEX_NAME as index_name,
        GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns,
        NON_UNIQUE as non_unique
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ?
      GROUP BY INDEX_NAME, NON_UNIQUE
    `, [tableName]);

    const indexes: IndexDefinition[] = (indexRows as any[]).map(row => ({
      name: row.index_name,
      columns: row.columns ? row.columns.split(',') : [],
      unique: row.non_unique === 0
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

    let query = `SELECT ${columns} FROM \`${options.table}\``;
    const params: any[] = [];

    // WHERE clause
    const whereParts: string[] = [];
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value === null) {
          whereParts.push(`\`${key}\` IS NULL`);
        } else if (Array.isArray(value)) {
          whereParts.push(`\`${key}\` IN (?)`);
          params.push(value);
        } else {
          whereParts.push(`\`${key}\` = ?`);
          params.push(value);
        }
      });
    }

    // Incremental sync (since)
    if (options.since && options.sinceColumn) {
      whereParts.push(`\`${options.sinceColumn}\` > ?`);
      params.push(options.since);
    }

    if (whereParts.length > 0) {
      query += ` WHERE ${whereParts.join(' AND ')}`;
    }

    // ORDER BY
    if (options.orderBy && options.orderBy.length > 0) {
      const orderClauses = options.orderBy.map(o => `\`${o.column}\` ${o.direction}`);
      query += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    // LIMIT/OFFSET
    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }
    if (options.offset) {
      query += ` OFFSET ?`;
      params.push(options.offset);
    }

    const [rows, fields] = await this.pool!.query(query, params);
    const executionTime = Date.now() - startTime;

    // Get table schema for field info
    const schema = await this.getTableSchema(options.table);

    return {
      rows: rows as any[],
      fields: schema.columns,
      rowCount: (rows as any[]).length,
      executionTime
    };
  }

  async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    this.ensureConnected();
    
    const startTime = Date.now();
    const [rows, fields] = await this.pool!.query(query, params);
    const executionTime = Date.now() - startTime;

    return {
      rows: rows as any[],
      fields: (fields as any[]).map(f => ({
        name: f.name,
        type: f.type.toString(),
        nullable: true,
        isPrimaryKey: false,
        isForeignKey: false
      })),
      rowCount: (rows as any[]).length,
      executionTime
    };
  }

  getMetadata() {
    return {
      type: 'mysql',
      version: '1.0.0',
      capabilities: [
        'incremental-sync',
        'schema-introspection',
        'full-text-search',
        'transactions'
      ]
    };
  }
}
