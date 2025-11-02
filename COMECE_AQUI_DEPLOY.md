# 🚀 COMECE AQUI: Deploy das Edge Functions

## ⚡ 3 Passos Rápidos

### PASSO 1: Pegar seu Access Token

1. **Clique aqui**: https://supabase.com/dashboard/account/tokens

2. Na página, clique no botão verde **"Generate new token"**

3. Digite um nome (ex: `deploy-cli`)

4. Clique em **"Generate token"**

5. **COPIE o token** que aparecer (começa com `sbp_...`)

⚠️ **IMPORTANTE**: Salve este token em local seguro! Você só verá ele uma vez.

---

### PASSO 2: Fazer Login no CLI

Abra o terminal e execute:

```bash
npx supabase login --token SEU_TOKEN_AQUI
```

**Exemplo:**
```bash
npx supabase login --token sbp_abc123def456ghi789jkl...
```

**Resultado esperado:**
```
✓ Logged in successfully
```

---

### PASSO 3: Fazer Deploy

Agora execute:

```bash
npx supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav
```

Aguarde uns 5-10 segundos...

**Resultado esperado:**
```
Deploying function kiwify-api...
✓ Deployed function kiwify-api
```

Repita para a segunda função:

```bash
npx supabase functions deploy kiwify-sync --project-ref keawapzxqoyesptwpwav
```

---

## ✅ Pronto! Agora Teste

Abra no navegador:

👉 http://localhost:3001/test-kiwify-oauth.html

Clique em **"Verificar Status OAuth"**

Deve aparecer:
```
✅ Autenticação OAuth VÁLIDA
Status: VÁLIDO
```

---

## 📋 Comandos Completos (Copie Tudo de Uma Vez)

```bash
# Passo 1: Login (cole seu token)
npx supabase login --token SEU_TOKEN_AQUI

# Passo 2: Deploy ambas as funções
npx supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav
npx supabase functions deploy kiwify-sync --project-ref keawapzxqoyesptwpwav
```

---

## ❌ Se Der Erro "Unauthorized"

Você não fez login ainda. Volte ao Passo 1 e 2.

## ❌ Se Der Erro "Docker is not running"

Ignore este aviso! É só um warning. O deploy vai funcionar mesmo assim.

---

## 🎯 Depois do Deploy

1. **Testar OAuth**: http://localhost:3001/test-kiwify-oauth.html
2. **Descobrir IDs dos Planos**: http://localhost:3001/test-kiwify-discover-plans.html
3. **Testar Sincronização**: http://localhost:3001/test-kiwify-sync.html

---

**Tudo pronto!** São só 3 passos simples. 🚀
