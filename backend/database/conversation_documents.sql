-- =====================================================
-- TABELA: conversation_documents
-- Documentos/arquivos anexados às conversas
-- =====================================================

CREATE TABLE IF NOT EXISTS conversation_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL, -- 'image', 'pdf', 'text', 'document', 'other'
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT, -- Path no filesystem ou URL
    file_data TEXT, -- Base64 para arquivos pequenos (opcional)
    metadata JSONB, -- Informações extras (dimensões de imagem, etc)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversation_documents_conversation ON conversation_documents(conversation_id);
CREATE INDEX idx_conversation_documents_user ON conversation_documents(user_id);
CREATE INDEX idx_conversation_documents_type ON conversation_documents(file_type);
CREATE INDEX idx_conversation_documents_created ON conversation_documents(created_at DESC);

-- Comentário de uso:
-- Esta tabela armazena arquivos anexados às conversas.
-- Arquivos pequenos (<1MB) podem ser armazenados como base64 em file_data
-- Arquivos maiores devem ter apenas o storage_path preenchido
