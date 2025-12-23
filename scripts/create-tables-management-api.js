/**
 * Criar tabelas via Management API do Supabase
 * Usa a API de gerenciamento que permite executar SQL
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://pxyekqpcgjwaztummzvh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDk1MCwiZXhwIjoyMDgyMDgwOTUwfQ.tQyuHzPWjVjkY49Nyiq0xIA0GE7iKG4Cs9ttDj-bfKM';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQ5NTAsImV4cCI6MjA4MjA4MDk1MH0.SJsNzv-kqz936jpQLMk05Ap-xUpm3wkNPe1yrZeFluY';
const ACCESS_TOKEN = 'sbp_v0_9a534b668401ddf2bba66778f2cafc99cd9d4832';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const SCHEMA_SQL = `-- Tabela de usuários
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
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;

async function executeSQLViaManagementAPI(sql) {
    return new Promise((resolve, reject) => {
        // Usar Management API para executar SQL
        const projectRef = 'pxyekqpcgjwaztummzvh';
        const options = {
            hostname: 'api.supabase.com',
            path: `/v1/projects/${projectRef}/database/query`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log('✅ SQL executado com sucesso via Management API!');
                        resolve(true);
                    } else {
                        console.log('⚠️  Resposta da API:', data);
                        // Pode ser que a API não suporte esse endpoint
                        resolve(false);
                    }
                } catch (error) {
                    // Tentar interpretar como sucesso se não houver erro claro
                    if (res.statusCode === 200 || res.statusCode === 201) {
                        console.log('✅ SQL executado!');
                        resolve(true);
                    } else {
                        console.log('⚠️  Status:', res.statusCode);
                        resolve(false);
                    }
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('⚠️  Erro na requisição:', error.message);
            resolve(false);
        });
        
        // Enviar SQL
        req.write(JSON.stringify({ query: sql }));
        req.end();
    });
}

async function createTablesViaPostgREST() {
    // Tentar criar tabelas usando operações REST uma por uma
    // Isso não funciona para DDL, mas vamos tentar verificar
    
    console.log('📋 Verificando tabelas via REST API...');
    
    try {
        // Verificar se tabela users existe
        const { error } = await supabaseAdmin
            .from('users')
            .select('count')
            .limit(1);
        
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
        // Aguardar cache atualizar
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verificar se já existe
        const { data: existing, error: checkError } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('email', 'admin@chatbot.com')
            .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
            console.log('⚠️  Erro ao verificar usuário:', checkError.message);
        }
        
        if (existing) {
            console.log('✅ Usuário admin já existe!');
            return true;
        }
        
        // Criar usuário admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const { data: user, error } = await supabaseAdmin
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
            if (error.code === 'PGRST116') {
                console.log('❌ Tabela users não existe ainda.');
                return false;
            }
            throw error;
        }
        
        console.log('✅ Usuário admin criado!');
        console.log('   Email: admin@chatbot.com');
        console.log('   Senha: admin123');
        return true;
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error.message);
        return false;
    }
}

async function main() {
    console.log('');
    console.log('🚀 Criando Tabelas via Management API');
    console.log('============================================');
    console.log('');
    
    // Tentar executar SQL via Management API
    console.log('⏳ Executando SQL via Management API...');
    const sqlExecuted = await executeSQLViaManagementAPI(SCHEMA_SQL);
    
    if (!sqlExecuted) {
        console.log('');
        console.log('⚠️  Management API não suporta execução direta de SQL.');
        console.log('   Tentando método alternativo...');
        console.log('');
        
        // Verificar se tabelas já existem
        const tablesExist = await createTablesViaPostgREST();
        
        if (!tablesExist) {
            console.log('❌ Tabelas não existem e não podem ser criadas via API REST.');
            console.log('');
            console.log('📋 Execute o SQL manualmente no SQL Editor:');
            console.log('   https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql');
            console.log('');
            console.log('--- SQL ---');
            console.log(SCHEMA_SQL);
            console.log('--- FIM ---');
            console.log('');
            return;
        }
    }
    
    // Criar usuário admin
    console.log('');
    console.log('👤 Criando usuário admin...');
    await createAdminUser();
    
    console.log('');
    console.log('✅ Processo concluído!');
    console.log('');
    console.log('📝 Variáveis para Railway:');
    console.log('   SUPABASE_URL=https://pxyekqpcgjwaztummzvh.supabase.co');
    console.log('   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQ5NTAsImV4cCI6MjA4MjA4MDk1MH0.SJsNzv-kqz936jpQLMk05Ap-xUpm3wkNPe1yrZeFluY');
    console.log('');
}

main();

