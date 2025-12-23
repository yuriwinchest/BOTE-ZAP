/**
 * Middleware de Segurança
 * Proteções contra ataques comuns
 */

const rateLimit = new Map(); // Rate limiting simples (em produção, use Redis)

/**
 * Rate limiting básico
 */
function rateLimiter(maxRequests = 10, windowMs = 60000) {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        if (!rateLimit.has(ip)) {
            rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        const record = rateLimit.get(ip);
        
        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + windowMs;
            return next();
        }
        
        if (record.count >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Muitas requisições. Tente novamente mais tarde.'
            });
        }
        
        record.count++;
        next();
    };
}

/**
 * Sanitiza headers de requisição
 */
function sanitizeHeaders(req, res, next) {
    // Remover headers potencialmente perigosos
    delete req.headers['x-forwarded-host'];
    delete req.headers['x-original-url'];
    
    next();
}

/**
 * Valida Content-Type
 */
function validateContentType(req, res, next) {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
                success: false,
                message: 'Content-Type deve ser application/json'
            });
        }
    }
    next();
}

/**
 * Limita tamanho do body
 */
function limitBodySize(maxSize = 1024 * 1024) { // 1MB
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        if (contentLength > maxSize) {
            return res.status(413).json({
                success: false,
                message: 'Payload muito grande'
            });
        }
        next();
    };
}

/**
 * Limpa rate limit antigo periodicamente
 */
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimit.entries()) {
        if (now > record.resetTime) {
            rateLimit.delete(ip);
        }
    }
}, 60000); // Limpar a cada minuto

module.exports = {
    rateLimiter,
    sanitizeHeaders,
    validateContentType,
    limitBodySize
};

