// Servidor simplificado para rodar localmente e testar QR Code
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const qrcode = require('qrcode');
const { Client } = require('whatsapp-web.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());

// Página HTML simples para exibir QR Code
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp QR Code</title>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        #qrcode {
            width: 300px;
            height: 300px;
            margin: 20px auto;
            border: 5px solid #25D366;
            border-radius: 10px;
            padding: 10px;
            background: white;
        }
        #qrcode img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            font-weight: bold;
        }
        .waiting {
            background: #fff3cd;
            color: #856404;
        }
        .connected {
            background: #d4edda;
            color: #155724;
        }
        .disconnected {
            background: #f8d7da;
            color: #721c24;
        }
        .info {
            margin-top: 15px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Conectar WhatsApp</h1>
        <div id="qrcode">
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">
                Aguardando QR Code...
            </div>
        </div>
        <div id="status" class="status waiting">
            ⏳ Aguardando QR Code...
        </div>
        <div class="info">
            <p>1. Escaneie o QR Code com seu WhatsApp</p>
            <p>2. Abra WhatsApp → Configurações → Aparelhos conectados → Conectar um aparelho</p>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const qrcodeDiv = document.getElementById('qrcode');
        const statusDiv = document.getElementById('status');

        // Receber QR Code
        socket.on('qr', (qrCodeImage) => {
            console.log('QR Code recebido!');
            qrcodeDiv.innerHTML = '<img src="' + qrCodeImage + '" alt="QR Code">';
            statusDiv.className = 'status waiting';
            statusDiv.innerHTML = '📱 QR Code gerado! Escaneie com seu WhatsApp';
        });

        // Receber status inicial
        socket.on('status', (data) => {
            if (data.qrCode) {
                qrcodeDiv.innerHTML = '<img src="' + data.qrCode + '" alt="QR Code">';
            }
            if (data.connected) {
                statusDiv.className = 'status connected';
                statusDiv.innerHTML = '✅ WhatsApp já estava conectado!';
            }
        });

        // Receber notificação de conexão
        socket.on('connected', (data) => {
            console.log('Conectado:', data.message);
            statusDiv.className = 'status connected';
            statusDiv.innerHTML = '✅ ' + data.message;
            qrcodeDiv.style.borderColor = '#28a745';
        });

        // Receber notificação de desconexão
        socket.on('disconnected', (data) => {
            console.log('Desconectado:', data.message);
            statusDiv.className = 'status disconnected';
            statusDiv.innerHTML = '❌ ' + data.message;
            qrcodeDiv.style.borderColor = '#dc3545';
        });
    </script>
</body>
</html>
    `);
});

// Inicializar cliente WhatsApp
const client = new Client();

// Variáveis de estado
let qrCodeData = null;
let isConnected = false;

// Evento quando QR Code é gerado
client.on('qr', async (qr) => {
    console.log('QR Code gerado!');
    try {
        // Gerar QR Code como imagem base64
        const qrCodeImage = await qrcode.toDataURL(qr);
        qrCodeData = qrCodeImage;
        
        // Enviar QR Code para todos os clientes conectados
        io.emit('qr', qrCodeImage);
        
        // Também mostrar no terminal
        require('qrcode-terminal').generate(qr, {small: true});
        
        console.log('✅ QR Code gerado e enviado com sucesso!');
    } catch (err) {
        console.error('❌ Erro ao gerar QR Code:', err);
    }
});

// Evento quando conectado
client.on('ready', () => {
    console.log('✅ WhatsApp conectado com sucesso!');
    isConnected = true;
    io.emit('connected', { message: 'WhatsApp conectado com sucesso!' });
});

// Evento quando desconectado
client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp desconectado:', reason);
    isConnected = false;
    io.emit('disconnected', { message: 'WhatsApp desconectado' });
});

// Socket.io para comunicação em tempo real
io.on('connection', (socket) => {
    console.log('👤 Cliente conectado ao servidor web');
    
    // Enviar status atual
    socket.emit('status', { 
        connected: isConnected,
        qrCode: qrCodeData 
    });
    
    socket.on('disconnect', () => {
        console.log('👤 Cliente desconectado do servidor web');
    });
});

// Inicializar cliente WhatsApp
console.log('🚀 Iniciando cliente WhatsApp...');
client.initialize();

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('');
    console.log('============================================');
    console.log('  🚀 SERVIDOR RODANDO LOCALMENTE');
    console.log('============================================');
    console.log('');
    console.log(`  🌐 URL: http://localhost:${PORT}`);
    console.log('');
    console.log('  📱 Abra no navegador e escaneie o QR Code');
    console.log('');
    console.log('  ⏹️  Pressione Ctrl+C para parar');
    console.log('');
    console.log('============================================');
    console.log('');
});



