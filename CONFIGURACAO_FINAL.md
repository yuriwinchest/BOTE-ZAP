# ✅ Configuração Final - Supabase

## 🔑 Credenciais Configuradas

```
Project: bote-atendimentos.zap
Project ID: pxyekqpcgjwaztummzvh
URL: https://pxyekqpcgjwaztummzvh.supabase.co

SUPABASE_ANON_KEY=sb_publishable_ibEwsmVJpEmto1lmztKRaA_cATuJCAY
SUPABASE_SECRET_KEY=sb_secret_CAfYw1-KutnulJYxtZ1f_A_7CxETqQM
```

## 📋 Passo Único: Criar Tabelas

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

No Railway, adicione estas variáveis:

```
SUPABASE_URL=https://pxyekqpcgjwaztummzvh.supabase.co
SUPABASE_ANON_KEY=sb_publishable_ibEwsmVJpEmto1lmztKRaA_cATuJCAY
JWT_SECRET=sua-chave-secreta-forte
```

## ✅ Pronto!

Após isso, tudo funcionará com Supabase! 🚀

