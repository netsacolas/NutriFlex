#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "DEBUG: Verificar resposta RAW da API Kiwify"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Buscar assinaturas do usuário que fez a compra
echo "1️⃣ Buscando assinaturas via API..."
echo ""

RESULT=$(curl -s -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8" \
  -d '{"action":"list_subscriptions","email":"birofov720@hh7f.com"}')

echo "$RESULT" | jq '.'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Extrair informações importantes
echo "2️⃣ Campos importantes da primeira assinatura:"
echo ""

echo "STATUS retornado:"
echo "$RESULT" | jq -r '.data[0].status // "N/A"'
echo ""

echo "SUBSCRIPTION_STATUS retornado:"
echo "$RESULT" | jq -r '.data[0].subscription_status // "N/A"'
echo ""

echo "STATE retornado:"
echo "$RESULT" | jq -r '.data[0].state // "N/A"'
echo ""

echo "PLAN_ID retornado:"
echo "$RESULT" | jq -r '.data[0].plan_id // .data[0].product_id // "N/A"'
echo ""

echo "FREQUENCY retornada:"
echo "$RESULT" | jq -r '.data[0].frequency // .data[0].billing_period // "N/A"'
echo ""

echo "EMAIL do cliente:"
echo "$RESULT" | jq -r '.data[0].customer.email // .data[0].customer_email // "N/A"'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "3️⃣ Objeto completo da primeira assinatura (para análise):"
echo ""
echo "$RESULT" | jq '.data[0]'

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "📋 ANÁLISE:"
echo ""
echo "Com essas informações podemos identificar:"
echo "- Qual STATUS a Kiwify retorna (approved/paid/completed/active?)"
echo "- Qual PLAN_ID corresponde ao plano comprado"
echo "- Se o EMAIL está sendo retornado corretamente"
echo ""
echo "Use essas informações para corrigir o mapeamento se necessário."
echo ""
