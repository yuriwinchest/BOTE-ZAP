/**
 * Script para configurar Supabase automaticamente
 * Tenta obter anon key e criar tabelas via API
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://pxyekqpcgjwaztummzvh.supabase.co';
const ACCESS_TOKEN = 'sbp_v0_9a534b668401ddf2bba66778f2cafc99cd9d4832';

async function getAnonKey() {
    return new Promise((resolve, reject) => {
        // Tentar obter via API de projetos
        const options = {
            hostname: 'api.supabase.com',
            path: '/v1/projects/pxyekqpcgjwaztummzvh/api-keys',
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
                    const keys = JSON.parse(data);
                    // Procurar pela anon key
                    const anonKey = keys.find(k => k.name === 'anon' || k.name === 'anon_key' || k.tags?.includes('anon'));
                    if (anonKey) {
                        resolve(anonKey.api_key);
                    } else {
                        // Tentar pegar a primeira key que parecer ser anon
                        const firstKey = keys[0];
                        if (firstKey && firstKey.api_key) {
                            resolve(firstKey.api_key);
                        } else {
                            reject(new Error('Anon key não encontrada'));
                        }
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

async function createTablesViaClient(supabase) {
    console.log('📋 Criando tabelas via cliente Supabase...');
    
    // Como não podemos executar SQL diretamente, vamos tentar criar as tabelas
    // usando operações que falham se não existirem, o que nos dirá se precisamos criar
    
    try {
        // Testar se tabela users existe
        const { error: usersError } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (usersError && usersError.code === 'PGRST116') {
            console.log('⚠️  Tabelas não existem ainda.');
            console.log('   Execute o SQL no SQL Editor do Supabase:');
            console.log('   https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql');
            console.log('');
            console.log('   Ou execute: node database/create-admin-user.js (após criar tabelas)');
            return false;
        }
        
        console.log('✅ Tabelas já existem!');
        return true;
    } catch (error) {
        console.log('⚠️  Erro ao verificar tabelas:', error.message);
        return false;
    }
}

async function createAdminUser(supabase) {
    try {
        // Verificar se já existe
        const { data: existing } = await supabase
            .from('users')
            .select('id')
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
        return false;
    }
}

async function main() {
    console.log('');
    console.log('🚀 Configuração Automática do Supabase');
    console.log('============================================');
    console.log('');
    
    try {
        // Tentar obter anon key
        console.log('🔑 Tentando obter ANON KEY...');
        let anonKey;
        
        try {
            anonKey = await getAnonKey();
            console.log('✅ ANON KEY obtida via API!');
            // SEGURANÇA: Não exibir chave, mesmo parcialmente
            console.log('');
        } catch (error) {
            console.log('⚠️  Não foi possível obter ANON KEY via API.');
            console.log('   Você precisará fornecer manualmente.');
            console.log('');
            console.log('📝 Para obter a ANON KEY:');
            console.log('   1. Acesse: https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/settings/api');
            console.log('   2. Copie a chave "anon" "public"');
            console.log('   3. Execute: SUPABASE_ANON_KEY=sua-chave node scripts/auto-setup-supabase.js');
            console.log('');
            return;
        }
        
        // Criar cliente Supabase
        const supabase = createClient(SUPABASE_URL, anonKey);
        
        // Verificar/criar tabelas
        const tablesExist = await createTablesViaClient(supabase);
        
        if (tablesExist) {
            // Criar usuário admin
            await createAdminUser(supabase);
            
            console.log('');
            console.log('✅ Configuração concluída!');
            console.log('');
        console.log('📝 Variáveis para adicionar no Railway:');
        console.log('   SUPABASE_URL=<configure-no-railway>');
        console.log('   SUPABASE_ANON_KEY=<configure-no-railway>');
        console.log('   JWT_SECRET=<configure-chave-forte>');
        console.log('');
        console.log('⚠️  SEGURANÇA: Configure as variáveis no Railway, não exponha as chaves!');
            console.log('');
            
            // Salvar em arquivo temporário
            const fs = require('fs');
            const path = require('path');
            const envContent = `SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${anonKey}
JWT_SECRET=${process.env.JWT_SECRET || 'sua-chave-secreta-forte'}
`;
            
            fs.writeFileSync(path.join(__dirname, '../.env.supabase'), envContent);
            console.log('💾 Credenciais salvas em: bot/.env.supabase');
            console.log('');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.log('');
        console.log('💡 Solução alternativa:');
        console.log('   1. Execute o schema.sql no SQL Editor do Supabase');
        console.log('   2. Obtenha a ANON KEY manualmente');
        console.log('   3. Configure as variáveis no Railway');
    }
}

main();

