const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const qrcode = require('qrcode');
const { Client } = require('whatsapp-web.js');
const AuthService = require('./services/simple-auth');

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

// Middleware para parsing JSON
app.use(express.json());

// ============================================
// VARIÁVEIS DE ESTADO DO BOT
// ============================================
let client = null;
let qrCodeData = null;
let isConnected = false;
let botStarted = false;

// Configurações do bot (podem ser alteradas via admin)
let botConfig = {
    botName: 'Assistente Virtual',
    companyName: 'Minha Empresa',
    welcomeMessage: 'Olá! Sou o assistente virtual. Como posso ajudá-lo?',
    websiteUrl: 'https://site.com'
};

let botSettings = {
    autoReply: true,
    showTyping: true,
    messageDelay: 3,
    businessHours: false
};

// ============================================
// ROTAS DE PÁGINAS
// ============================================

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
// APIs DO BOT
// ============================================

app.get('/api/bot/status', (req, res) => {
    res.json({
        started: botStarted,
        connected: isConnected,
        config: botConfig,
        settings: botSettings
    });
});

app.post('/api/bot/config', (req, res) => {
    botConfig = { ...botConfig, ...req.body };
    res.json({ success: true, config: botConfig });
});

app.post('/api/bot/settings', (req, res) => {
    botSettings = { ...botSettings, ...req.body };
    res.json({ success: true, settings: botSettings });
});

// ============================================
// FUNÇÕES DO WHATSAPP
// ============================================

function initializeWhatsApp() {
    if (client) {
        console.log('⚠️ Cliente WhatsApp já existe');
        return;
    }
    
    console.log('🔄 Inicializando cliente WhatsApp...');
    
    client = new Client({
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });
    
    // Evento quando QR Code é gerado
    client.on('qr', async (qr) => {
        console.log('📱 QR Code gerado!');
        try {
            const qrCodeImage = await qrcode.toDataURL(qr);
            qrCodeData = qrCodeImage;
            io.emit('qr', qrCodeImage);
            require('qrcode-terminal').generate(qr, {small: true});
        } catch (err) {
            console.error('❌ Erro ao gerar QR Code:', err);
        }
    });
    
    // Evento quando conectado
    client.on('ready', () => {
        console.log('✅ WhatsApp conectado com sucesso!');
        isConnected = true;
        qrCodeData = null;
        io.emit('connected', { message: 'WhatsApp conectado com sucesso!' });
    });
    
    // Evento quando desconectado
    client.on('disconnected', (reason) => {
        console.log('❌ WhatsApp desconectado:', reason);
        isConnected = false;
        qrCodeData = null;
        io.emit('disconnected', { message: 'WhatsApp desconectado', reason });
    });
    
    // Evento de autenticação falha
    client.on('auth_failure', (msg) => {
        console.error('❌ Falha na autenticação:', msg);
        io.emit('auth_failure', { message: 'Falha na autenticação' });
    });
    
    // Lógica do chatbot
    client.on('message', handleMessage);
    
    // Inicializar
    client.initialize();
    botStarted = true;
    io.emit('bot_started');
}

async function destroyWhatsApp() {
    if (client) {
        console.log('🔄 Parando cliente WhatsApp...');
        try {
            await client.destroy();
        } catch (err) {
            console.error('Erro ao destruir cliente:', err);
        }
        client = null;
        isConnected = false;
        qrCodeData = null;
        botStarted = false;
        io.emit('bot_stopped');
        console.log('✅ Cliente WhatsApp parado');
    }
}

// Função de delay
const delay = ms => new Promise(res => setTimeout(res, ms));

// Handler de mensagens
async function handleMessage(msg) {
    if (!botSettings.autoReply) return;
    if (!msg.from.endsWith('@c.us')) return;
    
    const delayTime = (botSettings.messageDelay || 3) * 1000;
    
    // Menu principal
    if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola)/i)) {
        const chat = await msg.getChat();
        
        if (botSettings.showTyping) {
            await delay(delayTime);
            await chat.sendStateTyping();
            await delay(delayTime);
        }
        
        const contact = await msg.getContact();
        const name = contact.pushname || 'Cliente';
        
        const welcomeMsg = `Olá! ${name.split(" ")[0]} Sou o ${botConfig.botName} da ${botConfig.companyName}. Como posso ajudá-lo hoje? Por favor, digite uma das opções abaixo:

1 - Como funciona
2 - Valores dos planos
3 - Benefícios
4 - Como aderir
5 - Outras perguntas`;
        
        await client.sendMessage(msg.from, welcomeMsg);
    }

    // Opção 1
    if (msg.body === '1') {
        const chat = await msg.getChat();
        if (botSettings.showTyping) {
            await delay(delayTime);
            await chat.sendStateTyping();
            await delay(delayTime);
        }
        await client.sendMessage(msg.from, `Nosso serviço oferece consultas médicas 24 horas por dia, 7 dias por semana, diretamente pelo WhatsApp.

Não há carência, o que significa que você pode começar a usar nossos serviços imediatamente após a adesão.

Oferecemos atendimento médico ilimitado, receitas e muito mais!`);
        
        await delay(delayTime);
        await client.sendMessage(msg.from, `Link para cadastro: ${botConfig.websiteUrl}`);
    }

    // Opção 2
    if (msg.body === '2') {
        const chat = await msg.getChat();
        if (botSettings.showTyping) {
            await delay(delayTime);
            await chat.sendStateTyping();
            await delay(delayTime);
        }
        await client.sendMessage(msg.from, `*Plano Individual:* R$22,50 por mês.

*Plano Família:* R$39,90 por mês, inclui você mais 3 dependentes.

*Plano TOP Individual:* R$42,50 por mês, com benefícios adicionais.

*Plano TOP Família:* R$79,90 por mês, inclui você mais 3 dependentes.`);
        
        await delay(delayTime);
        await client.sendMessage(msg.from, `Link para cadastro: ${botConfig.websiteUrl}`);
    }

    // Opção 3
    if (msg.body === '3') {
        const chat = await msg.getChat();
        if (botSettings.showTyping) {
            await delay(delayTime);
            await chat.sendStateTyping();
            await delay(delayTime);
        }
        await client.sendMessage(msg.from, `✨ *Benefícios:*

• Sorteio de prêmios todo ano
• Atendimento médico ilimitado 24h por dia
• Receitas de medicamentos
• Acesso a cursos gratuitos
• E muito mais!`);
        
        await delay(delayTime);
        await client.sendMessage(msg.from, `Link para cadastro: ${botConfig.websiteUrl}`);
    }

    // Opção 4
    if (msg.body === '4') {
        const chat = await msg.getChat();
        if (botSettings.showTyping) {
            await delay(delayTime);
            await chat.sendStateTyping();
            await delay(delayTime);
        }
        await client.sendMessage(msg.from, `Você pode aderir aos nossos planos diretamente pelo nosso site ou pelo WhatsApp.

Após a adesão, você terá acesso imediato a todos os benefícios!`);
        
        await delay(delayTime);
        await client.sendMessage(msg.from, `Link para cadastro: ${botConfig.websiteUrl}`);
    }

    // Opção 5
    if (msg.body === '5') {
        const chat = await msg.getChat();
        if (botSettings.showTyping) {
            await delay(delayTime);
            await chat.sendStateTyping();
            await delay(delayTime);
        }
        await client.sendMessage(msg.from, `Se você tiver outras dúvidas ou precisar de mais informações, por favor, fale aqui nesse WhatsApp ou visite nosso site: ${botConfig.websiteUrl}`);
    }
}

// ============================================
// SOCKET.IO - COMUNICAÇÃO EM TEMPO REAL
// ============================================

io.on('connection', (socket) => {
    console.log('👤 Cliente conectado ao servidor web');
    
    // Enviar status atual
    socket.emit('status', { 
        connected: isConnected,
        qrCode: qrCodeData,
        botStarted: botStarted,
        config: botConfig,
        settings: botSettings
    });
    
    // Iniciar bot
    socket.on('start_bot', () => {
        console.log('▶️ Comando: Iniciar bot');
        if (!botStarted) {
            initializeWhatsApp();
        }
    });
    
    // Parar bot
    socket.on('stop_bot', async () => {
        console.log('⏹️ Comando: Parar bot');
        await destroyWhatsApp();
    });
    
    // Reiniciar bot
    socket.on('restart_bot', async () => {
        console.log('🔄 Comando: Reiniciar bot');
        await destroyWhatsApp();
        setTimeout(() => {
            initializeWhatsApp();
        }, 2000);
    });
    
    // Atualizar configurações
    socket.on('update_config', (config) => {
        console.log('⚙️ Atualizando configurações:', config);
        botConfig = { ...botConfig, ...config };
        io.emit('config_updated', botConfig);
    });
    
    // Atualizar settings
    socket.on('update_settings', (settings) => {
        console.log('⚙️ Atualizando settings:', settings);
        botSettings = { ...botSettings, ...settings };
        io.emit('settings_updated', botSettings);
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
        server.listen(PORT, HOST, () => {
            console.log(`🚀 Servidor rodando em: http://${HOST}:${PORT}`);
            console.log('');
            console.log('📍 Páginas disponíveis:');
            console.log(`   ⚙️  Admin:     http://localhost:${PORT}/admin`);
            console.log(`   📱 Dashboard: http://localhost:${PORT}`);
            console.log(`   🔐 Login:     http://localhost:${PORT}/login`);
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
    } catch (error) {
        console.error('❌ Erro ao inicializar servidor:', error);
    }
}

startServer();
