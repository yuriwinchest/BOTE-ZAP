const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateEmail, validatePassword, validateName, validatePhone, validateToken, ValidationError } = require('../utils/validation');

// Configuração do Supabase - SEGURANÇA: Apenas variáveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

// Verificar se as variáveis estão configuradas (OBRIGATÓRIO)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE_URL e SUPABASE_ANON_KEY devem estar configuradas via variáveis de ambiente!');
    throw new Error('Configuração do Supabase não encontrada');
}

if (!JWT_SECRET || JWT_SECRET === 'seu-secret-key-aqui-mude-em-producao') {
    console.error('❌ JWT_SECRET deve estar configurado e ser uma chave forte!');
    throw new Error('JWT_SECRET não configurado corretamente');
}

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class SupabaseAuthService {
    /**
     * Faz login do usuário
     */
    async login(email, password) {
        try {
            // VALIDAÇÃO DE SEGURANÇA: Validar e sanitizar inputs
            email = validateEmail(email);
            password = validatePassword(password);
            
            // Buscar usuário no Supabase (PostgREST protege contra SQL injection)
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            
            if (error || !user) {
                return {
                    success: false,
                    message: 'Email ou senha incorretos'
                };
            }
            
            // Verificar senha
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Email ou senha incorretos'
                };
            }
            
            // Gerar token JWT
            const expiresIn = '7d';
            const token = jwt.sign(
                { 
                    userId: user.id,
                    email: user.email
                },
                JWT_SECRET,
                { expiresIn }
            );
            
            // Calcular data de expiração
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            // Salvar token no banco
            const { error: tokenError } = await supabase
                .from('active_tokens')
                .insert({
                    token: token,
                    user_id: user.id,
                    expires_at: expiresAt.toISOString()
                });
            
            if (tokenError) {
                // Log apenas em desenvolvimento
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Erro ao salvar token:', tokenError.message);
                }
            }
            
            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone
                },
                token: token
            };
        } catch (error) {
            // Não expor detalhes do erro em produção
            if (error instanceof ValidationError) {
                return {
                    success: false,
                    message: error.message
                };
            }
            // Log apenas em desenvolvimento
            if (process.env.NODE_ENV !== 'production') {
                console.error('Erro no login:', error.message);
            }
            return {
                success: false,
                message: 'Erro ao fazer login'
            };
        }
    }
    
    /**
     * Registra um novo usuário
     */
    async register(email, password, name, phone = null) {
        try {
            // VALIDAÇÃO DE SEGURANÇA: Validar e sanitizar todos os inputs
            email = validateEmail(email);
            password = validatePassword(password);
            name = validateName(name);
            phone = phone ? validatePhone(phone) : null;
            
            // Verificar se email já existe
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();
            
            if (existingUser) {
                return {
                    success: false,
                    message: 'Este email já está cadastrado'
                };
            }
            
            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Criar novo usuário
            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    email: email,
                    password: hashedPassword,
                    name: name,
                    phone: phone
                })
                .select()
                .single();
            
            if (error) {
                console.error('Erro ao criar usuário:', error);
                return {
                    success: false,
                    message: 'Erro ao criar usuário'
                };
            }
            
            // Gerar token JWT
            const expiresIn = '7d';
            const token = jwt.sign(
                { 
                    userId: newUser.id,
                    email: newUser.email
                },
                JWT_SECRET,
                { expiresIn }
            );
            
            // Calcular data de expiração
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            // Salvar token no banco
            await supabase
                .from('active_tokens')
                .insert({
                    token: token,
                    user_id: newUser.id,
                    expires_at: expiresAt.toISOString()
                });
            
            return {
                success: true,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    phone: newUser.phone
                },
                token: token
            };
        } catch (error) {
            // Não expor detalhes do erro em produção
            if (error instanceof ValidationError) {
                return {
                    success: false,
                    message: error.message
                };
            }
            // Log apenas em desenvolvimento
            if (process.env.NODE_ENV !== 'production') {
                console.error('Erro no registro:', error.message);
            }
            return {
                success: false,
                message: 'Erro ao criar usuário'
            };
        }
    }
    
    /**
     * Faz logout do usuário
     */
    async logout(token) {
        try {
            // VALIDAÇÃO DE SEGURANÇA: Validar token
            token = validateToken(token);
            
            // Remover token do banco
            const { error } = await supabase
                .from('active_tokens')
                .delete()
                .eq('token', token);
            
            if (error) {
                // Log apenas em desenvolvimento
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Erro ao remover token:', error.message);
                }
            }
            
            return { success: true };
        } catch (error) {
            // Log apenas em desenvolvimento
            if (process.env.NODE_ENV !== 'production') {
                console.error('Erro no logout:', error.message);
            }
            return { success: false };
        }
    }
    
    /**
     * Verifica se o token é válido
     */
    async verifyToken(token) {
        try {
            // VALIDAÇÃO DE SEGURANÇA: Validar token
            token = validateToken(token);
            
            // Verificar token no banco
            const { data: tokenData, error: tokenError } = await supabase
                .from('active_tokens')
                .select('*, users(*)')
                .eq('token', token)
                .single();
            
            if (tokenError || !tokenData) {
                return {
                    success: false,
                    message: 'Token inválido ou expirado'
                };
            }
            
            // Verificar se token expirou
            const expiresAt = new Date(tokenData.expires_at);
            if (expiresAt < new Date()) {
                // Remover token expirado
                await supabase
                    .from('active_tokens')
                    .delete()
                    .eq('token', token);
                
                return {
                    success: false,
                    message: 'Token expirado'
                };
            }
            
            // Verificar assinatura JWT
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Buscar usuário
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id, email, name, phone')
                .eq('id', decoded.userId)
                .single();
            
            if (userError || !user) {
                return {
                    success: false,
                    message: 'Usuário não encontrado'
                };
            }
            
            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone
                }
            };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                // Remover token expirado
                await supabase
                    .from('active_tokens')
                    .delete()
                    .eq('token', token);
                
                return {
                    success: false,
                    message: 'Token expirado'
                };
            }
            
            return {
                success: false,
                message: 'Token inválido'
            };
        }
    }
    
    /**
     * Limpar tokens expirados (pode ser chamado periodicamente)
     */
    async cleanupExpiredTokens() {
        try {
            const { error } = await supabase
                .from('active_tokens')
                .delete()
                .lt('expires_at', new Date().toISOString());
            
            if (error) {
                // Log apenas em desenvolvimento
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Erro ao limpar tokens expirados:', error.message);
                }
            }
        } catch (error) {
            // Log apenas em desenvolvimento
            if (process.env.NODE_ENV !== 'production') {
                console.error('Erro ao limpar tokens:', error.message);
            }
        }
    }
}

module.exports = new SupabaseAuthService();

