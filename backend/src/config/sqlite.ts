import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db: Database.Database = new Database(join(__dirname, '../../syshub.db'));

// Criar tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    avatar_url TEXT,
    is_active INTEGER DEFAULT 1,
    last_login TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS systems (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'online',
    description TEXT,
    icon TEXT,
    version TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS queries (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    question TEXT NOT NULL,
    system_id TEXT,
    system_name TEXT,
    response TEXT,
    response_metadata TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    execution_time_ms INTEGER,
    tokens_used INTEGER,
    is_favorite INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (system_id) REFERENCES systems(id)
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    title TEXT,
    is_active INTEGER DEFAULT 1,
    last_message_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS conversation_messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS conversation_documents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    conversation_id TEXT NOT NULL,
    user_id TEXT,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT,
    file_data TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
`);

// Inserir sistemas padrão
const systemsCount = db.prepare('SELECT COUNT(*) as count FROM systems').get() as { count: number };
if (systemsCount.count === 0) {
  const insertSystem = db.prepare(`
    INSERT INTO systems (name, slug, category, status, description, icon)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertSystem.run('Opus One – Estoque', 'opus-one-estoque', 'Estoque', 'online', 'Sistema principal de gestão de estoque', 'Package');
  insertSystem.run('Financeiro Core', 'financeiro-core', 'Financeiro', 'online', 'Módulo central de gestão financeira', 'DollarSign');
  insertSystem.run('N8N Integração', 'n8n-integracao', 'Integração', 'online', 'Automações e webhooks', 'Workflow');
  
  console.log('✅ Sistemas padrão inseridos');
}

// Listar usuários existentes no banco para debug
const users = db.prepare('SELECT id, email, role FROM users').all();
console.log('📋 Usuários no banco:', users.length);
users.forEach((u: any) => {
  console.log(`   - ${u.email} (ID: ${u.id}, Role: ${u.role})`);
});

export default db;
