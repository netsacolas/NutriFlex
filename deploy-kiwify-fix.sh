#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "DEPLOY DA CORREÇÃO KIWIFY-API"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "1️⃣ Fazendo deploy da função kiwify-api..."
echo ""

npx supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav --no-verify-jwt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy realizado com sucesso!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "2️⃣ Testando sincronização manual..."
    echo ""

    # Aguardar propagação do deploy
    sleep 3

    # Testar sync_manual
    node debug-kiwify.js

else
    echo ""
    echo "❌ Erro no deploy!"
    echo ""
    echo "Tente uma das alternativas:"
    echo "1. Deploy via Dashboard: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions"
    echo "2. Gerar token: https://supabase.com/dashboard/account/tokens"
    echo "   Depois execute: export SUPABASE_ACCESS_TOKEN=seu_token && bash deploy-kiwify-fix.sh"
    echo ""
fi

echo "═══════════════════════════════════════════════════════════════"
