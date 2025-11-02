# 🚀 Deploy das Edge Functions via CLI

## Comandos Diretos (Copie e Cole)

### 1️⃣ Fazer Login no Supabase CLI

Primeiro, você precisa de um Access Token:

**Passo A - Gerar Token:**
1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em **"Generate new token"**
3. Dê um nome (ex: "deploy-cli")
4. Copie o token gerado

**Passo B - Fazer Login:**
```bash
npx supabase login --token seu-token-aqui
```

Substitua `seu-token-aqui` pelo token copiado.

**Verificar se está logado:**
```bash
npx supabase projects list
```

Deve mostrar seus projetos. Se aparecer "Unauthorized", o token está incorreto.

---

### 2️⃣ Deploy da Função kiwify-api

```bash
npx supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav
```

**Resultado esperado:**
```
Deploying function kiwify-api...
✓ Deployed function kiwify-api
```

---

### 3️⃣ Deploy da Função kiwify-sync

```bash
npx supabase functions deploy kiwify-sync --project-ref keawapzxqoyesptwpwav
```

**Resultado esperado:**
```
Deploying function kiwify-sync...
✓ Deployed function kiwify-sync
```

---

### 4️⃣ Deploy de Ambas de Uma Vez (Opcional)

```bash
npx supabase functions deploy kiwify-api kiwify-sync --project-ref keawapzxqoyesptwpwav
```

Ou deploy de TODAS as funções:
```bash
npx supabase functions deploy --project-ref keawapzxqoyesptwpwav
```

---

## 🛠️ Script Automatizado

Criamos um script que faz tudo automaticamente:

```bash
bash scripts/deploy-kiwify-functions.sh
```

Ou no Windows (PowerShell):
```powershell
npx supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav
npx supabase functions deploy kiwify-sync --project-ref keawapzxqoyesptwpwav
```

---

## ❌ Troubleshooting

### Erro: "Unauthorized"

**Causa:** Não está logado ou token expirou

**Solução:**
```bash
# Gerar novo token em: https://supabase.com/dashboard/account/tokens
npx supabase login --token seu-novo-token
```

---

### Erro: "Docker is not running"

**Causa:** Supabase CLI tenta usar Docker para build local

**Solução:** Ignore este aviso. O deploy remoto vai funcionar mesmo assim.

Ou desabilite Docker:
```bash
npx supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav --no-verify-jwt
```

---

### Erro: "Project not found"

**Causa:** `--project-ref` incorreto

**Solução:** Verifique o project ref:
```bash
npx supabase projects list
```

O correto é: `keawapzxqoyesptwpwav`

---

### Erro: "Function not found"

**Causa:** A função não existe localmente

**Solução:** Verifique se a pasta existe:
```bash
ls supabase/functions/kiwify-api
ls supabase/functions/kiwify-sync
```

Deve ter um arquivo `index.ts` em cada pasta.

---

## ✅ Verificar Deploy

Após o deploy, verifique se funcionou:

**1. Ver logs em tempo real:**
```bash
npx supabase functions logs kiwify-api --project-ref keawapzxqoyesptwpwav --follow
```

**2. Testar a função:**
```bash
curl -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8" \
  -d '{"action":"oauth_status"}'
```

**3. Ou use as ferramentas visuais:**
- http://localhost:3001/test-kiwify-oauth.html

---

## 📋 Comandos de Referência Rápida

```bash
# Login
npx supabase login --token SEU_TOKEN

# Listar projetos
npx supabase projects list

# Deploy kiwify-api
npx supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav

# Deploy kiwify-sync
npx supabase functions deploy kiwify-sync --project-ref keawapzxqoyesptwpwav

# Deploy todas as funções
npx supabase functions deploy --project-ref keawapzxqoyesptwpwav

# Ver logs
npx supabase functions logs kiwify-api --project-ref keawapzxqoyesptwpwav

# Ver logs em tempo real
npx supabase functions logs kiwify-api --project-ref keawapzxqoyesptwpwav --follow

# Listar funções deployadas
npx supabase functions list --project-ref keawapzxqoyesptwpwav
```

---

## 🎯 Resumo do Fluxo Completo

```bash
# 1. Login (uma vez)
npx supabase login --token SEU_TOKEN

# 2. Deploy das funções
npx supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav
npx supabase functions deploy kiwify-sync --project-ref keawapzxqoyesptwpwav

# 3. Verificar
curl -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ..." \
  -d '{"action":"oauth_status"}'

# 4. Testar visualmente
# Abra: http://localhost:3001/test-kiwify-oauth.html
```

---

## 💡 Dicas

1. **Você só precisa fazer login UMA VEZ**. O token fica salvo.

2. **O deploy é rápido** (5-10 segundos por função).

3. **Não precisa fazer build local**. O Supabase faz o build no servidor.

4. **Os Secrets já estão configurados** no dashboard. O deploy vai usar eles automaticamente.

5. **Após o deploy**, teste imediatamente com as ferramentas:
   - test-kiwify-oauth.html
   - test-kiwify-discover-plans.html
   - test-kiwify-sync.html

---

## 📞 Próximos Passos

1. ✅ Fazer login: `npx supabase login --token SEU_TOKEN`
2. ✅ Deploy: `npx supabase functions deploy kiwify-api kiwify-sync --project-ref keawapzxqoyesptwpwav`
3. ✅ Testar: http://localhost:3001/test-kiwify-oauth.html
4. ✅ Descobrir IDs: http://localhost:3001/test-kiwify-discover-plans.html
5. ✅ Configurar IDs nos Secrets
6. ✅ Deploy novamente
7. ✅ Sincronizar: http://localhost:3001/test-kiwify-sync.html

---

**Precisa de ajuda?** Copie a mensagem de erro e me envie!
