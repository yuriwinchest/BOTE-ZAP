/**
 * Script Final - Configuração Completa do Supabase
 * Executa schema SQL e cria usuário admin
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://pxyekqpcgjwaztummzvh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQ5NTAsImV4cCI6MjA4MjA4MDk1MH0.SJsNzv-kqz936jpQLMk05Ap-xUpm3wkNPe1yrZeFluY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
    try {
        const { error } = await supabase.from('users').select('count').limit(1);
        if (error && error.code === 'PGRST116') {
            return false; // Tabela não existe
        }
        return true; // Tabela existe
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
        
        console.log('✅ Usuário admin criado!');
        console.log('   Email: admin@chatbot.com');
        console.log('   Senha: admin123');
        return true;
    } catch (error) {
        console.error('❌ Erro:', error.message);
        return false;
    }
}

async function main() {
    console.log('');
    console.log('🚀 Configuração Final do Supabase');
    console.log('============================================');
    console.log('');
    
    // Verificar se tabelas existem
    console.log('🔍 Verificando tabelas...');
    const tablesExist = await checkTables();
    
    if (!tablesExist) {
        console.log('⚠️  Tabelas não existem ainda!');
        console.log('');
        console.log('📋 Execute o SQL abaixo no SQL Editor do Supabase:');
        console.log('   https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql');
        console.log('');
        
        // Ler e mostrar schema SQL
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        console.log('--- COLE ESTE SQL ---');
        console.log(schema);
        console.log('--- FIM DO SQL ---');
        console.log('');
        console.log('⏳ Após executar o SQL, execute este script novamente.');
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
    console.log('   SUPABASE_URL=' + SUPABASE_URL);
    console.log('   SUPABASE_ANON_KEY=' + SUPABASE_ANON_KEY);
    console.log('');
    
    // Atualizar .env.supabase
    const envContent = `SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
JWT_SECRET=${process.env.JWT_SECRET || 'sua-chave-secreta-forte'}
`;
    
    fs.writeFileSync(path.join(__dirname, '../.env.supabase'), envContent);
    console.log('💾 Credenciais salvas em: bot/.env.supabase');
}

main();

