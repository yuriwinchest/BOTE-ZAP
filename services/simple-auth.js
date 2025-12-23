const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Chave secreta para JWT (em produção, use variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-key-aqui-mude-em-producao';

// Banco de dados em memória (para desenvolvimento)
let users = [
    {
        id: 1,
        email: 'admin@chatbot.com',
        password: bcrypt.hashSync('admin123', 10), // Senha: admin123
        name: 'Administrador',
        phone: null,
        createdAt: new Date()
    }
];

// Tokens ativos (em produção, use Redis ou banco de dados)
const activeTokens = new Set();

class AuthService {
    /**
     * Faz login do usuário
     */
    async login(email, password) {
        try {
            // Buscar usuário
            const user = users.find(u => u.email === email);
            
            if (!user) {
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
            const token = jwt.sign(
                { 
                    userId: user.id,
                    email: user.email
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            // Adicionar token à lista de tokens ativos
            activeTokens.add(token);
            
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
            console.error('Erro no login:', error);
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
            // Verificar se email já existe
            const existingUser = users.find(u => u.email === email);
            
            if (existingUser) {
                return {
                    success: false,
                    message: 'Este email já está cadastrado'
                };
            }
            
            // Validar senha
            if (password.length < 6) {
                return {
                    success: false,
                    message: 'A senha deve ter no mínimo 6 caracteres'
                };
            }
            
            // Criar novo usuário
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = {
                id: users.length + 1,
                email: email,
                password: hashedPassword,
                name: name,
                phone: phone,
                createdAt: new Date()
            };
            
            users.push(newUser);
            
            // Gerar token JWT
            const token = jwt.sign(
                { 
                    userId: newUser.id,
                    email: newUser.email
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            // Adicionar token à lista de tokens ativos
            activeTokens.add(token);
            
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
            console.error('Erro no registro:', error);
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
            activeTokens.delete(token);
            return { success: true };
        } catch (error) {
            console.error('Erro no logout:', error);
            return { success: false };
        }
    }
    
    /**
     * Verifica se o token é válido
     */
    async verifyToken(token) {
        try {
            // Verificar se token está na lista de tokens ativos
            if (!activeTokens.has(token)) {
                return {
                    success: false,
                    message: 'Token inválido ou expirado'
                };
            }
            
            // Verificar assinatura JWT
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Buscar usuário
            const user = users.find(u => u.id === decoded.userId);
            
            if (!user) {
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
                activeTokens.delete(token);
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
}

module.exports = new AuthService();


