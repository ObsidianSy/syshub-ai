import express from 'express';
import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
const router = express.Router();
const INIT_SQL = `
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- TABELA: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- TABELA: systems
CREATE TABLE IF NOT EXISTS systems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'online',
    description TEXT,
    icon VARCHAR(50),
    version VARCHAR(50),
    database_connection JSONB,
    api_endpoint TEXT,
    documentation_url TEXT,
    contact_email VARCHAR(255),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_systems_slug ON systems(slug);
CREATE INDEX IF NOT EXISTS idx_systems_category ON systems(category);
CREATE INDEX IF NOT EXISTS idx_systems_status ON systems(status);

-- TABELA: queries
CREATE TABLE IF NOT EXISTS queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
    system_name VARCHAR(255),
    response TEXT,
    response_metadata JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    execution_time_ms INTEGER,
    tokens_used INTEGER,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_queries_user ON queries(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_system ON queries(system_id);
CREATE INDEX IF NOT EXISTS idx_queries_status ON queries(status);

-- TABELA: conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_active ON conversations(is_active);

-- TABELA: conversation_messages
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created ON conversation_messages(created_at);

-- TABELA: conversation_documents
CREATE TABLE IF NOT EXISTS conversation_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100),
    size BIGINT,
    url TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversation_documents_conversation ON conversation_documents(conversation_id);
`;
/**
 * Endpoint para inicializar o banco de dados
 * POST /api/init-db
 */
router.post('/init-db', async (req, res) => {
    try {
        console.log('🔧 Inicializando banco de dados...');
        // Executar o SQL de inicialização
        await query(INIT_SQL);
        console.log('✅ Tabelas criadas com sucesso!');
        // Verificar se já existe usuário admin
        const existingUsers = await query('SELECT COUNT(*) as count FROM users');
        const userCount = parseInt(existingUsers.rows[0].count);
        if (userCount === 0) {
            console.log('👤 Criando usuário admin padrão...');
            const hashedPassword = await bcrypt.hash('senha123', 10);
            await query(`INSERT INTO users (email, password_hash, full_name, role, is_active) 
         VALUES ($1, $2, $3, $4, $5)`, ['deltagarr@gmail.com', hashedPassword, 'Wesley Admin', 'admin', true]);
            console.log('✅ Usuário admin criado!');
            console.log('   Email: deltagarr@gmail.com');
            console.log('   Senha: senha123');
        }
        res.json({
            success: true,
            message: 'Banco de dados inicializado com sucesso!',
            tablesCreated: [
                'users',
                'systems',
                'queries',
                'conversations',
                'conversation_messages',
                'conversation_documents'
            ],
            adminUser: userCount === 0 ? {
                email: 'deltagarr@gmail.com',
                password: 'senha123'
            } : 'Usuários já existentes'
        });
    }
    catch (error) {
        console.error('❌ Erro ao inicializar banco:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            detail: error.detail || error.hint
        });
    }
});
/**
 * Endpoint para verificar status do banco
 * GET /api/init-db/status
 */
router.get('/init-db/status', async (req, res) => {
    try {
        const tables = ['users', 'systems', 'queries', 'conversations', 'conversation_messages', 'conversation_documents'];
        const status = {};
        for (const table of tables) {
            try {
                const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
                status[table] = {
                    exists: true,
                    count: parseInt(result.rows[0].count)
                };
            }
            catch (error) {
                status[table] = {
                    exists: false,
                    error: error.message
                };
            }
        }
        const allTablesExist = Object.values(status).every((s) => s.exists);
        res.json({
            initialized: allTablesExist,
            tables: status
        });
    }
    catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});
export default router;
//# sourceMappingURL=init-db.routes.js.map