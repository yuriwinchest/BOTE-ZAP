/**
 * Middleware de Autenticação
 * Verifica token JWT e adiciona user ao request
 */

const AuthService = require('../services/auth');

/**
 * Middleware para verificar autenticação
 */
async function requireAuth(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }
        
        const result = await AuthService.verifyToken(token);
        
        if (!result.success) {
            return res.status(401).json({
                success: false,
                message: result.message || 'Token inválido'
            });
        }
        
        // Adicionar usuário ao request
        req.user = result.user;
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar autenticação'
        });
    }
}

/**
 * Middleware opcional (não bloqueia se não tiver token)
 */
async function optionalAuth(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (token) {
            const result = await AuthService.verifyToken(token);
            if (result.success) {
                req.user = result.user;
            }
        }
        
        next();
    } catch (error) {
        next();
    }
}

module.exports = {
    requireAuth,
    optionalAuth
};

