# 🚨 DEPLOY URGENTE - Correção da Página de Histórico

## Problema Identificado

O erro no console de produção mostra:
```
Uncaught ReferenceError: historyLimited is not defined
at ti (index-Baqy6K4X.js:21:265626)
```

**Causa**: O build antigo está em produção e não tem as correções que fizemos.

**Solução**: Deploy do novo build com as correções.

---

## 🔧 Passo a Passo para Deploy

### 1. Faça o build da nova versão

```bash
cd c:\NutriMais
npm run build
```

Você deve ver:
```
✓ 239 modules transformed.
✓ built in ~9s
```

### 2. Identifique os arquivos do build

Os arquivos estarão em `c:\NutriMais\dist\`:
```
dist/
├── index.html
├── assets/
│   ├── index-[NOVO-HASH].js  <--- ESTE É O NOVO ARQUIVO
│   ├── react-vendor-[hash].js
│   ├── supabase-[hash].js
│   └── ...
```

**IMPORTANTE**: O nome do arquivo `index-*.js` mudará!
- Antigo: `index-Baqy6K4X.js`
- Novo: `index-[NOVO-HASH].js` (hash diferente)

### 3. Limpe o cache do servidor

**ANTES** de fazer upload dos novos arquivos, você precisa:

#### Opção A: Limpar cache no provedor de hospedagem

Se estiver usando **Vercel**:
```bash
# No painel da Vercel
1. Vá em Settings > Domains
2. Clique em "Invalidate Cache"
```

Se estiver usando **Netlify**:
```bash
# No painel da Netlify
1. Vá em Deploys
2. Clique em "Trigger deploy" > "Clear cache and deploy site"
```

Se estiver usando **outro provedor**:
- Procure opção "Clear Cache" ou "Invalidate Cache"
- OU delete todos os arquivos antigos antes de fazer upload

#### Opção B: Limpar via .htaccess (Apache)

Se tiver acesso ao `.htaccess`, adicione:
```apache
<IfModule mod_headers.c>
    # Força revalidação de arquivos JS
    <FilesMatch "\.(js|css)$">
        Header set Cache-Control "no-cache, must-revalidate"
    </FilesMatch>
</IfModule>
```

### 4. Faça upload dos novos arquivos

**IMPORTANTE**: Substitua TODOS os arquivos, não apenas alguns!

```bash
# Se estiver usando FTP/SFTP
1. Delete a pasta /assets/ do servidor
2. Faça upload de todo o conteúdo de dist/ para o servidor
3. Substitua o index.html

# Se estiver usando Git + deploy automático
git add dist/
git commit -m "Deploy: Fix history page - historyLimited undefined"
git push origin main
```

### 5. Verifique se o deploy funcionou

1. **Limpe o cache do NAVEGADOR**:
   - Chrome/Edge: `Ctrl + Shift + Delete` > Limpar cache
   - OU: `Ctrl + Shift + R` (hard refresh)

2. **Verifique o nome do arquivo JS**:
   - Abra `https://www.nutrimais.app`
   - Pressione `F12` > Aba "Network"
   - Recarregue a página
   - Procure por `index-*.js`
   - **O nome deve ser DIFERENTE de** `index-Baqy6K4X.js`

3. **Teste a página de histórico**:
   - Vá para `/history`
   - Não deve mais aparecer tela preta
   - Console NÃO deve mostrar "historyLimited is not defined"

---

## 🔍 Logs Esperados Após Deploy

Quando acessar `/history`, você DEVE ver estes logs no console:

```
[HistoryPage] Iniciando carregamento de dados...
[HistoryPage] Verificando sessão...
[HistoryPage] Sessão encontrada: 67cf7242-8213-488e-823a-bcb4c267221d
[HistoryPage] Carregando perfil do usuário...
[HistoryPage] Perfil carregado, dados completos: true
[HistoryPage] Carregando históricos...
[HistoryPage] Dados carregados: { meals: X, activities: Y, weights: Z }
[HistoryPage] Aplicando filtros...
[HistoryPage] Aplicando limites do plano...
[HistoryPage] Dados finais: { meals: X, activities: Y, weights: Z }
[HistoryPage] Carregamento concluído com sucesso!
```

Se você **NÃO** vir estes logs, o deploy não foi realizado corretamente.

---

## ⚠️ Problemas Secundários Identificados

Além do bug da página de histórico, o console mostra outro problema:

### Tabela `user_subscriptions` não existe (404)

```
Failed to load resource: the server responded with a status of 404 ()
keawapzxqoyesptwpwav.supabase.co/rest/v1/user_subscriptions
```

**Isso significa**: A migração `009_add_subscriptions.sql` não foi aplicada em produção.

**Impacto**:
- Sistema de assinaturas não funciona
- Limites de plano não são aplicados corretamente
- Webhook da Kiwify vai falhar

**Solução**: Após corrigir a página de histórico, aplicar a migração:

```bash
# Opção 1: Via Supabase CLI
supabase db push --project-ref keawapzxqoyesptwpwav

# Opção 2: Via Editor SQL do Supabase
1. Acesse https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/editor
2. Abra o arquivo supabase/migrations/009_add_subscriptions.sql
3. Copie e cole o conteúdo no editor SQL
4. Execute
```

---

## 📋 Checklist Final

- [ ] Build realizado (`npm run build`)
- [ ] Cache do servidor limpo
- [ ] Novos arquivos enviados para produção
- [ ] Cache do navegador limpo (`Ctrl + Shift + R`)
- [ ] Nome do arquivo JS mudou (não é mais `index-Baqy6K4X.js`)
- [ ] Página `/history` carrega sem tela preta
- [ ] Console mostra logs `[HistoryPage]`
- [ ] Console NÃO mostra "historyLimited is not defined"
- [ ] (Opcional) Migração `009_add_subscriptions.sql` aplicada

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique o arquivo em produção**:
   - Acesse `https://www.nutrimais.app/assets/index-[HASH].js` diretamente
   - Procure por "historyLimited" no código
   - Deve aparecer a definição: `const historyLimited = limits.historyItems !== null`

2. **Force cache-busting**:
   - Adicione `?v=2` na URL: `https://www.nutrimais.app/?v=2`
   - Teste `/history?v=2`

3. **Me envie**:
   - Screenshot do console com os novos logs (ou falta deles)
   - Nome do arquivo JS que está carregando
   - Provedor de hospedagem que está usando

---

**Última atualização**: 2025-10-30 20:45 BRT
**Commit com correção**: ebea84e
