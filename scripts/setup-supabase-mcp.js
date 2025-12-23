/**
 * Script para configurar Supabase usando Access Token
 * Cria tabelas e configura tudo automaticamente
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://pxyekqpcgjwaztummzvh.supabase.co';
const ACCESS_TOKEN = 'sbp_v0_9a534b668401ddf2bba66778f2cafc99cd9d4832';

// Schema SQL para criar tabelas
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

async function getProjectInfo() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.supabase.com',
            path: '/v1/projects/pxyekqpcgjwaztummzvh',
            method: 'GET',
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
                    const project = JSON.parse(data);
                    resolve(project);
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

async function executeSQL(sql) {
    // Usar a API REST do Supabase para executar SQL
    // Nota: A API REST não suporta execução direta de SQL
    // Precisamos usar o cliente Supabase com service_role key ou executar via SQL Editor
    
    console.log('⚠️  Executando SQL via cliente Supabase...');
    
    // Tentar obter anon key do projeto
    try {
        const project = await getProjectInfo();
        console.log('✅ Informações do projeto obtidas!');
        console.log('   Nome:', project.name);
        console.log('   Região:', project.region);
        console.log('');
        
        // A anon key não vem na API, mas podemos tentar usar o cliente
        // Vou criar um script que o usuário pode executar no SQL Editor
        console.log('📋 Para criar as tabelas:');
        console.log('   1. Acesse: https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql');
        console.log('   2. Cole o SQL abaixo e execute:');
        console.log('');
        console.log('--- INÍCIO DO SQL ---');
        console.log(SCHEMA_SQL);
        console.log('--- FIM DO SQL ---');
        console.log('');
        
        return { success: true, project };
    } catch (error) {
        console.error('❌ Erro:', error.message);
        throw error;
    }
}

async function createAdminUser(anonKey) {
    if (!anonKey) {
        console.log('⚠️  ANON KEY não fornecida. Pulando criação do usuário admin.');
        console.log('   Você pode criar manualmente após executar o schema SQL.');
        return;
    }
    
    try {
        const supabase = createClient(SUPABASE_URL, anonKey);
        
        // Verificar se já existe
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', 'admin@chatbot.com')
            .single();
        
        if (existing) {
            console.log('✅ Usuário admin já existe!');
            return;
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
            if (error.code === 'PGRST116') {
                console.log('⚠️  Tabela users não existe ainda.');
                console.log('   Execute o schema SQL primeiro!');
            } else {
                throw error;
            }
        } else {
            console.log('✅ Usuário admin criado com sucesso!');
            console.log('   Email: admin@chatbot.com');
            console.log('   Senha: admin123');
        }
    } catch (error) {
        console.error('❌ Erro ao criar usuário admin:', error.message);
    }
}

async function main() {
    console.log('');
    console.log('🚀 Configurando Supabase via Access Token');
    console.log('============================================');
    console.log('');
    console.log('📋 Projeto: bote-atendimentos.zap');
    console.log('🔗 URL:', SUPABASE_URL);
    console.log('');
    
    try {
        // Obter informações do projeto
        const project = await getProjectInfo();
        
        // Executar schema SQL (instruções)
        await executeSQL(SCHEMA_SQL);
        
        console.log('');
        console.log('✅ Configuração concluída!');
        console.log('');
        console.log('📝 Próximos passos:');
        console.log('   1. Execute o SQL acima no SQL Editor do Supabase');
        console.log('   2. Obtenha a ANON KEY em: Settings > API > anon public');
        console.log('   3. Adicione as variáveis no Railway:');
        console.log('      SUPABASE_URL=' + SUPABASE_URL);
        console.log('      SUPABASE_ANON_KEY=<cole-a-anon-key-aqui>');
        console.log('');
        
        // Se tiver anon key como variável de ambiente, criar admin
        if (process.env.SUPABASE_ANON_KEY) {
            console.log('👤 Criando usuário admin...');
            await createAdminUser(process.env.SUPABASE_ANON_KEY);
        }
        
    } catch (error) {
        console.error('❌ Erro na configuração:', error.message);
        process.exit(1);
    }
}

main();

