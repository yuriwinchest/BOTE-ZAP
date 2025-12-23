-- ============================================
-- SCHEMA MULTI-TENANCY - Bots por Usuário
-- ============================================

-- NOTA: A tabela users já existe, não precisa criar novamente
-- Apenas garantir que o índice existe
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Tabela de bots (um por usuário)
CREATE TABLE IF NOT EXISTS user_bots (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bot_name VARCHAR(255) NOT NULL DEFAULT 'Meu Bot',
    company_name VARCHAR(255),
    welcome_message TEXT,
    site_link VARCHAR(500),
    is_active BOOLEAN DEFAULT FALSE,
    is_connected BOOLEAN DEFAULT FALSE,
    qr_code_data TEXT,
    session_data JSONB, -- Dados da sessão WhatsApp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- Um bot por usuário
);

CREATE INDEX IF NOT EXISTS idx_user_bots_user_id ON user_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bots_active ON user_bots(is_active);

-- Tabela de configurações do bot por usuário
CREATE TABLE IF NOT EXISTS bot_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    auto_reply BOOLEAN DEFAULT TRUE,
    show_typing BOOLEAN DEFAULT TRUE,
    message_delay INTEGER DEFAULT 3,
    operating_hours JSONB, -- { enabled: false } ou { enabled: true, start: '08:00', end: '18:00' }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- Uma configuração por usuário
);

CREATE INDEX IF NOT EXISTS idx_bot_settings_user_id ON bot_settings(user_id);

-- Tabela de tokens ativos (já existe)
CREATE TABLE IF NOT EXISTS active_tokens (
    id BIGSERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_active_tokens_token ON active_tokens(token);
CREATE INDEX IF NOT EXISTS idx_active_tokens_expires_at ON active_tokens(expires_at);

-- Tabela de mensagens do WhatsApp (associadas ao usuário)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    message_text TEXT,
    message_type VARCHAR(50),
    is_from_me BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_bots_updated_at ON user_bots;
CREATE TRIGGER update_user_bots_updated_at BEFORE UPDATE ON user_bots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bot_settings_updated_at ON bot_settings;
CREATE TRIGGER update_bot_settings_updated_at BEFORE UPDATE ON bot_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE user_bots IS 'Bots WhatsApp associados a cada usuário';
COMMENT ON TABLE bot_settings IS 'Configurações do bot por usuário';
COMMENT ON TABLE whatsapp_messages IS 'Mensagens do WhatsApp por usuário';

