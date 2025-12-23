/**
 * Gerenciador de Bots Multi-Tenancy
 * Cada usuário tem seu próprio bot WhatsApp
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Mapa de bots por usuário: { userId: { client, qrCode, isConnected, config, settings } }
const userBots = new Map();

class BotManager {
    /**
     * Inicializa bot para um usuário
     */
    async initializeBot(userId, config = {}, settings = {}) {
        // Se já existe, não criar novamente
        if (userBots.has(userId)) {
            const bot = userBots.get(userId);
            if (bot.client && bot.isActive) {
                return { success: false, message: 'Bot já está ativo' };
            }
        }
        
        try {
            // Criar diretório de sessão específico para o usuário
            const sessionPath = path.join(__dirname, '..', '.wwebjs_auth', `user_${userId}`);
            if (!fs.existsSync(sessionPath)) {
                fs.mkdirSync(sessionPath, { recursive: true });
            }
            
            // Criar cliente WhatsApp com sessão isolada
            // LocalAuth usa dataPath para isolar sessões por usuário
            const client = new Client({
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                },
                authStrategy: new LocalAuth({
                    clientId: `user_${userId}`, // ID único por usuário
                    dataPath: sessionPath
                })
            });
            
            // Estado do bot
            const botState = {
                client: client,
                userId: userId,
                qrCode: null,
                isConnected: false,
                isActive: false,
                config: {
                    botName: config.botName || 'Meu Bot',
                    companyName: config.companyName || 'Minha Empresa',
                    welcomeMessage: config.welcomeMessage || 'Olá! Como posso ajudá-lo?',
                    websiteUrl: config.websiteUrl || 'https://site.com'
                },
                settings: {
                    autoReply: settings.autoReply !== undefined ? settings.autoReply : true,
                    showTyping: settings.showTyping !== undefined ? settings.showTyping : true,
                    messageDelay: settings.messageDelay || 3,
                    operatingHours: settings.operatingHours || { enabled: false }
                },
                eventHandlers: {}
            };
            
            // Configurar eventos do cliente
            this._setupClientEvents(client, botState);
            
            // Salvar no mapa
            userBots.set(userId, botState);
            
            // Inicializar cliente
            await client.initialize();
            botState.isActive = true;
            
            return { success: true, message: 'Bot iniciado com sucesso' };
        } catch (error) {
            console.error(`Erro ao inicializar bot para usuário ${userId}:`, error);
            return { success: false, message: 'Erro ao iniciar bot' };
        }
    }
    
    /**
     * Configura eventos do cliente WhatsApp
     */
    _setupClientEvents(client, botState) {
        const userId = botState.userId;
        
        // QR Code gerado
        client.on('qr', async (qr) => {
            try {
                const qrCodeImage = await qrcode.toDataURL(qr);
                botState.qrCode = qrCodeImage;
                
                // Emitir apenas para o usuário específico
                if (botState.io) {
                    botState.io.to(`user_${userId}`).emit('qr', qrCodeImage);
                }
                
                console.log(`📱 QR Code gerado para usuário ${userId}`);
            } catch (err) {
                console.error(`Erro ao gerar QR Code para usuário ${userId}:`, err);
            }
        });
        
        // Conectado
        client.on('ready', () => {
            console.log(`✅ WhatsApp conectado para usuário ${userId}`);
            botState.isConnected = true;
            botState.qrCode = null;
            
            if (botState.io) {
                botState.io.to(`user_${userId}`).emit('connected', {
                    message: 'WhatsApp conectado com sucesso!'
                });
            }
            
            // Salvar no banco (se usando Supabase)
            this._saveBotState(userId, botState);
        });
        
        // Desconectado
        client.on('disconnected', (reason) => {
            console.log(`❌ WhatsApp desconectado para usuário ${userId}:`, reason);
            botState.isConnected = false;
            botState.qrCode = null;
            botState.isActive = false;
            
            if (botState.io) {
                botState.io.to(`user_${userId}`).emit('disconnected', {
                    message: 'WhatsApp desconectado',
                    reason: reason
                });
            }
        });
        
        // Falha de autenticação
        client.on('auth_failure', (msg) => {
            console.error(`❌ Falha na autenticação para usuário ${userId}:`, msg);
            
            if (botState.io) {
                botState.io.to(`user_${userId}`).emit('auth_failure', {
                    message: 'Falha na autenticação'
                });
            }
        });
        
        // Mensagens
        client.on('message', (msg) => {
            this._handleMessage(msg, botState);
        });
    }
    
    /**
     * Para bot de um usuário
     */
    async stopBot(userId) {
        const bot = userBots.get(userId);
        if (!bot) {
            return { success: false, message: 'Bot não encontrado' };
        }
        
        try {
            if (bot.client) {
                await bot.client.destroy();
            }
            
            bot.isActive = false;
            bot.isConnected = false;
            bot.qrCode = null;
            
            if (bot.io) {
                bot.io.to(`user_${userId}`).emit('bot_stopped', {
                    message: 'Bot parado com sucesso'
                });
            }
            
            return { success: true, message: 'Bot parado com sucesso' };
        } catch (error) {
            console.error(`Erro ao parar bot para usuário ${userId}:`, error);
            return { success: false, message: 'Erro ao parar bot' };
        }
    }
    
    /**
     * Obtém status do bot de um usuário
     */
    getBotStatus(userId) {
        const bot = userBots.get(userId);
        if (!bot) {
            return {
                isActive: false,
                isConnected: false,
                qrCode: null,
                config: {},
                settings: {}
            };
        }
        
        return {
            isActive: bot.isActive,
            isConnected: bot.isConnected,
            qrCode: bot.qrCode,
            config: bot.config,
            settings: bot.settings
        };
    }
    
    /**
     * Atualiza configurações do bot
     */
    updateBotConfig(userId, config) {
        const bot = userBots.get(userId);
        if (!bot) {
            return { success: false, message: 'Bot não encontrado' };
        }
        
        bot.config = { ...bot.config, ...config };
        this._saveBotState(userId, bot);
        
        return { success: true, config: bot.config };
    }
    
    /**
     * Atualiza settings do bot
     */
    updateBotSettings(userId, settings) {
        const bot = userBots.get(userId);
        if (!bot) {
            return { success: false, message: 'Bot não encontrado' };
        }
        
        bot.settings = { ...bot.settings, ...settings };
        this._saveBotState(userId, bot);
        
        return { success: true, settings: bot.settings };
    }
    
    /**
     * Define instância do Socket.IO para emitir eventos
     */
    setSocketIO(io) {
        for (const [userId, bot] of userBots.entries()) {
            bot.io = io;
        }
    }
    
    /**
     * Salva estado do bot no banco (se usando Supabase)
     */
    async _saveBotState(userId, botState) {
        // Implementar salvamento no Supabase se necessário
        // Por enquanto, mantém apenas em memória
    }
    
    /**
     * Processa mensagens recebidas
     */
    async _handleMessage(msg, botState) {
        // Implementar lógica de resposta do bot
        // Similar ao handleMessage atual, mas usando botState.config e botState.settings
        const messageText = msg.body.trim();
        const from = msg.from;
        
        // Verificar se é mensagem de boas-vindas
        if (messageText.toLowerCase() === 'oi' || messageText.toLowerCase() === 'olá' || messageText === '1') {
            await this._sendWelcomeMessage(msg, botState);
        }
        // Adicionar outras respostas conforme necessário
    }
    
    /**
     * Envia mensagem de boas-vindas
     */
    async _sendWelcomeMessage(msg, botState) {
        try {
            const chat = await msg.getChat();
            
            if (botState.settings.showTyping) {
                await chat.sendStateTyping();
                await new Promise(resolve => setTimeout(resolve, botState.settings.messageDelay * 1000));
            }
            
            await botState.client.sendMessage(msg.from, botState.config.welcomeMessage);
        } catch (error) {
            console.error('Erro ao enviar mensagem de boas-vindas:', error);
        }
    }
}

module.exports = new BotManager();

