# 🚀 Guia Completo - Deploy no Railway

## 📋 Passo a Passo para Fazer Funcionar

### 1️⃣ Executar SQL no Supabase (OBRIGATÓRIO)

#### A. Acessar SQL Editor
1. Acesse: https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql
2. Clique em **"New Query"**

#### B. Executar Schema Multi-Tenancy
1. Abra o arquivo: `bot/database/schema-multitenancy.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** ou pressione `Ctrl+Enter`

#### C. Verificar Tabelas Criadas
Após executar, você deve ver:
- ✅ `user_bots` criada
- ✅ `bot_settings` criada
- ✅ Índices criados
- ✅ Triggers criados

---

### 2️⃣ Configurar Variáveis no Railway

#### A. Acessar Railway
1. Acesse: https://railway.app
2. Vá no projeto `optimistic-comfort`
3. Clique no serviço `BOTE-ZAP`
4. Vá em **Settings** > **Variables**

#### B. Adicionar Variáveis

Adicione estas variáveis (uma por linha):

```
SUPABASE_URL=https://pxyekqpcgjwaztummzvh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQ5NTAsImV4cCI6MjA4MjA4MDk1MH0.SJsNzv-kqz936jpQLMk05Ap-xUpm3wkNPe1yrZeFluY
JWT_SECRET=sua-chave-secreta-muito-forte-aqui-mude-em-producao
```

**⚠️ IMPORTANTE:**
- Mude o `JWT_SECRET` para uma chave forte e única
- Exemplo: `JWT_SECRET=minha-chave-super-secreta-123456789-abcdef`

#### C. Salvar
Clique em **"Save"** ou **"Add"** para cada variável

---

### 3️⃣ Verificar Deploy

#### A. Verificar Logs
1. No Railway, vá em **Deployments**
2. Clique no último deploy
3. Veja os logs:
   - ✅ Deve mostrar: "Servidor rodando em: http://0.0.0.0:8080"
   - ✅ Deve mostrar: "Usando Supabase para autenticação"

#### B. Verificar Health
1. Vá em **Settings** > **Networking**
2. Clique em **"Generate Domain"** (se ainda não tiver)
3. Anote a URL gerada (ex: `bote-zap-production.up.railway.app`)

---

### 4️⃣ Testar Aplicação

#### A. Acessar Login
1. Acesse: `https://sua-url.railway.app/login`
2. Use as credenciais:
   - Email: `admin@chatbot.com`
   - Senha: `admin123`

#### B. Criar Nova Conta (Opcional)
1. Acesse: `https://sua-url.railway.app/register`
2. Crie uma conta nova
3. Faça login

#### C. Configurar Bot
1. Após login, você será redirecionado para `/admin`
2. Configure:
   - Nome do Bot
   - Nome da Empresa
   - Mensagem de Boas-vindas
   - Link do Site
3. Clique em **"Salvar Configurações"**

#### D. Iniciar Bot
1. Clique em **"▶️ Iniciar Bot"**
2. Aguarde o QR Code aparecer
3. Escaneie com WhatsApp:
   - Abra WhatsApp no celular
   - Vá em **Configurações** > **Aparelhos conectados**
   - Escaneie o QR Code

#### E. Testar Bot
1. Envie uma mensagem para o número conectado
2. O bot deve responder automaticamente!

---

### 5️⃣ Verificar Funcionamento

#### ✅ Checklist

- [ ] SQL executado no Supabase
- [ ] Variáveis configuradas no Railway
- [ ] Deploy bem-sucedido
- [ ] URL pública gerada
- [ ] Login funcionando
- [ ] Bot iniciando
- [ ] QR Code aparecendo
- [ ] WhatsApp conectando
- [ ] Bot respondendo mensagens

---

### 🔧 Troubleshooting

#### Problema: "Supabase não configurado"
**Solução:** Verifique se as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão configuradas no Railway

#### Problema: "Tabelas não existem"
**Solução:** Execute o SQL `schema-multitenancy.sql` no Supabase

#### Problema: "Token inválido"
**Solução:** Faça logout e login novamente

#### Problema: "QR Code não aparece"
**Solução:** 
1. Verifique se clicou em "Iniciar Bot"
2. Aguarde alguns segundos
3. Verifique os logs no Railway

---

### 📝 URLs Importantes

Após configurar, você terá:

- **Admin:** `https://sua-url.railway.app/admin`
- **Login:** `https://sua-url.railway.app/login`
- **Register:** `https://sua-url.railway.app/register`
- **Health:** `https://sua-url.railway.app/health`

---

### ✅ Pronto!

Após seguir estes passos, o sistema estará funcionando com:
- ✅ Multi-tenancy (cada usuário tem seu bot)
- ✅ Supabase conectado
- ✅ Segurança implementada
- ✅ QR Code funcionando
- ✅ Bot respondendo mensagens

**Tudo funcionando!** 🚀

