// ============================================
// CÓDIGO FUNCIONAL DE QR CODE - WHATSAPP
// Extraído de bot/server.js
// Use este código como referência para aplicar no sistema principal
// ============================================

// ========== IMPORTS NECESSÁRIOS ==========
const qrcode = require('qrcode');
const { Client } = require('whatsapp-web.js');
const socketIo = require('socket.io');
const http = require('http');
const express = require('express');

// ========== CONFIGURAÇÃO DO SERVIDOR (se não existir) ==========
// Se o sistema principal já tem Express, use o existente
// Se não, descomente as linhas abaixo:
// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// ========== INICIALIZAÇÃO DO CLIENTE WHATSAPP ==========
const client = new Client();

// ========== VARIÁVEIS DE ESTADO ==========
let qrCodeData = null;
let isConnected = false;

// ========== EVENTO: QR CODE GERADO ==========
// Esta é a parte CRÍTICA que faz funcionar!
client.on('qr', async (qr) => {
    console.log('QR Code gerado!');
    try {
        // Gerar QR Code como imagem base64
        const qrCodeImage = await qrcode.toDataURL(qr);
        qrCodeData = qrCodeImage;
        
        // Enviar QR Code para todos os clientes conectados via Socket.IO
        io.emit('qr', qrCodeImage);
        
        // Também mostrar no terminal (opcional)
        require('qrcode-terminal').generate(qr, {small: true});
    } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
    }
});

// ========== EVENTO: WHATSAPP CONECTADO ==========
client.on('ready', () => {
    console.log('WhatsApp conectado com sucesso!');
    isConnected = true;
    io.emit('connected', { message: 'WhatsApp conectado com sucesso!' });
});

// ========== EVENTO: WHATSAPP DESCONECTADO ==========
client.on('disconnected', (reason) => {
    console.log('WhatsApp desconectado:', reason);
    isConnected = false;
    io.emit('disconnected', { message: 'WhatsApp desconectado' });
});

// ========== CONFIGURAÇÃO SOCKET.IO ==========
// Para enviar status atual quando cliente conecta
io.on('connection', (socket) => {
    console.log('Cliente conectado ao servidor web');
    
    // Enviar status atual (incluindo QR Code se já foi gerado)
    socket.emit('status', { 
        connected: isConnected,
        qrCode: qrCodeData 
    });
    
    socket.on('disconnect', () => {
        console.log('Cliente desconectado do servidor web');
    });
});

// ========== INICIALIZAR CLIENTE WHATSAPP ==========
// IMPORTANTE: Esta linha deve ser chamada DEPOIS de configurar todos os eventos
client.initialize();

// ============================================
// COMO USAR NO FRONTEND (HTML/JavaScript)
// ============================================
/*
// Conectar ao Socket.IO
const socket = io();

// Receber QR Code quando gerado
socket.on('qr', (qrCodeImage) => {
    const img = document.getElementById('qrcode');
    if (img) {
        img.src = qrCodeImage;
        console.log('QR Code recebido e exibido!');
    }
});

// Receber status inicial quando conectar
socket.on('status', (data) => {
    if (data.qrCode) {
        document.getElementById('qrcode').src = data.qrCode;
    }
    if (data.connected) {
        console.log('WhatsApp já estava conectado');
    }
});

// Receber notificação de conexão
socket.on('connected', (data) => {
    console.log('Conectado:', data.message);
    // Atualizar UI - esconder QR Code, mostrar status conectado
});
*/

