#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "DIAGNÓSTICO DO ENDPOINT /v1/payments DA KIWIFY"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar se temos o token OAuth
echo "1️⃣ Obtendo token OAuth..."
TOKEN_RESPONSE=$(curl -s -X POST https://public-api.kiwify.com/v1/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=3d72644f-8407-4adf-af03-b8754105d659&client_secret=6ac6905be677659ffd1e370bdf01bad7aaf3b8a86d979b2bbac1a5eb5d15c507")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Falha ao obter token OAuth"
  echo "$TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Token obtido com sucesso"
echo ""

# Testar endpoint /v1/payments com diferentes combinações de parâmetros
echo "2️⃣ Testando /v1/payments SEM parâmetros de data..."
curl -s -X GET "https://public-api.kiwify.com/v1/payments" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-kiwify-account-id: av8qNBGVVoyVD75" | jq '.' || echo "ERRO"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "3️⃣ Testando /v1/payments COM start_date e end_date..."
START_DATE=$(date -d "90 days ago" +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)
curl -s -X GET "https://public-api.kiwify.com/v1/payments?start_date=$START_DATE&end_date=$END_DATE" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-kiwify-account-id: av8qNBGVVoyVD75" | jq '.' || echo "ERRO"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "4️⃣ Testando /v1/payments COM paid_from e paid_to (formato antigo)..."
curl -s -X GET "https://public-api.kiwify.com/v1/payments?paid_from=$START_DATE&paid_to=$END_DATE" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-kiwify-account-id: av8qNBGVVoyVD75" | jq '.' || echo "ERRO"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "5️⃣ Listando endpoints disponíveis..."
curl -s -X GET "https://public-api.kiwify.com/v1/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-kiwify-account-id: av8qNBGVVoyVD75" | jq '.' || echo "Endpoint raiz não disponível"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "6️⃣ Testando /v1/orders (pode ser o endpoint correto para pagamentos)..."
curl -s -X GET "https://public-api.kiwify.com/v1/orders?start_date=$START_DATE&end_date=$END_DATE" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-kiwify-account-id: av8qNBGVVoyVD75" | jq '.' || echo "ERRO"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "7️⃣ Verificando estrutura de uma venda específica para ver se tem dados de pagamento..."
SALE_ID="e4b8befe-4525-447d-bbd2-d54f7b1bd9a6"
curl -s -X GET "https://public-api.kiwify.com/v1/sales/$SALE_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-kiwify-account-id: av8qNBGVVoyVD75" | jq '.' || echo "ERRO"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "DIAGNÓSTICO COMPLETO"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "ENVIE TODO O OUTPUT ACIMA PARA ANÁLISE"
