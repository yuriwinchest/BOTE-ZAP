/**
 * Utilitários de Validação e Sanitização
 * Proteção contra SQL Injection, XSS e outros ataques
 */

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * Valida e sanitiza email
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        throw new ValidationError('Email é obrigatório');
    }
    
    // Remover espaços e converter para lowercase
    email = email.trim().toLowerCase();
    
    // Validar formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ValidationError('Email inválido');
    }
    
    // Limitar tamanho
    if (email.length > 255) {
        throw new ValidationError('Email muito longo');
    }
    
    // Proteção contra SQL injection (embora Supabase use PostgREST, é bom validar)
    if (/['";\\]/.test(email)) {
        throw new ValidationError('Email contém caracteres inválidos');
    }
    
    return email;
}

/**
 * Valida e sanitiza senha
 */
function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        throw new ValidationError('Senha é obrigatória');
    }
    
    // Remover espaços no início e fim
    password = password.trim();
    
    // Validar comprimento mínimo
    if (password.length < 6) {
        throw new ValidationError('Senha deve ter no mínimo 6 caracteres');
    }
    
    // Limitar tamanho máximo
    if (password.length > 128) {
        throw new ValidationError('Senha muito longa');
    }
    
    return password;
}

/**
 * Valida e sanitiza nome
 */
function validateName(name) {
    if (!name || typeof name !== 'string') {
        throw new ValidationError('Nome é obrigatório');
    }
    
    // Remover espaços extras
    name = name.trim();
    
    // Validar comprimento
    if (name.length < 2) {
        throw new ValidationError('Nome deve ter no mínimo 2 caracteres');
    }
    
    if (name.length > 255) {
        throw new ValidationError('Nome muito longo');
    }
    
    // Remover caracteres perigosos
    name = name.replace(/[<>'"\\]/g, '');
    
    return name;
}

/**
 * Valida e sanitiza telefone
 */
function validatePhone(phone) {
    if (!phone) {
        return null; // Telefone é opcional
    }
    
    if (typeof phone !== 'string') {
        throw new ValidationError('Telefone deve ser uma string');
    }
    
    // Remover espaços e caracteres não numéricos (exceto +)
    phone = phone.trim().replace(/[^\d+]/g, '');
    
    // Validar comprimento
    if (phone.length > 20) {
        throw new ValidationError('Telefone muito longo');
    }
    
    // Validar formato básico
    if (phone.length < 8) {
        throw new ValidationError('Telefone inválido');
    }
    
    return phone;
}

/**
 * Valida token JWT
 */
function validateToken(token) {
    if (!token || typeof token !== 'string') {
        throw new ValidationError('Token é obrigatório');
    }
    
    // Validar formato básico de JWT (3 partes separadas por ponto)
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new ValidationError('Token inválido');
    }
    
    // Limitar tamanho
    if (token.length > 2000) {
        throw new ValidationError('Token muito longo');
    }
    
    return token;
}

/**
 * Sanitiza string genérica (proteção XSS)
 */
function sanitizeString(str, maxLength = 1000) {
    if (!str || typeof str !== 'string') {
        return '';
    }
    
    // Remover tags HTML perigosas
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    str = str.replace(/<[^>]+>/g, '');
    
    // Limitar tamanho
    if (str.length > maxLength) {
        str = str.substring(0, maxLength);
    }
    
    return str.trim();
}

/**
 * Valida número de telefone do WhatsApp
 */
function validateWhatsAppNumber(number) {
    if (!number || typeof number !== 'string') {
        throw new ValidationError('Número é obrigatório');
    }
    
    // Remover caracteres não numéricos
    number = number.replace(/\D/g, '');
    
    // Validar comprimento (formato internacional)
    if (number.length < 10 || number.length > 15) {
        throw new ValidationError('Número de telefone inválido');
    }
    
    return number;
}

module.exports = {
    ValidationError,
    validateEmail,
    validatePassword,
    validateName,
    validatePhone,
    validateToken,
    sanitizeString,
    validateWhatsAppNumber
};

