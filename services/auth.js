/**
 * Serviço de Autenticação - Auto-detecta Supabase ou Memória
 * 
 * Se SUPABASE_URL e SUPABASE_ANON_KEY estiverem configurados,
 * usa Supabase. Caso contrário, usa banco em memória.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let AuthService;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    // Usar Supabase se estiver configurado
    console.log('✅ Usando Supabase para autenticação');
    AuthService = require('./supabase-auth');
} else {
    // Usar banco em memória como fallback
    console.log('⚠️  Supabase não configurado, usando banco em memória');
    console.log('   Para usar Supabase, configure SUPABASE_URL e SUPABASE_ANON_KEY');
    AuthService = require('./simple-auth');
}

module.exports = AuthService;

