/**
 * Script para criar usuário admin no Supabase
 * Execute após criar as tabelas: node database/create-admin-user.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// SEGURANÇA: Apenas variáveis de ambiente (sem valores padrão)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE_URL e SUPABASE_ANON_KEY devem estar configuradas!');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAdminUser() {
    try {
        console.log('🔐 Criando usuário admin...');
        
        // Verificar se já existe
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', 'admin@chatbot.com')
            .single();
        
        if (existing) {
            console.log('⚠️  Usuário admin já existe!');
            return;
        }
        
        // Hash da senha
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Criar usuário
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
        console.log('');
        
    } catch (error) {
        console.error('❌ Erro ao criar usuário admin:', error.message);
        process.exit(1);
    }
}

createAdminUser();

