#!/bin/bash

# ============================================
# Script: Configurar Secrets Kiwify no Supabase
# ============================================

echo "🔐 Configurando Secrets da Kiwify no Supabase..."
echo ""

# Credenciais OAuth
echo "1️⃣ Configurando credenciais OAuth..."
npx supabase secrets set KIWIFY_CLIENT_ID="4c747409-c212-45d1-aaf9-4a5d43dac808"
npx supabase secrets set KIWIFY_CLIENT_SECRET="seu-client-secret-aqui"
npx supabase secrets set KIWIFY_ACCOUNT_ID="av8qNBGVVoyVD75"

echo ""
echo "2️⃣ Configurando URLs do Supabase..."
npx supabase secrets set SUPABASE_URL="https://keawapzxqoyesptwpwav.supabase.co"
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key-aqui"

echo ""
echo "3️⃣ Configurando IDs dos Planos (deixar vazio por enquanto)..."
npx supabase secrets set KIWIFY_PLAN_MONTHLY_ID=""
npx supabase secrets set KIWIFY_PLAN_QUARTERLY_ID=""
npx supabase secrets set KIWIFY_PLAN_ANNUAL_ID=""

echo ""
echo "✅ Secrets configurados!"
echo ""
echo "📋 Próximos passos:"
echo "1. Verifique os secrets: npx supabase secrets list"
echo "2. Redeploy das Edge Functions: npx supabase functions deploy kiwify-api"
echo "3. Teste a conexão: abra test-kiwify-discover-plans.html"
echo ""
