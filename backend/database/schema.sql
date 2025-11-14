-- =====================================================
-- SYSHUB AI - Database Schema
-- PostgreSQL Schema completo para Central de Sistemas
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca full-text

-- =====================================================
-- TABELA: users (Usuários do sistema)
-- =====================================================
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- TABELA: systems (Sistemas disponíveis)
-- =====================================================
CREATE TABLE IF NOT EXISTS systems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Estoque', 'Financeiro', 'ERP Fábrica', 'Calculadoras', 'Integração', 'Outro')),
    status VARCHAR(50) DEFAULT 'online' CHECK (status IN ('online', 'teste', 'depreciado', 'offline')),
    description TEXT,
    icon VARCHAR(50),
    version VARCHAR(50),
    database_connection JSONB, -- Informações de conexão do sistema
    api_endpoint TEXT,
    documentation_url TEXT,
    contact_email VARCHAR(255),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_systems_slug ON systems(slug);
CREATE INDEX idx_systems_category ON systems(category);
CREATE INDEX idx_systems_status ON systems(status);
CREATE INDEX idx_systems_active ON systems(is_active);

-- =====================================================
-- TABELA: queries (Consultas feitas pelos usuários)
-- =====================================================
CREATE TABLE IF NOT EXISTS queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
    system_name VARCHAR(255),
    response TEXT,
    response_metadata JSONB, -- Dados adicionais da resposta
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    execution_time_ms INTEGER,
    tokens_used INTEGER,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_queries_user ON queries(user_id);
CREATE INDEX idx_queries_system ON queries(system_id);
CREATE INDEX idx_queries_status ON queries(status);
CREATE INDEX idx_queries_favorite ON queries(is_favorite);
CREATE INDEX idx_queries_created ON queries(created_at DESC);

-- =====================================================
-- TABELA: query_history (Histórico detalhado de queries)
-- =====================================================
CREATE TABLE IF NOT EXISTS query_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'created', 'favorited', 'viewed', 'shared'
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_query_history_query ON query_history(query_id);
CREATE INDEX idx_query_history_user ON query_history(user_id);
CREATE INDEX idx_query_history_action ON query_history(action);

-- =====================================================
-- TABELA: conversations (Conversas com o agente)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_active ON conversations(is_active);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- =====================================================
-- TABELA: conversation_messages (Mensagens das conversas)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON conversation_messages(conversation_id);
CREATE INDEX idx_messages_created ON conversation_messages(created_at);

-- =====================================================
-- TABELA: system_logs (Logs de acesso aos sistemas)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_id UUID REFERENCES systems(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'access', 'query', 'error', 'maintenance'
    details TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_logs_system ON system_logs(system_id);
CREATE INDEX idx_system_logs_user ON system_logs(user_id);
CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);

-- =====================================================
-- TABELA: system_documentation (Documentação dos sistemas)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_documentation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_id UUID REFERENCES systems(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    doc_type VARCHAR(100) DEFAULT 'guide' CHECK (doc_type IN ('guide', 'api', 'tutorial', 'faq', 'troubleshooting')),
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doc_system ON system_documentation(system_id);
CREATE INDEX idx_doc_type ON system_documentation(doc_type);
CREATE INDEX idx_doc_published ON system_documentation(is_published);

-- =====================================================
-- TABELA: favorites (Favoritos dos usuários)
-- =====================================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('query', 'system', 'conversation', 'documentation')),
    entity_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_entity ON favorites(entity_type, entity_id);
CREATE UNIQUE INDEX idx_favorites_unique ON favorites(user_id, entity_type, entity_id);

-- =====================================================
-- TABELA: notifications (Notificações do sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- TABELA: agent_config (Configuração do agente IA)
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_config_key ON agent_config(config_key);

-- =====================================================
-- TABELA: api_keys (Chaves de API para integração)
-- =====================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '["read"]',
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_systems_updated_at BEFORE UPDATE ON systems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_documentation_updated_at BEFORE UPDATE ON system_documentation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_config_updated_at BEFORE UPDATE ON agent_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS (Visualizações úteis)
-- =====================================================

-- View: Estatísticas de queries por sistema
CREATE OR REPLACE VIEW system_query_stats AS
SELECT 
    s.id,
    s.name,
    s.slug,
    COUNT(q.id) as total_queries,
    COUNT(CASE WHEN q.status = 'completed' THEN 1 END) as completed_queries,
    COUNT(CASE WHEN q.status = 'failed' THEN 1 END) as failed_queries,
    AVG(q.execution_time_ms) as avg_execution_time,
    MAX(q.created_at) as last_query_at
FROM systems s
LEFT JOIN queries q ON s.id = q.system_id
GROUP BY s.id, s.name, s.slug;

-- View: Atividade recente dos usuários
CREATE OR REPLACE VIEW user_activity AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    COUNT(DISTINCT q.id) as total_queries,
    COUNT(DISTINCT c.id) as total_conversations,
    MAX(q.created_at) as last_query_at,
    MAX(u.last_login) as last_login
FROM users u
LEFT JOIN queries q ON u.id = q.user_id
LEFT JOIN conversations c ON u.id = c.user_id
GROUP BY u.id, u.email, u.full_name;

-- =====================================================
-- DADOS INICIAIS (Seeds)
-- =====================================================

-- Inserir sistemas mockados
INSERT INTO systems (name, slug, category, status, description, icon, version, order_index) VALUES
('Opus One – Estoque', 'opus-one-estoque', 'Estoque', 'online', 'Sistema principal de gestão de estoque com controle kit-aware e movimentações', 'Package', '2.1.0', 1),
('Financeiro Core', 'financeiro-core', 'Financeiro', 'online', 'Módulo central de gestão financeira, contas a pagar e receber', 'DollarSign', '3.0.5', 2),
('Lotes App', 'lotes-app', 'ERP Fábrica', 'teste', 'Aplicativo para controle de lotes de produção e rastreabilidade', 'Database', '1.2.0-beta', 3),
('Calculadora de Preços', 'calc-precos', 'Calculadoras', 'online', 'Ferramenta para cálculo automático de precificação baseado em custos', 'Calculator', '1.5.2', 4),
('Integrador SYS33', 'integrador-sys33', 'Integração', 'online', 'Middleware de integração com sistema legado SYS33', 'Workflow', '2.3.1', 5),
('Obsidian Docs', 'obsidian-docs', 'ERP Fábrica', 'depreciado', 'Sistema antigo de documentação técnica (em migração)', 'Database', '0.9.8', 6)
ON CONFLICT (slug) DO NOTHING;

-- Inserir configurações do agente
INSERT INTO agent_config (config_key, config_value, description) VALUES
('n8n_webhook_url', '{"url": "", "enabled": false}', 'URL do webhook N8N para processamento de queries'),
('default_system_timeout', '{"timeout_ms": 30000}', 'Timeout padrão para queries em sistemas'),
('max_tokens_per_query', '{"max_tokens": 4000}', 'Limite de tokens por query'),
('enable_query_cache', '{"enabled": true, "ttl_seconds": 3600}', 'Cache de respostas de queries')
ON CONFLICT (config_key) DO NOTHING;

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE users IS 'Usuários autenticados no sistema';
COMMENT ON TABLE systems IS 'Sistemas disponíveis para consulta via agente IA';
COMMENT ON TABLE queries IS 'Histórico de perguntas e respostas do agente';
COMMENT ON TABLE conversations IS 'Conversas contínuas com o agente';
COMMENT ON TABLE conversation_messages IS 'Mensagens individuais nas conversas';
COMMENT ON TABLE system_logs IS 'Logs de acesso e uso dos sistemas';
COMMENT ON TABLE system_documentation IS 'Documentação técnica dos sistemas';
COMMENT ON TABLE favorites IS 'Itens marcados como favoritos pelos usuários';
COMMENT ON TABLE notifications IS 'Notificações do sistema para usuários';
COMMENT ON TABLE agent_config IS 'Configurações do agente de IA';
COMMENT ON TABLE api_keys IS 'Chaves de API para integração externa';

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
