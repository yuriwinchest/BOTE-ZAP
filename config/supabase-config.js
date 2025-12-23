/**
 * Configuração do Supabase para BOTE-ZAP
 * 
 * Projeto encontrado: bote-atendimentos.zap
 * URL: https://pxyekqpcgjwaztummzvh.supabase.co
 */

module.exports = {
    // URL do projeto Supabase
    SUPABASE_URL: 'https://pxyekqpcgjwaztummzvh.supabase.co',
    
    // Access Token (para operações administrativas)
    SUPABASE_ACCESS_TOKEN: 'sbp_v0_9a534b668401ddf2bba66778f2cafc99cd9d4832',
    
    // ANON KEY - PRECISA SER FORNECIDA
    // Encontre em: Dashboard > Settings > API > anon public
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'COLE_A_ANON_KEY_AQUI',
    
    // JWT Secret
    JWT_SECRET: process.env.JWT_SECRET || 'seu-secret-key-forte-aqui-mude-em-producao'
};

