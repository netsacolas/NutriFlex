#!/bin/bash

###############################################################################
# QUICK SETUP - Secrets Kiwify (Sem Confirmações)
#
# Este script configura os 3 Secrets obrigatórios automaticamente.
# Uso: bash scripts/quick-setup-kiwify.sh
###############################################################################

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "🔐 Quick Setup - Secrets Kiwify"
echo ""

# Verificar CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI não encontrado${NC}"
    echo "Instale: npm install -g supabase"
    exit 1
fi

# Verificar login
if ! supabase projects list &> /dev/null 2>&1; then
    echo -e "${BLUE}ℹ️  Fazendo login...${NC}"
    supabase login
fi

# Project ref
PROJECT_REF="keawapzxqoyesptwpwav"

# Credenciais
KIWIFY_CLIENT_ID="4c7f47409-c212-45d1-aaf9-4a5d43dac808"
KIWIFY_CLIENT_SECRET="00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac"
KIWIFY_ACCOUNT_ID="av8qNBGVVoyVD75"

echo -e "${BLUE}📋 Configurando secrets...${NC}"
echo ""

# Secret 1
echo -n "1/3 KIWIFY_CLIENT_ID... "
if echo "$KIWIFY_CLIENT_ID" | supabase secrets set KIWIFY_CLIENT_ID --project-ref $PROJECT_REF > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    exit 1
fi

# Secret 2
echo -n "2/3 KIWIFY_CLIENT_SECRET... "
if echo "$KIWIFY_CLIENT_SECRET" | supabase secrets set KIWIFY_CLIENT_SECRET --project-ref $PROJECT_REF > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    exit 1
fi

# Secret 3
echo -n "3/3 KIWIFY_ACCOUNT_ID... "
if echo "$KIWIFY_ACCOUNT_ID" | supabase secrets set KIWIFY_ACCOUNT_ID --project-ref $PROJECT_REF > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Secrets configurados!${NC}"
echo ""

# Listar
echo "📝 Secrets no Vault:"
supabase secrets list --project-ref $PROJECT_REF

echo ""
echo -e "${BLUE}⏳ Aguarde 30 segundos para propagação...${NC}"
sleep 30

echo ""
echo -e "${GREEN}✨ Pronto! Próximos passos:${NC}"
echo ""
echo "  1. Deploy: supabase functions deploy kiwify-api"
echo "  2. Testar: node scripts/test-kiwify-integration.js"
echo ""
