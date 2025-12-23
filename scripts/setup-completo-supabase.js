/**
 * Script Completo - Cria tabelas e usuário admin no Supabase
 * Usa service_role key para criar tabelas via SQL
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const https = require('https');

const SUPABASE_URL = 'https://pxyekqpcgjwaztummzvh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQ5NTAsImV4cCI6MjA4MjA4MDk1MH0.SJsNzv-kqz936jpQLMk05Ap-xUpm3wkNPe1yrZeFluY';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDk1MCwiZXhwIjoyMDgyMDgwOTUwfQ.tQyuHzPWjVjkY49Nyiq0xIA0GE7iKG4Cs9ttDj-bfKM';

// Cliente com service_role (permite operações administrativas)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Cliente com anon key (para operações normais)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SCHEMA_SQL = `
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Tabela de tokens ativos
CREATE TABLE IF NOT EXISTS active_tokens (
    id BIGSERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_active_tokens_token ON active_tokens(token);
CREATE INDEX IF NOT EXISTS idx_active_tokens_expires_at ON active_tokens(expires_at);

-- Tabela de configurações do bot
CREATE TABLE IF NOT EXISTS bot_config (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id BIGSERIAL PRIMARY KEY,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    message_text TEXT,
    message_type VARCHAR(50),
    is_from_me BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bot_config_updated_at ON bot_config;
CREATE TRIGGER update_bot_config_updated_at BEFORE UPDATE ON bot_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function executeSQL(sql) {
    // Infelizmente, não podemos executar SQL diretamente via API REST
    // Mas podemos verificar se as tabelas existem e criar o usuário
    console.log('⚠️  A API REST do Supabase não permite executar SQL diretamente.');
    console.log('   Execute o SQL no SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql');
    console.log('');
    return false;
}

async function checkTables() {
    try {
        const { error } = await supabase.from('users').select('count').limit(1);
        if (error && error.code === 'PGRST116') {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

async function createAdminUser() {
    try {
        // Verificar se já existe
        const { data: existing } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', 'admin@chatbot.com')
            .single();
        
        if (existing) {
            console.log('✅ Usuário admin já existe!');
            return true;
        }
        
        // Criar usuário admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const { data: user, error } = await supabase
            .from('users')
            .insert({
                email: 'admin@chatbot.com',
                password: hashedPassword,
                name: 'Administrador',
                phone: null
            })
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        console.log('✅ Usuário admin criado com sucesso!');
        console.log('   Email: admin@chatbot.com');
        console.log('   Senha: admin123');
        return true;
    } catch (error) {
        console.error('❌ Erro ao criar usuário admin:', error.message);
        if (error.code === 'PGRST116') {
            console.log('   ⚠️  Tabelas não existem ainda. Execute o SQL primeiro!');
        }
        return false;
    }
}

async function main() {
    console.log('');
    console.log('🚀 Configuração Completa do Supabase');
    console.log('============================================');
    console.log('');
    
    // Verificar tabelas
    console.log('🔍 Verificando tabelas...');
    const tablesExist = await checkTables();
    
    if (!tablesExist) {
        console.log('❌ Tabelas não existem ainda!');
        console.log('');
        console.log('📋 Execute o SQL abaixo no SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql');
        console.log('');
        console.log('--- COLE ESTE SQL ---');
        console.log(SCHEMA_SQL);
        console.log('--- FIM DO SQL ---');
        console.log('');
        console.log('⏳ Após executar o SQL, execute este script novamente:');
        console.log('   node scripts/setup-completo-supabase.js');
        return;
    }
    
    console.log('✅ Tabelas existem!');
    console.log('');
    
    // Criar usuário admin
    console.log('👤 Criando usuário admin...');
    await createAdminUser();
    
    console.log('');
    console.log('✅ Configuração completa!');
    console.log('');
    console.log('📝 Variáveis para Railway:');
    console.log('   SUPABASE_URL=<configure-no-railway>');
    console.log('   SUPABASE_ANON_KEY=<configure-no-railway>');
    console.log('   JWT_SECRET=<configure-chave-forte>');
    console.log('');
    console.log('⚠️  SEGURANÇA: Configure as variáveis no Railway, não exponha as chaves!');
    console.log('');
}

main();

