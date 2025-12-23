/**
 * Script para obter informações do Supabase usando Access Token
 */

const https = require('https');

const ACCESS_TOKEN = 'sbp_v0_9a534b668401ddf2bba66778f2cafc99cd9d4832';

async function getSupabaseInfo() {
    console.log('🔍 Tentando obter informações do Supabase...');
    console.log('');
    
    // Tentar obter projetos do usuário
    const options = {
        hostname: 'api.supabase.com',
        path: '/v1/projects',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const projects = JSON.parse(data);
                    console.log('✅ Projetos encontrados:');
                    console.log('');
                    
                    projects.forEach((project, index) => {
                        console.log(`Projeto ${index + 1}:`);
                        console.log(`  ID: ${project.id}`);
                        console.log(`  Nome: ${project.name}`);
                        console.log(`  URL: https://${project.ref}.supabase.co`);
                        console.log(`  Região: ${project.region}`);
                        console.log('');
                    });
                    
                    if (projects.length > 0) {
                        console.log('📝 Use a URL acima como SUPABASE_URL');
                        console.log('📝 A anon key você encontra em: Dashboard > Settings > API');
                        console.log('');
                    }
                    
                    resolve(projects);
                } catch (error) {
                    console.error('❌ Erro ao processar resposta:', error.message);
                    console.log('');
                    console.log('💡 Dica: Acesse https://supabase.com/dashboard');
                    console.log('   Vá em Settings > API e copie:');
                    console.log('   - Project URL (SUPABASE_URL)');
                    console.log('   - anon public (SUPABASE_ANON_KEY)');
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Erro na requisição:', error.message);
            console.log('');
            console.log('💡 Dica: Acesse https://supabase.com/dashboard');
            console.log('   Vá em Settings > API e copie:');
            console.log('   - Project URL (SUPABASE_URL)');
            console.log('   - anon public (SUPABASE_ANON_KEY)');
            reject(error);
        });
        
        req.end();
    });
}

getSupabaseInfo().catch(() => {
    process.exit(1);
});

