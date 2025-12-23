// Configurar variáveis de ambiente para Puppeteer (whatsapp-web.js)
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.PUPPETEER_EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const qrcode = require('qrcode');
// Auto-detecta Supabase ou usa banco em memória
const AuthService = require('./services/auth');
const BotManager = require('./services/bot-manager');
const { requireAuth } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Permite todas as origens (ajuste em produção)
        methods: ["GET", "POST"]
    }
});

// Servir arquivos estáticos
app.use(express.static('public'));

// Middleware de segurança
const security = require('./middleware/security');
app.use(security.sanitizeHeaders);
app.use(security.validateContentType);
app.use(security.limitBodySize(1024 * 1024)); // 1MB max

// Rate limiting para APIs sensíveis
app.use('/api/login', security.rateLimiter(5, 60000)); // 5 tentativas por minuto
app.use('/api/register', security.rateLimiter(3, 60000)); // 3 registros por minuto

// Middleware para parsing JSON
app.use(express.json({ limit: '1mb' }));

// ============================================
// MULTI-TENANCY: Cada usuário tem seu próprio bot
// ============================================
// O BotManager gerencia múltiplos bots simultaneamente
// Cada usuário só acessa seu próprio bot

// ============================================
// ROTAS DE PÁGINAS
// ============================================

// Healthcheck para Railway (deve responder rapidamente)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString()
    });
});

// Root endpoint simples para verificação
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// Rota principal - redireciona para admin se bot não iniciado
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Página de administração
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Rota de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Página de cadastro
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// ============================================
// APIs DE AUTENTICAÇÃO
// ============================================

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios'
            });
        }

        const result = await AuthService.login(email, password);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Login realizado com sucesso!',
                user: result.user,
                token: result.token,
                redirect: '/admin'
            });
        } else {
            res.status(401).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, senha e nome são obrigatórios'
            });
        }

        const result = await AuthService.register(email, password, name, phone);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Usuário criado com sucesso!',
                user: result.user,
                token: result.token,
                redirect: '/admin'
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

app.post('/api/logout', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            await AuthService.logout(token);
        }
        
        res.json({
            success: true,
            message: 'Logout realizado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

app.get('/api/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Token não fornecido' });
        }
        
        const result = await AuthService.verifyToken(token);
        if (result.success) {
            res.json({
                success: true,
                user: result.user
            });
        } else {
            res.status(401).json({ success: false, message: 'Token inválido' });
        }
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token inválido' });
    }
});

// ============================================
// APIs DO BOT (Multi-Tenancy)
// ============================================

// Status do bot do usuário logado
app.get('/api/bot/status', requireAuth, (req, res) => {
    const userId = req.user.id;
    const status = BotManager.getBotStatus(userId);
    
    res.json({
        success: true,
        ...status
    });
});

// Iniciar bot do usuário logado
app.post('/api/bot/start', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { config, settings } = req.body;
        
        const result = await BotManager.initializeBot(userId, config, settings);
        
        if (result.success) {
            res.json({
                success: true,
                message: result.message
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao iniciar bot'
        });
    }
});

// Parar bot do usuário logado
app.post('/api/bot/stop', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await BotManager.stopBot(userId);
        
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao parar bot'
        });
    }
});

// Atualizar configurações do bot
app.post('/api/bot/config', requireAuth, (req, res) => {
    const userId = req.user.id;
    const result = BotManager.updateBotConfig(userId, req.body);
    res.json(result);
});

// Atualizar settings do bot
app.post('/api/bot/settings', requireAuth, (req, res) => {
    const userId = req.user.id;
    const result = BotManager.updateBotSettings(userId, req.body);
    res.json(result);
});

// ============================================
// FUNÇÕES DO WHATSAPP (Removidas - agora usa BotManager)
// ============================================
// As funções agora estão no BotManager para suportar multi-tenancy
// Cada usuário tem seu próprio bot isolado

// ============================================
// SOCKET.IO - COMUNICAÇÃO EM TEMPO REAL (Multi-Tenancy)
// ============================================

// Configurar BotManager com Socket.IO
BotManager.setSocketIO(io);

io.on('connection', async (socket) => {
    console.log('👤 Cliente conectado ao servidor web');
    
    // Autenticar usuário via token
    socket.on('authenticate', async (data) => {
        try {
            const { token } = data;
            if (!token) {
                socket.emit('auth_error', { message: 'Token não fornecido' });
                return;
            }
            
            const result = await AuthService.verifyToken(token);
            if (!result.success) {
                socket.emit('auth_error', { message: 'Token inválido' });
                return;
            }
            
            // Associar socket ao usuário
            const userId = result.user.id;
            socket.userId = userId;
            socket.join(`user_${userId}`);
            
            // Enviar status do bot do usuário
            const status = BotManager.getBotStatus(userId);
            socket.emit('status', {
                success: true,
                ...status
            });
            
            socket.emit('authenticated', { user: result.user });
        } catch (error) {
            socket.emit('auth_error', { message: 'Erro na autenticação' });
        }
    });
    
    // Iniciar bot (apenas se autenticado)
    socket.on('start_bot', async (data) => {
        if (!socket.userId) {
            socket.emit('error', { message: 'Não autenticado' });
            return;
        }
        
        const userId = socket.userId;
        const { config, settings } = data || {};
        
        const result = await BotManager.initializeBot(userId, config, settings);
        socket.emit('bot_started', result);
    });
    
    // Parar bot
    socket.on('stop_bot', async () => {
        if (!socket.userId) {
            socket.emit('error', { message: 'Não autenticado' });
            return;
        }
        
        const userId = socket.userId;
        const result = await BotManager.stopBot(userId);
        socket.emit('bot_stopped', result);
    });
    
    // Atualizar configurações
    socket.on('update_config', (config) => {
        if (!socket.userId) {
            socket.emit('error', { message: 'Não autenticado' });
            return;
        }
        
        const userId = socket.userId;
        const result = BotManager.updateBotConfig(userId, config);
        socket.emit('config_updated', result);
    });
    
    // Atualizar settings
    socket.on('update_settings', (settings) => {
        if (!socket.userId) {
            socket.emit('error', { message: 'Não autenticado' });
            return;
        }
        
        const userId = socket.userId;
        const result = BotManager.updateBotSettings(userId, settings);
        socket.emit('settings_updated', result);
    });
    
    socket.on('disconnect', () => {
        console.log('👤 Cliente desconectado do servidor web');
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

async function startServer() {
    try {
        console.log('');
        console.log('============================================');
        console.log('   🤖 WHATSAPP BOT - PAINEL ADMINISTRATIVO');
        console.log('============================================');
        console.log('');
        
        const PORT = process.env.PORT || 3000;
        const HOST = process.env.HOST || '0.0.0.0'; // Railway precisa de 0.0.0.0
        
        // Garantir que o servidor escute corretamente
        server.listen(PORT, HOST, () => {
            console.log(`🚀 Servidor rodando em: http://${HOST}:${PORT}`);
            console.log(`✅ Servidor escutando na porta ${PORT}`);
            console.log('');
            console.log('📍 Páginas disponíveis:');
            console.log(`   ⚙️  Admin:     http://localhost:${PORT}/admin`);
            console.log(`   📱 Dashboard: http://localhost:${PORT}`);
            console.log(`   🔐 Login:     http://localhost:${PORT}/login`);
            console.log(`   ❤️  Health:    http://localhost:${PORT}/health`);
            console.log('');
            console.log('🔐 Credenciais de acesso:');
            console.log('   Email: admin@chatbot.com');
            console.log('   Senha: admin123');
            console.log('');
            console.log('⚠️  O bot NÃO inicia automaticamente.');
            console.log('   Acesse /admin para configurar e iniciar o bot.');
            console.log('');
            console.log('============================================');
        });
        
        // Keep-alive: garantir que o servidor não morra
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;
        
        // Tratamento de erros para manter o servidor rodando
        server.on('error', (error) => {
            console.error('❌ Erro no servidor:', error);
        });
        
    } catch (error) {
        console.error('❌ Erro ao inicializar servidor:', error);
        process.exit(1);
    }
}

// Tratamento global de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    // Não encerra o processo, apenas loga o erro
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    // Não encerra o processo, apenas loga o erro
});

// Manter o processo vivo
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM recebido, encerrando graciosamente...');
    server.close(() => {
        console.log('✅ Servidor encerrado');
        process.exit(0);
    });
});

startServer();
