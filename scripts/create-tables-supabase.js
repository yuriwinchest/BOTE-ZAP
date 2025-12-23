/**
 * Script para criar tabelas no Supabase usando a Secret Key
 * Tenta criar via API REST do Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pxyekqpcgjwaztummzvh.supabase.co';
const SUPABASE_SECRET_KEY = 'sb_secret_CAfYw1-KutnulJYxtZ1f_A_7CxETqQM'; // Service role key

// Criar cliente com service role (tem permissões administrativas)
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createTables() {
    console.log('');
    console.log('🚀 Criando Tabelas no Supabase');
    console.log('============================================');
    console.log('');
    
    // Infelizmente, a API REST do Supabase não permite executar SQL diretamente
    // Precisamos usar o SQL Editor ou criar via migrations
    
    console.log('⚠️  A API REST do Supabase não permite executar SQL diretamente.');
    console.log('');
    console.log('📋 Execute o SQL abaixo no SQL Editor do Supabase:');
    console.log('   https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql');
    console.log('');
    
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('--- COLE ESTE SQL ---');
    console.log(schema);
    console.log('--- FIM DO SQL ---');
    console.log('');
    
    // Verificar se tabelas já existem
    console.log('🔍 Verificando se tabelas já existem...');
    try {
        const { error } = await supabase.from('users').select('count').limit(1);
        if (error && error.code === 'PGRST116') {
            console.log('❌ Tabelas não existem ainda.');
            console.log('   Execute o SQL acima primeiro!');
        } else {
            console.log('✅ Tabelas já existem!');
        }
    } catch (error) {
        console.log('❌ Erro ao verificar:', error.message);
    }
}

createTables();

