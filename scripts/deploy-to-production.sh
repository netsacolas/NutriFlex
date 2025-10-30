#!/bin/bash

# Script de Deploy para Produção - NutriMais
# Uso: bash scripts/deploy-to-production.sh

set -e  # Para em caso de erro

echo "🚀 Iniciando processo de deploy..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na raiz do projeto${NC}"
    exit 1
fi

# 2. Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Há mudanças não commitadas:${NC}"
    git status --short
    echo ""
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deploy cancelado."
        exit 1
    fi
fi

# 3. Mostrar último commit
echo -e "${GREEN}📝 Último commit:${NC}"
git log -1 --oneline
echo ""

# 4. Limpar build anterior
echo "🧹 Limpando build anterior..."
if [ -d "dist" ]; then
    rm -rf dist/
    echo "   ✓ Pasta dist/ removida"
fi

# 5. Instalar dependências (se necessário)
echo ""
echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "   Instalando dependências..."
    npm install
else
    echo "   ✓ Dependências já instaladas"
fi

# 6. Fazer build de produção
echo ""
echo "🔨 Fazendo build de produção..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erro: Build falhou, pasta dist/ não foi criada${NC}"
    exit 1
fi

# 7. Verificar arquivos gerados
echo ""
echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
echo ""
echo "📦 Arquivos gerados:"
ls -lh dist/
echo ""
echo "📦 Arquivos em dist/assets/:"
ls -lh dist/assets/ | grep -E "\.(js|css)$"

# 8. Calcular hash do novo build
NEW_HASH=$(find dist/assets/ -name "index-*.js" -exec basename {} \; | head -1)
echo ""
echo -e "${GREEN}🆕 Novo arquivo principal: ${NEW_HASH}${NC}"

# 9. Instruções de deploy
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}📤 PRÓXIMOS PASSOS PARA DEPLOY:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  LIMPAR CACHE DO SERVIDOR:"
echo "   - Vercel: Settings > Domains > Invalidate Cache"
echo "   - Netlify: Deploys > Trigger deploy > Clear cache"
echo "   - Outro: Delete arquivos antigos antes de fazer upload"
echo ""
echo "2️⃣  FAZER UPLOAD:"
echo "   Envie TODO o conteúdo da pasta 'dist/' para o servidor"
echo "   📂 Arquivos em: $(pwd)/dist/"
echo ""
echo "3️⃣  VERIFICAR DEPLOY:"
echo "   - Limpe cache do navegador (Ctrl + Shift + R)"
echo "   - Abra F12 > Network"
echo "   - Verifique se carregou: ${NEW_HASH}"
echo "   - Teste a página /history"
echo ""
echo "4️⃣  VERIFICAR LOGS:"
echo "   Console deve mostrar: [HistoryPage] logs"
echo "   Console NÃO deve mostrar: 'historyLimited is not defined'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 10. Opção de abrir pasta dist
echo ""
read -p "Deseja abrir a pasta dist/ agora? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        explorer dist
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open dist
    else
        # Linux
        xdg-open dist 2>/dev/null || echo "Pasta: $(pwd)/dist"
    fi
fi

echo ""
echo -e "${GREEN}✅ Script concluído!${NC}"
echo "📚 Consulte DEPLOY_FIX_URGENTE.md para mais detalhes"
