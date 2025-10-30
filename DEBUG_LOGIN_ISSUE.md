# 🐛 Debug: Login Não Redireciona

## 🔍 Problema Reportado

**Sintomas:**
- Usuário clica em "Entrar"
- Erro "Invalid API key" não aparece mais ✅
- Página **não redireciona** para /home ❌
- Fica na tela de login

## 📊 Logs de Debug Adicionados

Adicionados logs detalhados no `AuthPage.tsx` para rastrear o fluxo:

```typescript
// LOGS ADICIONADOS:
[AuthPage] Iniciando login... { email: "..." }
[AuthPage] Resultado do login: { hasUser: true/false, hasError: true/false }
[AuthPage] Login bem-sucedido! Navegando para /home...
[AuthPage] Erro no login: "mensagem"
[AuthPage] Exceção capturada: erro
[AuthPage] Finalizando processo de autenticação
```

## 🔧 Como Diagnosticar no Servidor

### 1. Verificar Logs no Console do Navegador

```bash
# No servidor, acessar o site em produção
# Abrir DevTools (F12) → Console
# Tentar fazer login
# Copiar TODOS os logs que aparecerem
```

### 2. Verificar se URL do Supabase está Correta

```bash
cd ~/projetos/nutrimais

# Verificar se variável foi injetada no build
grep -o "keawapzxqoyesptwpwav" dist/assets/*.js | head -5

# Deve retornar várias ocorrências
# Se não retornar NADA, o build não incluiu as variáveis!
```

### 3. Testar Autenticação Diretamente

```bash
# Teste via curl
curl -X POST 'https://keawapzxqoyesptwpwav.supabase.co/auth/v1/token?grant_type=password' \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8" \
  -d '{
    "email": "netsacolas@gmail.com",
    "password": "sua_senha_aqui"
  }'

# Resposta esperada:
# {
#   "access_token": "...",
#   "user": { "id": "...", "email": "..." }
# }
```

## 🎯 Possíveis Causas e Soluções

### Causa 1: Build Antigo (Mais Provável)

**Problema:** Servidor está servindo bundle antigo sem as variáveis de ambiente

**Solução:**
```bash
cd ~/projetos/nutrimais

# 1. Limpar build anterior
rm -rf dist/

# 2. Rebuild com variáveis
npm run build

# 3. Verificar que dist/ foi recriado
ls -lh dist/

# 4. Reiniciar servidor
pm2 restart nutrimais

# 5. Limpar cache do navegador (CTRL + SHIFT + DEL)
```

### Causa 2: Variáveis Não Incluídas no Build

**Problema:** .env.production não está sendo lido pelo Vite

**Solução:**
```bash
cd ~/projetos/nutrimais

# Verificar se arquivo existe
ls -la .env.production

# Verificar conteúdo
cat .env.production

# Deve conter TODAS as variáveis:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
# VITE_GEMINI_API_KEY=...
# VITE_KIWIFY_CHECKOUT_MONTHLY=...
# VITE_KIWIFY_CHECKOUT_QUARTERLY=...
# VITE_KIWIFY_CHECKOUT_ANNUAL=...
```

**Se estiver faltando, recriar:**
```bash
cat > .env.production << 'EOF'
VITE_SUPABASE_URL=https://keawapzxqoyesptwpwav.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8
VITE_GEMINI_API_KEY=AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo
VITE_KIWIFY_CHECKOUT_MONTHLY=https://pay.kiwify.com.br/uJP288j
VITE_KIWIFY_CHECKOUT_QUARTERLY=https://pay.kiwify.com.br/U170qMX
VITE_KIWIFY_CHECKOUT_ANNUAL=https://pay.kiwify.com.br/mHorNkF
EOF

npm run build
pm2 restart nutrimais
```

### Causa 3: CORS ou Supabase Bloqueado

**Problema:** Requisição para Supabase está sendo bloqueada

**Como verificar:**
```
F12 → Network → Tentar login → Ver se há requisições falhando
```

**Solução:**
```
1. Supabase Dashboard → Settings → API
2. Verificar "Allowed origins"
3. Adicionar domínio de produção: https://seusite.com
```

### Causa 4: AuthContext Não Atualizando

**Problema:** Estado do usuário não é atualizado após login

**Como verificar:**
```javascript
// No console do navegador após tentar login:
window.__SUPABASE_CLIENT.auth.getSession()
  .then(({ data }) => console.log('Session:', data))
```

### Causa 5: React Router Não Navegando

**Problema:** navigate('/home') não funciona

**Solução Temporária:**
Usar redirecionamento nativo:
```typescript
// Em AuthPage.tsx linha 99, trocar:
navigate('/home');

// Por:
window.location.href = '/home';
```

## 📋 Checklist de Verificação

Execute cada item e marque:

- [ ] `.env.production` existe e está completo
- [ ] `npm run build` executado SEM erros
- [ ] `dist/` contém arquivos novos (verificar data/hora)
- [ ] Servidor reiniciado após build
- [ ] Cache do navegador limpo (Ctrl+Shift+Del)
- [ ] Console do navegador mostra logs `[AuthPage]`
- [ ] Requisições ao Supabase aparecem no Network
- [ ] Nenhum erro CORS no console

## 🆘 Se Nada Funcionar

Envie as seguintes informações:

### 1. Logs do Console do Navegador
```
# Abrir F12 → Console
# Copiar TODOS os logs ao tentar fazer login
```

### 2. Screenshot do Network
```
# F12 → Network
# Tentar login
# Screenshot das requisições (especialmente as que falharam)
```

### 3. Resultado dos Comandos
```bash
# No servidor:
cd ~/projetos/nutrimais

# Verificar variáveis no build
grep -i "supabase" dist/assets/*.js | head -3

# Verificar data do build
ls -lh dist/index.html

# Ver logs do PM2
pm2 logs nutrimais --lines 20
```

## 🔄 Solução Rápida de Emergência

Se nada funcionar, tente esta solução de emergência:

```bash
cd ~/projetos/nutrimais

# 1. Limpar tudo
rm -rf dist/ node_modules/.vite

# 2. Garantir .env.production correto
cat .env.production  # verificar conteúdo

# 3. Rebuild do zero
npm run build 2>&1 | tee build.log

# 4. Verificar se build teve sucesso
tail build.log

# 5. Reiniciar TUDO
pm2 delete nutrimais
pm2 start npm --name "nutrimais" -- run preview
```

---

**Data:** 2025-01-30
**Status:** Em investigação
**Prioridade:** ALTA
