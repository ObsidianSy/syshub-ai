import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// GET /api/debug-db
router.get('/debug-db', async (req, res) => {
  try {
    // current database schema and search_path
    const currentSchemaRes = await query('SELECT current_schema()');
    const searchPathRes = await query("SHOW search_path");

    // locations for 'users' table
    const usersTableRes = await query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'users'");

    // list of schemas for debugging
    const schemasRes = await query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog','information_schema','pg_toast')");

    res.json({
      ok: true,
      currentSchema: currentSchemaRes.rows[0]?.current_schema,
      searchPath: searchPathRes.rows[0]?.search_path,
      usersTables: usersTableRes.rows,
      availableSchemas: schemasRes.rows.map(r => r.schema_name),
      dbConfig: {
        host: process.env.DB_HOST || null,
        port: process.env.DB_PORT || null,
        database: process.env.DB_NAME || null,
        user: process.env.DB_USER || null,
      }
    });
  } catch (error) {
    console.error('Error in /debug-db', error);
    const message = (error instanceof Error) ? error.message : String(error);
    res.status(500).json({ ok: false, error: message });
  }
});

export default router;
