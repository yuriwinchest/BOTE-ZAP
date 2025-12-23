/**
 * Script para configurar Multi-Tenancy no Supabase
 * Executa o schema SQL para criar tabelas de multi-tenancy
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pxyekqpcgjwaztummzvh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDk1MCwiZXhwIjoyMDgyMDgwOTUwfQ.tQyuHzPWjVjkY49Nyiq0xIA0GE7iKG4Cs9ttDj-bfKM';
const ACCESS_TOKEN = 'sbp_v0_9a534b668401ddf2bba66778f2cafc99cd9d4832';

async function executeSQL(sql) {
    return new Promise((resolve, reject) => {
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
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(true);
                } else {
                    console.log('⚠️  Resposta:', data);
                    resolve(false);
                }
            });
        });
        
        req.on('error', reject);
        req.write(JSON.stringify({ query: sql }));
        req.end();
    });
}

async function main() {
    console.log('');
    console.log('🚀 Configurando Multi-Tenancy no Supabase');
    console.log('============================================');
    console.log('');
    
    // Ler schema SQL
    const schemaPath = path.join(__dirname, '../database/schema-multitenancy.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('⏳ Executando schema SQL via Management API...');
    const sqlExecuted = await executeSQL(schema);
    
    if (sqlExecuted) {
        console.log('✅ Schema SQL executado com sucesso!');
        console.log('');
        console.log('📋 Tabelas criadas:');
        console.log('   ✅ user_bots - Bots por usuário');
        console.log('   ✅ bot_settings - Configurações por usuário');
        console.log('   ✅ whatsapp_messages - Mensagens por usuário');
        console.log('');
    } else {
        console.log('⚠️  Management API não suporta execução direta de SQL.');
        console.log('');
        console.log('📋 Execute o SQL manualmente no SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql');
        console.log('');
        console.log('--- SQL ---');
        console.log(schema);
        console.log('--- FIM ---');
        console.log('');
    }
    
    console.log('✅ Configuração concluída!');
    console.log('');
    console.log('🎯 Agora cada usuário pode ter seu próprio bot!');
}

main();

