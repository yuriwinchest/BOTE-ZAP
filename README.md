# 🤖 BOTE-ZAP - WhatsApp Bot com Painel Administrativo

Bot para WhatsApp com interface web administrativa para configuração e gerenciamento.

## 🚀 Funcionalidades

- ✅ **Painel Administrativo** - Configure o bot antes de iniciar
- ✅ **QR Code no Navegador** - Escaneie diretamente pela web
- ✅ **Respostas Automáticas** - Menu interativo com opções
- ✅ **Configurações em Tempo Real** - Altere mensagens sem reiniciar
- ✅ **Status em Tempo Real** - Acompanhe a conexão via Socket.IO

## 📦 Instalação

```bash
# Clonar repositório
git clone https://github.com/yuriwinchest/BOTE-ZAP.git
cd BOTE-ZAP

# Instalar dependências
npm install

# Iniciar servidor
npm start
```

## 🌐 Acessar

Após iniciar, acesse:

| Página | URL |
|--------|-----|
| **Admin** | http://localhost:3000/admin |
| Dashboard | http://localhost:3000 |
| Login | http://localhost:3000/login |

## 🔐 Credenciais Padrão

- **Email:** `admin@chatbot.com`
- **Senha:** `admin123`

## 📋 Como Usar

1. Acesse `/admin`
2. Configure o bot (nome, empresa, mensagens)
3. Clique em **"Iniciar Bot"**
4. Escaneie o QR Code com WhatsApp
5. Bot funcionando! 🎉

## ⚙️ Configurações

### Configurações Básicas
- Nome do Bot
- Nome da Empresa
- Mensagem de Boas-vindas
- Link do Site

### Configurações Avançadas
- Auto-resposta (on/off)
- Simular digitação
- Delay entre mensagens
- Horário de funcionamento

## 🛠️ Tecnologias

- **Node.js** - Runtime
- **Express** - Servidor web
- **Socket.IO** - Comunicação em tempo real
- **whatsapp-web.js** - API WhatsApp
- **JWT** - Autenticação

## 📁 Estrutura

```
BOTE-ZAP/
├── server.js           # Servidor principal
├── package.json        # Dependências
├── public/             # Arquivos estáticos
│   ├── admin.html      # Painel administrativo
│   ├── index.html      # Dashboard
│   ├── login.html      # Página de login
│   └── register.html   # Página de registro
└── services/
    └── simple-auth.js  # Serviço de autenticação
```

## 🚀 Deploy

### Vercel (Recomendado para Frontend)
O backend precisa de um servidor que suporte WebSockets e Puppeteer.

### Railway / Render / Heroku
Plataformas recomendadas para o backend completo.

## 📝 Licença

MIT License

## 👤 Autor

- GitHub: [@yuriwinchest](https://github.com/yuriwinchest)
