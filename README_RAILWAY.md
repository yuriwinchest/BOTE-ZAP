# 🚂 Deploy no Railway - Guia Completo

## ✅ Configuração Automática

O projeto já está configurado para rodar no Railway! Basta conectar o repositório.

## 📋 Passos para Deploy

### 1. Conectar Repositório
1. Acesse [Railway.app](https://railway.app)
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha o repositório `BOTE-ZAP`

### 2. Configurar Variáveis de Ambiente (Opcional)
No Railway, vá em **Settings > Variables** e adicione:

```
JWT_SECRET=sua-chave-secreta-aqui
```

### 3. Expor o Serviço Publicamente
1. Vá em **Settings**
2. Clique em **"Generate Domain"** ou **"Custom Domain"**
3. O Railway criará uma URL pública (ex: `bote-zap.railway.app`)

### 4. Acessar a Aplicação
Após o deploy, acesse:
- **Admin:** `https://seu-projeto.railway.app/admin`
- **Dashboard:** `https://seu-projeto.railway.app`
- **Login:** `https://seu-projeto.railway.app/login`

## 🔧 Arquivos de Configuração

- `nixpacks.toml` - Configuração do build
- `railway.json` - Configuração do deploy
- `package.json` - Scripts e dependências

## ⚠️ Importante

1. **WhatsApp Session:** A sessão do WhatsApp será salva no servidor Railway
2. **Reiniciar Bot:** Se o servidor reiniciar, você precisará escanear o QR Code novamente
3. **Persistência:** Para manter a sessão após reinicializações, considere usar volumes do Railway

## 🎯 Próximos Passos

Após o deploy:
1. Acesse `/admin`
2. Configure o bot
3. Clique em **"Iniciar Bot"**
4. Escaneie o QR Code
5. Pronto! 🎉

## 💰 Custos

- **Tier Grátis:** $5/mês de créditos
- **Suficiente para:** Testes e uso pessoal
- **Upgrade:** Se precisar de mais recursos

