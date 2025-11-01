@echo off
REM ============================================================================
REM Setup de Secrets Kiwify - Windows Batch
REM
REM Uso: scripts\setup-kiwify-secrets.bat
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   Setup de Secrets Kiwify - Supabase
echo ============================================================
echo.

REM Verificar Supabase CLI
echo [INFO] Verificando Supabase CLI...
where supabase >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Supabase CLI nao encontrado!
    echo.
    echo Instale com: npm install -g supabase
    echo.
    pause
    exit /b 1
)

echo [OK] Supabase CLI encontrado
echo.

REM Verificar login
echo [INFO] Verificando autenticacao...
supabase projects list >nul 2>nul
if errorlevel 1 (
    echo [INFO] Executando login...
    supabase login
    if errorlevel 1 (
        echo [ERRO] Falha no login
        pause
        exit /b 1
    )
)

echo [OK] Autenticado
echo.

REM Project ref
set PROJECT_REF=keawapzxqoyesptwpwav

REM Credenciais
set KIWIFY_CLIENT_ID=4c7f47409-c212-45d1-aaf9-4a5d43dac808
set KIWIFY_CLIENT_SECRET=00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac
set KIWIFY_ACCOUNT_ID=av8qNBGVVoyVD75

echo [INFO] Configurando Secrets no Supabase Vault...
echo.

REM Configurar Secret 1
echo [1/3] Configurando KIWIFY_CLIENT_ID...
echo %KIWIFY_CLIENT_ID% | supabase secrets set KIWIFY_CLIENT_ID --project-ref %PROJECT_REF% >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Falha ao configurar KIWIFY_CLIENT_ID
    pause
    exit /b 1
)
echo [OK] KIWIFY_CLIENT_ID configurado

REM Configurar Secret 2
echo [2/3] Configurando KIWIFY_CLIENT_SECRET...
echo %KIWIFY_CLIENT_SECRET% | supabase secrets set KIWIFY_CLIENT_SECRET --project-ref %PROJECT_REF% >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Falha ao configurar KIWIFY_CLIENT_SECRET
    pause
    exit /b 1
)
echo [OK] KIWIFY_CLIENT_SECRET configurado

REM Configurar Secret 3
echo [3/3] Configurando KIWIFY_ACCOUNT_ID...
echo %KIWIFY_ACCOUNT_ID% | supabase secrets set KIWIFY_ACCOUNT_ID --project-ref %PROJECT_REF% >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Falha ao configurar KIWIFY_ACCOUNT_ID
    pause
    exit /b 1
)
echo [OK] KIWIFY_ACCOUNT_ID configurado

echo.
echo [OK] Todos os Secrets foram configurados com sucesso!
echo.

REM Listar secrets
echo [INFO] Listando Secrets configurados:
echo.
supabase secrets list --project-ref %PROJECT_REF%
echo.

REM Aguardar propagação
echo [INFO] Aguardando 30 segundos para propagacao dos Secrets...
timeout /t 30 /nobreak >nul
echo [OK] Secrets propagados!
echo.

REM Próximos passos
echo ============================================================
echo   CONFIGURACAO CONCLUIDA
echo ============================================================
echo.
echo Proximos passos:
echo.
echo   1. Deploy da Edge Function:
echo      supabase functions deploy kiwify-api
echo.
echo   2. Testar a integracao:
echo      node scripts/test-kiwify-integration.js
echo.
echo Setup completo!
echo.

pause
