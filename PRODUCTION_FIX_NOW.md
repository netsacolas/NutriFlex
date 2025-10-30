# 🚨 CORREÇÃO URGENTE - Erro "Invalid API key" em Produção

## ⚡ Solução Rápida (5 minutos)

O erro ocorre porque o ambiente de produção não tem acesso à chave do Gemini.

### 📋 Execute no Servidor (srv798617)

```bash
# 1. Navegar para o projeto
cd ~/projetos/nutrimais

# 2. Fazer pull das últimas alterações
git pull origin main

# 3. Criar arquivo .env.production com TODAS as variáveis
cat > .env.production << 'EOF'
# Supabase
VITE_SUPABASE_URL=https://keawapzxqoyesptwpwav.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8

# Gemini API Key (⚠️ Isso expõe a chave no bundle, mas resolve o problema imediato)
VITE_GEMINI_API_KEY=AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo

# Kiwify Checkout URLs
VITE_KIWIFY_CHECKOUT_MONTHLY=https://pay.kiwify.com.br/uJP288j
VITE_KIWIFY_CHECKOUT_QUARTERLY=https://pay.kiwify.com.br/U170qMX
VITE_KIWIFY_CHECKOUT_ANNUAL=https://pay.kiwify.com.br/mHorNkF
EOF

# 4. Rebuild do projeto (IMPORTANTE!)
npm run build

# 5. Verificar se build foi bem-sucedido
echo "Build concluído! Verificando arquivo dist/index.html..."
ls -lh dist/index.html

# 6. Reiniciar o servidor web (escolha o comando correto)
# Se usar PM2:
pm2 restart nutrimais

# Se usar systemd:
# sudo systemctl restart nutrimais

# Se usar apenas nginx:
# sudo systemctl reload nginx

# 7. Verificar se está funcionando
curl -I http://localhost:5173  # ou a porta que você usa
```

### ✅ Validação

1. **Abrir o navegador** e acessar o site
2. **Abrir DevTools** (F12) → Console
3. **Fazer login** com suas credenciais
4. **Verificar se o erro sumiu**

### 🔍 Se o erro persistir

```bash
# Verificar se as variáveis foram incluídas no build
cd ~/projetos/nutrimais
grep -r "keawapzxqoyesptwpwav" dist/

# Deve retornar várias ocorrências
# Se não retornar nada, o build não incluiu as variáveis
```

---

## 🔐 Solução Mais Segura (Recomendada para depois)

Após resolver o problema urgente, migre para Edge Functions:

### 1. Configurar Gemini API Key no Supabase Vault

```bash
# Via CLI:
echo "AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo" | \
  supabase secrets set GEMINI_API_KEY \
  --project-ref keawapzxqoyesptwpwav \
  --stdin

# Verificar:
supabase secrets list --project-ref keawapzxqoyesptwpwav
```

### 2. Deploy da Edge Function

```bash
cd ~/projetos/nutrimais

# Verificar se a função existe
ls supabase/functions/gemini-proxy/index.ts

# Deploy
supabase functions deploy gemini-proxy --project-ref keawapzxqoyesptwpwav

# Verificar logs
supabase functions logs gemini-proxy --tail
```

### 3. Remover VITE_GEMINI_API_KEY do .env.production

```bash
# Editar e remover a linha VITE_GEMINI_API_KEY
nano .env.production

# Rebuild
npm run build

# Reiniciar
pm2 restart nutrimais
```

---

## 📊 Diagnóstico Detalhado

### Por que o erro ocorre?

**Em desenvolvimento:**
- ✅ Arquivo `.env.local` existe com `VITE_GEMINI_API_KEY`
- ✅ Vite injeta a variável no bundle
- ✅ Funciona normalmente

**Em produção:**
- ❌ Arquivo `.env.production` não existe OU não tem `VITE_GEMINI_API_KEY`
- ❌ Build não inclui a variável
- ❌ Runtime tenta usar `undefined` como API key
- ❌ Google retorna "Invalid API key"

### Onde o erro aparece?

O erro vem da tentativa de chamar o Gemini sem uma chave válida. Pode ser:

1. **Edge Function não deployada** → cai no fallback direto
2. **Variável não injetada no build** → `import.meta.env.VITE_GEMINI_API_KEY` = undefined
3. **Build antigo em cache** → servidor está servindo bundle sem as variáveis

---

## 🆘 Comandos Úteis para Debug

```bash
# Ver variáveis de ambiente no processo
pm2 env 0  # ou o ID do processo

# Ver logs do build
npm run build 2>&1 | tee build.log
cat build.log | grep -i error

# Ver logs do servidor
pm2 logs nutrimais --lines 100

# Testar Edge Function diretamente
curl -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/gemini-proxy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "mealType": "lunch",
    "targetCalories": 600,
    "foods": ["arroz", "feijão"]
  }'
```

---

## 📞 Se Nada Funcionar

Envie as seguintes informações:

1. **Resultado do comando:**
   ```bash
   cd ~/projetos/nutrimais && cat .env.production
   ```

2. **Log do build:**
   ```bash
   npm run build 2>&1 | tail -50
   ```

3. **Estrutura do dist:**
   ```bash
   ls -lh dist/
   ```

4. **Verificar se variável foi injetada:**
   ```bash
   grep -o "keawapzxqoyesptwpwav" dist/assets/*.js | head -5
   ```

---

**⏱️ Tempo estimado:** 5 minutos
**🎯 Prioridade:** ALTA
**📅 Data:** 2025-01-30
