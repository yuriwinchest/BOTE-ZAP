#!/usr/bin/env node

/**
 * Script para configurar Supabase automaticamente
 * Uso: node scripts/setup-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setupSupabase() {
    console.log('');
    console.log('🚀 Configuração do Supabase');
    console.log('============================================');
    console.log('');
    
    // Solicitar credenciais
    const supabaseUrl = await question('📝 SUPABASE_URL: ');
    const supabaseKey = await question('📝 SUPABASE_ANON_KEY: ');
    const jwtSecret = await question('📝 JWT_SECRET (ou Enter para gerar automático): ') || 
                      require('crypto').randomBytes(32).toString('hex');
    
    console.log('');
    console.log('⏳ Verificando conexão com Supabase...');
    
    // Testar conexão
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        // Testar conexão simples
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não existe (ok)
            throw error;
        }
        
        console.log('✅ Conexão com Supabase estabelecida!');
        console.log('');
        
        // Ler schema SQL
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('📋 Schema SQL preparado:');
        console.log('   - Tabela: users');
        console.log('   - Tabela: active_tokens');
        console.log('   - Tabela: bot_config');
        console.log('   - Tabela: whatsapp_messages');
        console.log('');
        console.log('⚠️  IMPORTANTE: Execute o schema.sql no SQL Editor do Supabase!');
        console.log('   Caminho: bot/database/schema.sql');
        console.log('');
        
        // Criar arquivo .env.example
        const envExample = `# Configuração do Supabase
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseKey}
JWT_SECRET=${jwtSecret}
PORT=3000
HOST=0.0.0.0
`;
        
        const envPath = path.join(__dirname, '../.env.example');
        fs.writeFileSync(envPath, envExample);
        console.log('✅ Arquivo .env.example criado!');
        console.log('');
        
        console.log('📝 Variáveis para adicionar no Railway:');
        console.log('   SUPABASE_URL=' + supabaseUrl);
        console.log('   SUPABASE_ANON_KEY=' + supabaseKey);
        console.log('   JWT_SECRET=' + jwtSecret);
        console.log('');
        
        console.log('✅ Configuração concluída!');
        console.log('');
        console.log('📋 Próximos passos:');
        console.log('   1. Execute o schema.sql no Supabase SQL Editor');
        console.log('   2. Adicione as variáveis no Railway (Settings > Variables)');
        console.log('   3. Atualize server.js para usar supabase-auth.js');
        console.log('');
        
    } catch (error) {
        console.error('❌ Erro ao conectar com Supabase:', error.message);
        console.log('');
        console.log('Verifique:');
        console.log('   - URL está correta?');
        console.log('   - ANON KEY está correta?');
        console.log('   - Projeto Supabase está ativo?');
    }
    
    rl.close();
}

setupSupabase();

