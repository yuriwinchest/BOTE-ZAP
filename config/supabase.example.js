// ============================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================
// 
// INSTRUÇÕES:
// 1. Copie este arquivo para .env na raiz do projeto
// 2. Preencha com suas credenciais do Supabase
// 3. OU configure as variáveis de ambiente no Railway
//
// ============================================

module.exports = {
    // URL do seu projeto Supabase
    // Exemplo: https://xxxxxxxxxxxxx.supabase.co
    SUPABASE_URL: 'https://seu-projeto.supabase.co',
    
    // Chave anônima (anon key) do Supabase
    // Encontre em: Settings > API > anon public
    SUPABASE_ANON_KEY: 'sua-chave-anon-aqui',
    
    // Chave secreta para JWT (mude em produção!)
    JWT_SECRET: 'seu-secret-key-forte-aqui-mude-em-producao'
};

