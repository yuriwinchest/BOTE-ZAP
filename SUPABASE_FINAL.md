# ✅ Supabase - Configuração Final

## 🔑 Credenciais Configuradas

```
Project: bote-atendimentos.zap
Project ID: pxyekqpcgjwaztummzvh
URL: https://pxyekqpcgjwaztummzvh.supabase.co

ANON KEY (public):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQ5NTAsImV4cCI6MjA4MjA4MDk1MH0.SJsNzv-kqz936jpQLMk05Ap-xUpm3wkNPe1yrZeFluY

SERVICE ROLE KEY (secret):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwNDk1MCwiZXhwIjoyMDgyMDgwOTUwfQ.tQyuHzPWjVjkY49Nyiq0xIA0GE7iKG4Cs9ttDj-bfKM
```

## 📋 Último Passo: Criar Tabelas

### 1. Acesse o SQL Editor

🔗 **Link:** https://supabase.com/dashboard/project/pxyekqpcgjwaztummzvh/sql

### 2. Execute o SQL

Cole e execute o conteúdo de: `bot/database/schema.sql`

### 3. Criar Usuário Admin

Após criar as tabelas, execute:

```bash
cd bot
node database/create-admin-user.js
```

## 🚂 Configurar Railway

No Railway, Settings > Variables, adicione:

```
SUPABASE_URL=https://pxyekqpcgjwaztummzvh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWVrcXBjZ2p3YXp0dW1tenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQ5NTAsImV4cCI6MjA4MjA4MDk1MH0.SJsNzv-kqz936jpQLMk05Ap-xUpm3wkNPe1yrZeFluY
JWT_SECRET=sua-chave-secreta-forte
```

## ✅ Status

- ✅ Credenciais configuradas
- ✅ Scripts criados
- ✅ Sistema detecta Supabase automaticamente
- ⏳ Tabelas precisam ser criadas (1 minuto)
- ⏳ Usuário admin será criado automaticamente após tabelas

## 🎯 Após Configurar

O sistema automaticamente usará Supabase! 🚀

