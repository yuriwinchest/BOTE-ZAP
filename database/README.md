# 🗄️ Configuração do Banco de Dados - Supabase

## 📋 Passos para Configurar

### 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta (se não tiver)
3. Crie um novo projeto
4. Anote a **URL** e a **anon key**

### 2. Executar o Schema SQL
1. No Supabase, vá em **SQL Editor**
2. Copie o conteúdo de `schema.sql`
3. Cole e execute no SQL Editor
4. Isso criará todas as tabelas necessárias

### 3. Configurar Variáveis de Ambiente

#### No Railway:
1. Vá em **Settings** > **Variables**
2. Adicione:
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua-chave-anon
   JWT_SECRET=sua-chave-secreta-forte
   ```

#### Localmente:
1. Crie arquivo `.env` na raiz do projeto `bot/`
2. Adicione:
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua-chave-anon
   JWT_SECRET=sua-chave-secreta-forte
   ```

### 4. Atualizar server.js
O `server.js` precisa usar `supabase-auth.js` ao invés de `simple-auth.js`.

---

## 📊 Tabelas Criadas

- **users** - Usuários do sistema
- **active_tokens** - Tokens JWT ativos
- **bot_config** - Configurações do bot
- **whatsapp_messages** - Histórico de mensagens

---

## ✅ Próximos Passos

Após configurar, me envie:
1. **SUPABASE_URL**
2. **SUPABASE_ANON_KEY**
3. Confirmação de que executou o `schema.sql`

E eu finalizo a configuração! 🚀

