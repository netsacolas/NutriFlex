#!/bin/bash

echo "📋 Verificando logs da Edge Function kiwify-api"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Últimos 20 logs da função kiwify-api:"
echo ""

npx supabase functions logs kiwify-api --project-ref keawapzxqoyesptwpwav --limit 20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Procure por erros relacionados a:"
echo "   - Missing credentials"
echo "   - KIWIFY_CLIENT_SECRET"
echo "   - OAuth token"
echo "   - Failed to fetch"
echo ""
