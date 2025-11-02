# 🚀 Guia Rápido: Resolver Problema de Reconhecimento Kiwify

## ❌ Problema

As compras realizadas na Kiwify não estão sendo reconhecidas pelo sistema porque **faltam os IDs dos planos nas variáveis de ambiente**.

## ✅ Solução em 3 Passos

### 1️⃣ Descobrir IDs dos Planos

Abra no navegador: **http://localhost:3001/test-kiwify-discover-plans.html**

1. Digite o email de um usuário que tenha compra ativa na Kiwify
2. Clique em "Descobrir Planos"
3. Copie os IDs que aparecerem

### 2️⃣ Atualizar `.env.local`

Cole os IDs descobertos no arquivo `.env.local`:

```env
# Kiwify Plan IDs (para mapeamento correto)
KIWIFY_PLAN_MONTHLY_ID=seu-id-mensal-aqui
KIWIFY_PLAN_QUARTERLY_ID=seu-id-trimestral-aqui
KIWIFY_PLAN_ANNUAL_ID=seu-id-anual-aqui
```

### 3️⃣ Configurar Secrets no Supabase

Execute no terminal:

```bash
npx supabase secrets set KIWIFY_PLAN_MONTHLY_ID="seu-id-mensal-aqui"
npx supabase secrets set KIWIFY_PLAN_QUARTERLY_ID="seu-id-trimestral-aqui"
npx supabase secrets set KIWIFY_PLAN_ANNUAL_ID="seu-id-anual-aqui"
```

Ou configure manualmente:
👉 https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets

## 🧪 Testar

Abra no navegador: **http://localhost:3001/test-kiwify-sync.html**

1. Digite o email do usuário
2. Clique em "Sincronizar Agora"
3. Verifique se os dados foram atualizados

## 📋 Verificar no Banco

Execute no SQL Editor do Supabase:

```sql
SELECT
  u.email,
  s.plan,
  s.status,
  s.current_period_end,
  s.kiwify_plan_id,
  s.kiwify_subscription_id
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'email-do-usuario@exemplo.com';
```

## 🔍 Ferramentas Disponíveis

- **test-kiwify-discover-plans.html** - Descobre IDs dos planos
- **test-kiwify-sync.html** - Testa sincronização manual
- **scripts/diagnosticar-kiwify.md** - Guia completo de diagnóstico

## ⚡ TL;DR

```bash
# 1. Abra a ferramenta de descoberta
open http://localhost:3001/test-kiwify-discover-plans.html

# 2. Copie os IDs e adicione ao .env.local

# 3. Configure secrets
npx supabase secrets set KIWIFY_PLAN_MONTHLY_ID="..."
npx supabase secrets set KIWIFY_PLAN_QUARTERLY_ID="..."
npx supabase secrets set KIWIFY_PLAN_ANNUAL_ID="..."

# 4. Reinicie o servidor
npm run dev

# 5. Teste a sincronização
open http://localhost:3001/test-kiwify-sync.html
```

## 🆘 Precisa de Ajuda?

Veja o guia completo em: **scripts/diagnosticar-kiwify.md**
