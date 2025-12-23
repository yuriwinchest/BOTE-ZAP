# ✅ Supabase Configurado - Próximos Passos

## 🔑 Credenciais Obtidas

```
SUPABASE_URL=https://pxyekqpcgjwaztummzvh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQ5NTAsImV4cCI6MjA4MjA4MDk1MH0.SJsNzv-kqz936jpQLMk05Ap-xUpm3wkNPe1yrZeFluY
```

## 📋 Passo Final: Criar Tabelas

### 1. Acesse o SQL Editor do Supabase

🔗 **Link direto:** https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql

### 2. Execute o SQL

Cole e execute o conteúdo do arquivo: `bot/database/schema.sql`

Ou copie este SQL:

```sql
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Tabela de tokens ativos
CREATE TABLE IF NOT EXISTS active_tokens (
    id BIGSERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_active_tokens_token ON active_tokens(token);
CREATE INDEX IF NOT EXISTS idx_active_tokens_expires_at ON active_tokens(expires_at);

-- Tabela de configurações do bot
CREATE TABLE IF NOT EXISTS bot_config (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id BIGSERIAL PRIMARY KEY,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    message_text TEXT,
    message_type VARCHAR(50),
    is_from_me BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bot_config_updated_at ON bot_config;
CREATE TRIGGER update_bot_config_updated_at BEFORE UPDATE ON bot_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Criar Usuário Admin

Após executar o SQL, execute:

```bash
cd bot
node database/create-admin-user.js
```

Ou configure as variáveis primeiro:

```bash
cd bot
SUPABASE_URL=https://pxyekqpcgjwaztummzvh.supabase.co SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQ5NTAsImV4cCI6MjA4MjA4MDk1MH0.SJsNzv-kqz936jpQLMk05Ap-xUpm3wkNPe1yrZeFluY node database/create-admin-user.js
```

## 🚂 Configurar no Railway

### 1. Adicionar Variáveis de Ambiente

No Railway, vá em **Settings > Variables** e adicione:

```
SUPABASE_URL=https://pxyekqpcgjwaztummzvh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQ5NTAsImV4cCI6MjA4MjA4MDk1MH0.SJsNzv-kqz936jpQLMk05Ap-xUpm3wkNPe1yrZeFluY
JWT_SECRET=sua-chave-secreta-forte-aqui
```

### 2. Fazer Deploy

O sistema detectará automaticamente o Supabase e usará o banco de dados real!

## ✅ Status

- ✅ ANON KEY obtida
- ✅ URL do projeto configurada
- ⏳ Tabelas precisam ser criadas (execute SQL acima)
- ⏳ Usuário admin precisa ser criado (após tabelas)

## 🎯 Após Configurar

O sistema automaticamente:
- Usará Supabase ao invés de banco em memória
- Persistirá dados entre reinicializações
- Manterá histórico de mensagens
- Salvará configurações do bot

