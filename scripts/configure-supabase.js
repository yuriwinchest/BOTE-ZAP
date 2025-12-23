/**
 * Script para configurar Supabase automaticamente
 * Usa o access token para criar tabelas e configurar tudo
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração
const SUPABASE_URL = 'https://pxyekqpcgjwaztummzvh.supabase.co';
const SUPABASE_ACCESS_TOKEN = 'sbp_v0_9a534b668401ddf2bba66778f2cafc99cd9d4832';

// Solicitar anon key
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
    console.log('');
    console.log('❌ SUPABASE_ANON_KEY não encontrada!');
    console.log('');
    console.log('📝 Para obter a ANON KEY:');
    console.log('   1. Acesse: https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh');
    console.log('   2. Vá em: Settings > API');
    console.log('   3. Copie a chave "anon" "public"');
    console.log('');
    console.log('💡 Depois execute:');
    console.log('   SUPABASE_ANON_KEY=sua-chave node scripts/configure-supabase.js');
    console.log('');
    process.exit(1);
}

async function configureSupabase() {
    console.log('');
    console.log('🚀 Configurando Supabase...');
    console.log('============================================');
    console.log('');
    console.log('📋 Projeto: bote-atendimentos.zap');
    console.log('🔗 URL:', SUPABASE_URL);
    console.log('');
    
    // Criar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    try {
        // Testar conexão
        console.log('⏳ Testando conexão...');
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        console.log('✅ Conexão estabelecida!');
        console.log('');
        
        // Ler schema SQL
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('📋 Schema SQL preparado!');
        console.log('   Execute no SQL Editor do Supabase:');
        console.log('   https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql');
        console.log('');
        console.log('   Ou execute manualmente o arquivo:');
        console.log('   bot/database/schema.sql');
        console.log('');
        
        // Criar usuário admin
        console.log('👤 Criando usuário admin...');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Verificar se já existe
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', 'admin@chatbot.com')
            .single();
        
        if (existing) {
            console.log('⚠️  Usuário admin já existe!');
        } else {
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    email: 'admin@chatbot.com',
                    password: hashedPassword,
                    name: 'Administrador',
                    phone: null
                });
            
            if (insertError) {
                console.log('⚠️  Erro ao criar usuário admin:', insertError.message);
                console.log('   (Pode ser que as tabelas ainda não existam)');
                console.log('   Execute o schema.sql primeiro!');
            } else {
                console.log('✅ Usuário admin criado!');
                console.log('   Email: admin@chatbot.com');
                console.log('   Senha: admin123');
            }
        }
        
        console.log('');
        console.log('✅ Configuração concluída!');
        console.log('');
        console.log('📝 Variáveis para adicionar no Railway:');
        console.log('   SUPABASE_URL=' + SUPABASE_URL);
        console.log('   SUPABASE_ANON_KEY=' + SUPABASE_ANON_KEY);
        console.log('   JWT_SECRET=' + (process.env.JWT_SECRET || 'sua-chave-secreta-forte'));
        console.log('');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.log('');
        console.log('💡 Certifique-se de:');
        console.log('   1. Executar o schema.sql no SQL Editor do Supabase');
        console.log('   2. A anon key está correta');
        console.log('');
    }
}

configureSupabase();

