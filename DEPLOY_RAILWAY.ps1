# Script para Deploy Direto no Railway (Sem GitHub)
# Execute: .\DEPLOY_RAILWAY.ps1

Write-Host "🚂 Railway CLI - Deploy Direto" -ForegroundColor Cyan
Write-Host ""

# Verificar se Railway CLI está instalado
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue

if (-not $railwayInstalled) {
    Write-Host "📦 Instalando Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    Write-Host "✅ Railway CLI instalado!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "🔐 Passo 1: Login no Railway" -ForegroundColor Yellow
Write-Host "   (Isso abrirá o navegador para login)" -ForegroundColor Gray
Write-Host ""
railway login

Write-Host ""
Write-Host "🔗 Passo 2: Conectar ao projeto Railway" -ForegroundColor Yellow
Write-Host "   (Escolha o projeto 'optimistic-comfort')" -ForegroundColor Gray
Write-Host ""
railway link

Write-Host ""
Write-Host "🚀 Passo 3: Fazendo deploy..." -ForegroundColor Yellow
Write-Host ""
railway up

Write-Host ""
Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Acesse o Railway para ver o status do deploy" -ForegroundColor Cyan

