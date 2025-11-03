#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "TESTE DE SINCRONIZAÇÃO COM DEBUG DETALHADO"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Teste 1: OAuth status
echo "1️⃣ Verificando OAuth status..."
curl -s -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8" \
  -d '{"action":"oauth_status"}' | jq '.'
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Teste 2: List subscriptions (já sabemos que funciona)
echo "2️⃣ Listando assinaturas (deve funcionar)..."
RESULT=$(curl -s -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8" \
  -d '{"action":"list_subscriptions","email":"birofov720@hh7f.com"}')

echo "$RESULT" | jq '.'
CORRELATION_ID=$(echo "$RESULT" | jq -r '.correlation_id')
echo ""
echo "Correlation ID: $CORRELATION_ID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Teste 3: Sync manual (o que está falhando)
echo "3️⃣ Tentando sync_manual (problema atual)..."
RESULT=$(curl -s -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8" \
  -d '{"action":"sync_manual","emails":["birofov720@hh7f.com"]}')

echo "$RESULT" | jq '.'
CORRELATION_ID=$(echo "$RESULT" | jq -r '.correlation_id')
echo ""
echo "Correlation ID: $CORRELATION_ID"
echo ""

if echo "$RESULT" | jq -e '.error' > /dev/null; then
  echo "❌ ERRO DETECTADO!"
  echo ""
  echo "Precisamos ver os logs deste correlation_id: $CORRELATION_ID"
  echo ""
  echo "Execute no Dashboard do Supabase:"
  echo "https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/logs/edge-functions"
  echo ""
  echo "Ou tente via CLI (se disponível):"
  echo "npx supabase functions logs kiwify-api | grep -A 20 \"$CORRELATION_ID\""
else
  echo "✅ SUCESSO!"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
