#!/bin/bash

# ============================================================================
# Script de Migração para Arquitetura Segura
# ============================================================================
# Remove VITE_GEMINI_API_KEY do frontend e migra para Supabase Vault
# ============================================================================

set -e  # Abortar em caso de erro

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_REF="keawapzxqoyesptwpwav"
GEMINI_KEY="AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Migração para Arquitetura Segura${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================================================
# PASSO 1: Verificar Supabase CLI
# ============================================================================
echo -e "${YELLOW}[1/6] Verificando Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI não encontrado!${NC}"
    echo "Instale com: npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✓ Supabase CLI encontrado${NC}"
echo ""

# ============================================================================
# PASSO 2: Verificar Login
# ============================================================================
echo -e "${YELLOW}[2/6] Verificando autenticação...${NC}"
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}❌ Não autenticado no Supabase!${NC}"
    echo "Execute: supabase login"
    exit 1
fi
echo -e "${GREEN}✓ Autenticado no Supabase${NC}"
echo ""

# ============================================================================
# PASSO 3: Configurar Secret no Supabase Vault
# ============================================================================
echo -e "${YELLOW}[3/6] Configurando GEMINI_API_KEY no Supabase Vault...${NC}"

echo "$GEMINI_KEY" | supabase secrets set GEMINI_API_KEY \
  --project-ref $PROJECT_REF \
  --stdin > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Secret GEMINI_API_KEY configurado${NC}"
else
    echo -e "${RED}❌ Falha ao configurar secret${NC}"
    exit 1
fi
echo ""

# ============================================================================
# PASSO 4: Deploy da Edge Function
# ============================================================================
echo -e "${YELLOW}[4/6] Deploy da Edge Function gemini-proxy...${NC}"

if [ ! -f "supabase/functions/gemini-proxy/index.ts" ]; then
    echo -e "${RED}❌ Edge Function não encontrada!${NC}"
    echo "Arquivo esperado: supabase/functions/gemini-proxy/index.ts"
    exit 1
fi

supabase functions deploy gemini-proxy --project-ref $PROJECT_REF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Edge Function deployada${NC}"
else
    echo -e "${RED}❌ Falha no deploy da Edge Function${NC}"
    exit 1
fi
echo ""

# ============================================================================
# PASSO 5: Remover VITE_GEMINI_API_KEY do .env.production
# ============================================================================
echo -e "${YELLOW}[5/6] Removendo VITE_GEMINI_API_KEY do build...${NC}"

if [ -f ".env.production" ]; then
    # Backup do arquivo original
    cp .env.production .env.production.backup
    echo -e "${BLUE}  → Backup criado: .env.production.backup${NC}"

    # Remover linha com VITE_GEMINI_API_KEY
    sed -i '/VITE_GEMINI_API_KEY/d' .env.production
    echo -e "${GREEN}✓ VITE_GEMINI_API_KEY removida do .env.production${NC}"
else
    echo -e "${YELLOW}  ⚠ Arquivo .env.production não encontrado (OK se usar env vars do sistema)${NC}"
fi
echo ""

# ============================================================================
# PASSO 6: Rebuild da Aplicação
# ============================================================================
echo -e "${YELLOW}[6/6] Rebuild da aplicação SEM a chave no frontend...${NC}"

# Limpar build anterior
rm -rf dist/
echo -e "${BLUE}  → Build anterior removido${NC}"

# Rebuild
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build concluído${NC}"
else
    echo -e "${RED}❌ Falha no build${NC}"
    exit 1
fi

# Verificar que a chave NÃO está mais no bundle
if grep -r "AIzaSy" dist/ > /dev/null 2>&1; then
    echo -e "${RED}❌ ATENÇÃO: Chave ainda encontrada no bundle!${NC}"
    echo "Verifique se .env.production está correto"
    exit 1
else
    echo -e "${GREEN}✓ Chave NÃO encontrada no bundle (seguro!)${NC}"
fi
echo ""

# ============================================================================
# SUCESSO
# ============================================================================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ Migração Concluída com Sucesso!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

echo -e "${BLUE}Próximos passos:${NC}"
echo ""
echo "1. Reiniciar servidor:"
echo -e "   ${YELLOW}pm2 restart nutrimais${NC}"
echo ""
echo "2. Testar no navegador:"
echo "   - Acessar /plan"
echo "   - Adicionar alimentos e calcular porções"
echo "   - Deve funcionar normalmente via Edge Function"
echo ""
echo "3. Verificar logs da Edge Function:"
echo -e "   ${YELLOW}supabase functions logs gemini-proxy --tail${NC}"
echo ""

echo -e "${BLUE}Verificação de Segurança:${NC}"
echo ""
echo "✓ GEMINI_API_KEY está no Supabase Vault (backend)"
echo "✓ Edge Function gemini-proxy deployada"
echo "✓ Frontend não tem mais acesso direto à chave"
echo "✓ Chave não está mais no bundle JavaScript"
echo ""

echo -e "${GREEN}🔒 Sua aplicação agora está SEGURA!${NC}"
echo ""

# ============================================================================
# VERIFICAÇÕES ADICIONAIS
# ============================================================================
echo -e "${BLUE}Verificações Finais:${NC}"
echo ""

# Listar secrets configurados
echo "Secrets configurados no Supabase:"
supabase secrets list --project-ref $PROJECT_REF
echo ""

# Verificar funções deployadas
echo "Edge Functions deployadas:"
supabase functions list --project-ref $PROJECT_REF
echo ""

# Instruções para reverter (se necessário)
echo -e "${YELLOW}Para reverter (use apenas em emergência):${NC}"
echo "  cp .env.production.backup .env.production"
echo "  npm run build"
echo "  pm2 restart nutrimais"
echo ""

exit 0
