@echo off
echo ===================================================================
echo DEPLOY DA CORRECAO KIWIFY - COPIE E COLE O TOKEN
echo ===================================================================
echo.
echo 1. Abra este link no navegador:
echo    https://supabase.com/dashboard/account/tokens
echo.
echo 2. Clique em "Generate new token"
echo    Nome: Deploy Kiwify Fix
echo.
echo 3. COPIE o token gerado
echo.
echo ===================================================================
echo.
set /p TOKEN="4. COLE O TOKEN AQUI e pressione ENTER: "
echo.
echo ===================================================================
echo Fazendo deploy da Edge Function...
echo ===================================================================
echo.

set SUPABASE_ACCESS_TOKEN=%TOKEN%
npx supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================================
    echo SUCESSO! Deploy realizado com sucesso!
    echo ===================================================================
    echo.
    echo Testando agora...
    node debug-kiwify.js
) else (
    echo.
    echo ===================================================================
    echo ERRO no deploy!
    echo ===================================================================
    echo.
    echo Tente fazer o deploy manual via Dashboard:
    echo https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions
    echo.
)

pause
