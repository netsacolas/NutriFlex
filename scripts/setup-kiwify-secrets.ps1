###############################################################################
# Setup de Secrets Kiwify - PowerShell
#
# Uso: .\scripts\setup-kiwify-secrets.ps1
###############################################################################

$ErrorActionPreference = "Stop"

# Cores
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Fail { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "🔐 Setup de Secrets Kiwify - Supabase" -ForegroundColor Magenta
Write-Host ""

# Verificar Supabase CLI
Write-Info "Verificando Supabase CLI..."
try {
    $version = supabase --version
    Write-Success "Supabase CLI encontrado: $version"
} catch {
    Write-Fail "Supabase CLI não encontrado!"
    Write-Host ""
    Write-Host "Instale com: npm install -g supabase"
    exit 1
}

# Verificar login
Write-Info "Verificando autenticação..."
try {
    supabase projects list | Out-Null
    Write-Success "Autenticado"
} catch {
    Write-Info "Executando login..."
    supabase login
}

Write-Host ""

# Project ref
$PROJECT_REF = "keawapzxqoyesptwpwav"

# Credenciais
$KIWIFY_CLIENT_ID = "4c7f47409-c212-45d1-aaf9-4a5d43dac808"
$KIWIFY_CLIENT_SECRET = "00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac"
$KIWIFY_ACCOUNT_ID = "av8qNBGVVoyVD75"

Write-Info "Configurando Secrets no Supabase Vault..."
Write-Host ""

# Função para configurar secret
function Set-SupabaseSecret {
    param($Name, $Value)

    Write-Host -NoNewline "  $Name... "

    try {
        $Value | supabase secrets set $Name --project-ref $PROJECT_REF 2>&1 | Out-Null
        Write-Host "✓" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗" -ForegroundColor Red
        Write-Fail "Erro: $_"
        return $false
    }
}

# Configurar secrets
$success = $true
$success = $success -and (Set-SupabaseSecret "KIWIFY_CLIENT_ID" $KIWIFY_CLIENT_ID)
$success = $success -and (Set-SupabaseSecret "KIWIFY_CLIENT_SECRET" $KIWIFY_CLIENT_SECRET)
$success = $success -and (Set-SupabaseSecret "KIWIFY_ACCOUNT_ID" $KIWIFY_ACCOUNT_ID)

if (-not $success) {
    Write-Host ""
    Write-Fail "Falha ao configurar alguns secrets"
    exit 1
}

Write-Host ""
Write-Success "Todos os Secrets foram configurados!"
Write-Host ""

# Listar secrets
Write-Info "Listando Secrets configurados..."
Write-Host ""
supabase secrets list --project-ref $PROJECT_REF
Write-Host ""

# Aguardar propagação
Write-Info "Aguardando 30 segundos para propagação..."
for ($i = 30; $i -gt 0; $i--) {
    Write-Host -NoNewline "`r  $i segundos restantes...   "
    Start-Sleep -Seconds 1
}
Write-Host "`r" -NoNewline
Write-Success "Secrets propagados!                    "
Write-Host ""

# Próximos passos
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ CONFIGURAÇÃO CONCLUÍDA                             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Info "Próximos passos:"
Write-Host ""
Write-Host "  1. Deploy da Edge Function:"
Write-Host "     supabase functions deploy kiwify-api" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Testar a integração:"
Write-Host "     node scripts/test-kiwify-integration.js" -ForegroundColor Yellow
Write-Host ""
Write-Success "Setup completo! 🎉"
Write-Host ""
