# 🤖 BOTE-ZAP - WhatsApp Bot Multi-Tenancy

Bot para WhatsApp com sistema multi-tenancy - cada usuário tem seu próprio bot e configurações isoladas.

## 🚀 Funcionalidades

- ✅ **Multi-Tenancy** - Cada usuário tem seu próprio bot isolado
- ✅ **Criação de Contas** - Usuários podem criar suas próprias contas
- ✅ **Painel Administrativo** - Configure seu bot antes de iniciar
- ✅ **QR Code no Navegador** - Escaneie diretamente pela web
- ✅ **Respostas Automáticas** - Menu interativo com opções
- ✅ **Configurações em Tempo Real** - Altere mensagens sem reiniciar
- ✅ **Status em Tempo Real** - Acompanhe a conexão via Socket.IO
- ✅ **Supabase Integrado** - Banco de dados persistente
- ✅ **Segurança** - Validação, rate limiting, proteção SQL injection

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

### Para Administradores:
1. Acesse `/login` (admin@chatbot.com / admin123)
2. Vá para `/admin`
3. Configure o bot (nome, empresa, mensagens)
4. Clique em **"Iniciar Bot"**
5. Escaneie o QR Code com WhatsApp
6. Bot funcionando! 🎉

### Para Novos Usuários:
1. Acesse `/register`
2. Crie sua conta
3. Faça login
4. Configure SEU bot
5. Inicie SEU bot
6. Escaneie SEU QR Code
7. Seu bot funcionando! 🎉

**Cada usuário tem seu próprio bot isolado!**

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
- **Supabase** - Banco de dados PostgreSQL
- **bcryptjs** - Hash de senhas
- **Multi-Tenancy** - Isolamento por usuário

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

## 🚀 Deploy no Railway

### Passo 1: Executar SQL no Supabase
1. Acesse: https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql
2. Execute: `bot/database/schema-multitenancy.sql`

### Passo 2: Configurar Variáveis no Railway
No Railway, Settings > Variables, adicione:
```
SUPABASE_URL=https://pxyekqpcgjwaztummzvh.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
JWT_SECRET=sua-chave-secreta-forte
```

### Passo 3: Gerar URL Pública
Railway > Settings > Networking > Generate Domain

### Passo 4: Testar
Acesse a URL gerada e faça login!

**📖 Guia completo:** Veja `GUIA_DEPLOY_RAILWAY.md`

## 📝 Licença

MIT License

## 👤 Autor

- GitHub: [@yuriwinchest](https://github.com/yuriwinchest)
