# 🐛 Troubleshooting - Problemas em Produção

## ❌ Erro: "Invalid API key" na Tela de Login

### 📋 Sintomas

- Erro exibido: `Invalid API key`
- Ocorre na página de login (`/auth`)
- Login não funciona ou apresenta mensagem de erro

### 🔍 Causa Raiz

O erro "Invalid API key" **NÃO está relacionado ao login**, mas sim à **API do Gemini** que pode estar sendo chamada em algum lugar da aplicação.

**Possíveis causas:**

1. ✅ **Mais Provável**: Variável `VITE_GEMINI_API_KEY` não configurada no servidor
2. ⚠️ **Possível**: Gemini API key inválida ou expirada
3. ⚠️ **Menos Provável**: Chamada ao Gemini durante carregamento da página

### 🔧 Solução 1: Configurar Gemini API Key (Recomendado)

#### Opção A: Usar Edge Function (MAIS SEGURO)

**IMPORTANTE:** Esta é a forma mais segura, pois a chave fica no backend.

1. **Configurar no Supabase Vault:**

```bash
# Via Dashboard:
https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets

# Adicionar secret:
Name: GEMINI_API_KEY
Value: AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo
```

2. **Verificar se Edge Function está deployada:**

```bash
supabase functions list --project-ref keawapzxqoyesptwpwav

# Deve listar:
# - gemini-proxy (ou similar)
# - kiwify-api
# - kiwify-webhook
```

3. **Deploy da Edge Function (se necessário):**

```bash
cd ~/projetos/nutrimais
supabase functions deploy gemini-proxy --project-ref keawapzxqoyesptwpwav
```

#### Opção B: Variável de Ambiente no Build (MENOS SEGURO)

**⚠️ ATENÇÃO:** Isso expõe a API key no frontend!

1. **Criar arquivo `.env.production`:**

```bash
cd ~/projetos/nutrimais

cat > .env.production << 'EOF'
VITE_SUPABASE_URL=https://keawapzxqoyesptwpwav.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8
VITE_GEMINI_API_KEY=AIzaSyBcnk5mEwW3Fr_yQQofEaTX5ftLGMIEtEo
VITE_KIWIFY_CHECKOUT_MONTHLY=https://pay.kiwify.com.br/uJP288j
VITE_KIWIFY_CHECKOUT_QUARTERLY=https://pay.kiwify.com.br/U170qMX
VITE_KIWIFY_CHECKOUT_ANNUAL=https://pay.kiwify.com.br/mHorNkF
EOF
```

2. **Rebuild da aplicação:**

```bash
npm run build
```

3. **Reiniciar servidor (se necessário):**

```bash
# Se usar PM2:
pm2 restart nutrimais

# Se usar systemd:
sudo systemctl restart nutrimais

# Se usar nginx:
sudo systemctl restart nginx
```

### 🔧 Solução 2: Remover Chamadas Desnecessárias ao Gemini

Se o erro persiste e você não precisa do Gemini no login:

#### Verificar onde o Gemini está sendo chamado:

```bash
cd ~/projetos/nutrimais

# Procurar por chamadas ao Gemini
grep -r "gemini" pages/AuthPage.tsx
grep -r "GEMINI" pages/AuthPage.tsx
```

#### Se encontrar chamadas desnecessárias, comente ou remova:

```typescript
// Exemplo: remover validação de API key no carregamento
// if (!import.meta.env.VITE_GEMINI_API_KEY) {
//   console.error('Gemini API key não configurada');
// }
```

### 🧪 Testar a Correção

#### 1. Limpar cache do navegador:

- Chrome: `Ctrl + Shift + Delete` → Limpar cache
- Firefox: `Ctrl + Shift + Delete` → Limpar cache
- Ou teste em modo anônimo

#### 2. Verificar se erro sumiu:

1. Abrir `/auth`
2. Abrir DevTools (F12) → Console
3. Verificar se há erros
4. Tentar fazer login

#### 3. Verificar logs do servidor:

```bash
# Ver logs do build
npm run build 2>&1 | grep -i error

# Ver logs do servidor (PM2)
pm2 logs nutrimais --lines 50

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

### ✅ Validação Final

Após aplicar a solução, verifique:

- [ ] Login funciona normalmente
- [ ] Erro "Invalid API key" não aparece mais
- [ ] Console do navegador sem erros
- [ ] Usuário consegue autenticar

---

## ❌ Erro: Links de Assinatura Não Abrem

### 📋 Sintomas

- Botão "Assinar Agora" não faz nada
- Nenhum redirecionamento acontece
- Console mostra: `[ERROR] Kiwify checkout URL missing for plan`

### 🔍 Causa

Variáveis `VITE_KIWIFY_CHECKOUT_*` não configuradas no build.

### 🔧 Solução

Seguir: [DEPLOY_INSTRUCTIONS.md](./DEPLOY_INSTRUCTIONS.md)

1. Adicionar variáveis ao `.env.production`
2. Rebuild: `npm run build`
3. Verificar logs no console do navegador

---

## ❌ Erro: Banco de Dados / Supabase

### 📋 Sintomas

- "Failed to fetch"
- "Network error"
- "CORS policy"

### 🔧 Solução

1. **Verificar URL do Supabase:**

```bash
# Deve estar em .env.production:
VITE_SUPABASE_URL=https://keawapzxqoyesptwpwav.supabase.co
```

2. **Verificar ANON KEY:**

```bash
# Obter no dashboard:
https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/api

# Copiar "anon public" key
```

3. **Verificar CORS no Supabase:**

- Dashboard → Settings → API
- Allowed origins: adicionar seu domínio de produção

---

## ❌ Erro: 404 / Página Não Encontrada

### 📋 Sintomas

- Refresh na página dá 404
- Apenas `/` funciona
- Rotas como `/auth`, `/app` dão erro

### 🔧 Solução

Configurar fallback para SPA no servidor web.

#### Nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

#### Apache (.htaccess):

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

---

## 🆘 Suporte Adicional

### Logs Úteis

```bash
# Logs do build
npm run build 2>&1 | tee build.log

# Logs do Supabase Edge Functions
supabase functions logs --tail

# Logs do browser (F12 → Console)
# Copiar e enviar
```

### Informações para Debugging

Ao reportar problemas, inclua:

1. ✅ Mensagem de erro completa
2. ✅ Screenshot do console (F12)
3. ✅ Logs do servidor
4. ✅ Versão do Node.js: `node --version`
5. ✅ Comando de build usado
6. ✅ Variáveis de ambiente configuradas (SEM valores sensíveis)

---

**Última atualização:** 2025-01-30
