import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'syshub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Não force search_path aqui; será definido no evento 'connect'
});

pool.on('error', (err) => {
  console.error('Erro inesperado no cliente PostgreSQL:', err);
  process.exit(-1);
});

// Define e reforça o search_path ao conectar (robusto)
const SCHEMA = process.env.DB_SCHEMA || 'public';
const isValidSchema = /^[a-zA-Z0-9_]+$/.test(SCHEMA);

pool.on('connect', async (client) => {
  try {
    const schemaToUse = isValidSchema ? SCHEMA : 'public';
    await client.query(`SET search_path TO ${schemaToUse}, public`);
    console.log('📚 search_path set on connect:', `${schemaToUse}, public`);
  } catch (e) {
    console.error('⚠️ Falha ao definir search_path:', e);
  }
});

// Log DB connection information (no secrets)
console.log('🔌 PostgreSQL pool config:', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'syshub',
  user: process.env.DB_USER || 'postgres',
  schema: SCHEMA,
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erro na query:', { text, error });
    throw error;
  }
};

export const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexão com PostgreSQL estabelecida:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com PostgreSQL:', error);
    return false;
  }
};
