/**
 * Criar tabelas no Supabase via API usando Service Role Key
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://pxyekqpcgjwaztummzvh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDk1MCwiZXhwIjoyMDgyMDgwOTUwfQ.tQyuHzPWjVjkY49Nyiq0xIA0GE7iKG4Cs9ttDj-bfKM';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQ5NTAsImV4cCI6MjA4MjA4MDk1MH0.SJsNzv-kqz936jpQLMk05Ap-xUpm3wkNPe1yrZeFluY';

// Cliente com service role (permite tudo)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Cliente normal
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

async function executeSQLViaRPC(sql) {
    // Tentar executar via RPC (PostgreSQL function)
    try {
        // Dividir SQL em comandos individuais
        const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
        
        for (const command of commands) {
            if (command.trim()) {
                try {
                    // Usar rpc para executar SQL
                    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
                        sql_query: command.trim()
                    });
                    
                    if (error) {
                        console.log('⚠️  Comando via RPC falhou, tentando método alternativo...');
                        break;
                    }
                } catch (err) {
                    // RPC não disponível, usar método alternativo
                    break;
                }
            }
        }
    } catch (error) {
        // Continuar com método alternativo
    }
    
    // Método alternativo: usar REST API diretamente
    return new Promise((resolve, reject) => {
        const url = new URL(SUPABASE_URL);
        const path = '/rest/v1/rpc/exec_sql';
        
        const options = {
            hostname: url.hostname,
            path: path,
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(true);
                } else {
                    // Tentar criar tabelas uma por uma via REST API
                    resolve(false);
                }
            });
        });
        
        req.on('error', () => {
            // Continuar com método de criar tabelas individualmente
            resolve(false);
        });
        
        req.write(JSON.stringify({ sql_query: sql }));
        req.end();
    });
}

async function createTablesIndividually() {
    console.log('📋 Criando tabelas individualmente via REST API...');
    
    try {
        // Criar tabela users usando REST API (não funciona diretamente)
        // A melhor forma é usar o PostgREST que já está configurado
        // Mas podemos verificar se as tabelas existem e criar dados
        
        // Verificar se tabela users existe
        const { error: checkError } = await supabaseAdmin
            .from('users')
            .select('count')
            .limit(1);
        
        if (checkError && checkError.code === 'PGRST116') {
            console.log('❌ Tabelas não existem. A API REST não permite criar tabelas.');
            console.log('   Use o método via SQL Editor ou migrations.');
            return false;
        }
        
        console.log('✅ Tabelas já existem!');
        return true;
    } catch (error) {
        console.log('❌ Erro:', error.message);
        return false;
    }
}

async function createAdminUser() {
    try {
        // Verificar se já existe
        const { data: existing } = await supabaseAdmin
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
    console.log('🚀 Criando Tabelas no Supabase via API');
    console.log('============================================');
    console.log('');
    
    // Tentar executar SQL via API
    console.log('⏳ Tentando executar SQL via API...');
    const sqlExecuted = await executeSQLViaRPC(SCHEMA_SQL);
    
    if (!sqlExecuted) {
        // Tentar criar tabelas individualmente
        const tablesCreated = await createTablesIndividually();
        
        if (!tablesCreated) {
            console.log('');
            console.log('⚠️  Não é possível criar tabelas diretamente via REST API.');
            console.log('   A API REST do Supabase não suporta DDL (CREATE TABLE).');
            console.log('');
            console.log('📋 Execute o SQL no SQL Editor:');
            console.log('   https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql');
            console.log('');
            console.log('--- SQL ---');
            console.log(SCHEMA_SQL);
            console.log('--- FIM ---');
            console.log('');
            return;
        }
    }
    
    // Aguardar um pouco para o cache atualizar
    console.log('⏳ Aguardando cache atualizar...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Criar usuário admin
    console.log('');
    console.log('👤 Criando usuário admin...');
    await createAdminUser();
    
    console.log('');
    console.log('✅ Configuração concluída!');
    console.log('');
    console.log('📝 Variáveis para Railway:');
    console.log('   SUPABASE_URL=<configure-no-railway>');
    console.log('   SUPABASE_ANON_KEY=<configure-no-railway>');
    console.log('⚠️  SEGURANÇA: Configure as variáveis no Railway, não exponha as chaves!');
    console.log('');
}

main();

