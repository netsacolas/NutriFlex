#!/bin/bash

echo "🚀 Deploy das Edge Functions Kiwify"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se está logado
echo "1️⃣ Verificando autenticação..."
npx supabase projects list

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Você não está autenticado no Supabase CLI"
  echo ""
  echo "Para fazer login, você precisa de um Access Token:"
  echo "1. Acesse: https://supabase.com/dashboard/account/tokens"
  echo "2. Clique em 'Generate new token'"
  echo "3. Copie o token"
  echo "4. Execute: npx supabase login --token seu-token-aqui"
  echo ""
  exit 1
fi

echo ""
echo "✅ Autenticado!"
echo ""

# Deploy kiwify-api
echo "2️⃣ Fazendo deploy de kiwify-api..."
npx supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav

if [ $? -eq 0 ]; then
  echo "✅ kiwify-api deployed com sucesso!"
else
  echo "❌ Erro ao fazer deploy de kiwify-api"
  exit 1
fi

echo ""

# Deploy kiwify-sync
echo "3️⃣ Fazendo deploy de kiwify-sync..."
npx supabase functions deploy kiwify-sync --project-ref keawapzxqoyesptwpwav

if [ $? -eq 0 ]; then
  echo "✅ kiwify-sync deployed com sucesso!"
else
  echo "❌ Erro ao fazer deploy de kiwify-sync"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deploy concluído com sucesso!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Próximos passos:"
echo "1. Teste OAuth: http://localhost:3001/test-kiwify-oauth.html"
echo "2. Descubra IDs: http://localhost:3001/test-kiwify-discover-plans.html"
echo "3. Teste Sync: http://localhost:3001/test-kiwify-sync.html"
echo ""
