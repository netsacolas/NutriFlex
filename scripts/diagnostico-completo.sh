#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO - Integração Kiwify"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Verificar secrets configurados
echo "1️⃣ VERIFICANDO SECRETS CONFIGURADOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx supabase secrets list --project-ref keawapzxqoyesptwpwav
echo ""
echo "✅ Deve ter 5 secrets:"
echo "   - KIWIFY_CLIENT_ID"
echo "   - KIWIFY_CLIENT_SECRET"
echo "   - KIWIFY_ACCOUNT_ID"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""

# 2. Ver últimos logs
echo "2️⃣ ÚLTIMOS 30 LOGS DA FUNÇÃO kiwify-api"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx supabase functions logs kiwify-api --project-ref keawapzxqoyesptwpwav --limit 30
echo ""

# 3. Testar função
echo "3️⃣ TESTANDO FUNÇÃO VIA CURL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESULT=$(curl -s -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8" \
  -d '{"action":"oauth_status"}')

echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
echo ""

# Verificar se tem erro
if echo "$RESULT" | grep -q '"error"'; then
  echo "❌ FUNÇÃO RETORNOU ERRO!"

  # Extrair correlation_id
  CORRELATION_ID=$(echo "$RESULT" | grep -o '"correlation_id":"[^"]*"' | cut -d'"' -f4)

  if [ ! -z "$CORRELATION_ID" ]; then
    echo ""
    echo "📋 Correlation ID: $CORRELATION_ID"
    echo ""
    echo "4️⃣ LOGS RELACIONADOS AO ERRO"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    npx supabase functions logs kiwify-api --project-ref keawapzxqoyesptwpwav --limit 50 | grep -A 15 -B 5 "$CORRELATION_ID" || echo "Não encontrado nos últimos 50 logs"
  fi
else
  echo "✅ FUNÇÃO FUNCIONOU!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "FIM DO DIAGNÓSTICO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
