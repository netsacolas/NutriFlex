# 🔧 Configuração Completa da Integração Kiwify

## ❌ Problema Atual

```
❌ Erro na sincronização: Erro interno na integração com a Kiwify
```

Este erro indica que as **credenciais OAuth não estão configuradas corretamente** nos Secrets do Supabase.

## ✅ Solução Completa

### 1️⃣ Configurar Credenciais Localmente (.env.local)

Abra o arquivo `.env.local` e verifique se as credenciais estão corretas:

```env
# Kiwify API Credentials (OAuth 2.0)
KIWIFY_CLIENT_ID=4c747409-c212-45d1-aaf9-4a5d43dac808
KIWIFY_CLIENT_SECRET=seu-client-secret-completo-aqui
KIWIFY_ACCOUNT_ID=av8qNBGVVoyVD75
```

⚠️ **IMPORTANTE**: O `.env.local` é usado apenas para desenvolvimento local. Em produção (Edge Functions), as variáveis vêm dos **Secrets** do Supabase!

### 2️⃣ Configurar Secrets no Supabase

As Edge Functions (`kiwify-api` e `kiwify-sync`) rodam no servidor do Supabase e **não têm acesso ao `.env.local`**. Por isso, precisamos configurar os Secrets:

#### Opção A: Via Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/vault/secrets

2. Clique em **"New secret"** para cada variável:

   ```
   Nome: KIWIFY_CLIENT_ID
   Valor: 4c747409-c212-45d1-aaf9-4a5d43dac808
   ```

   ```
   Nome: KIWIFY_CLIENT_SECRET
   Valor: [seu-client-secret-completo]
   ```

   ```
   Nome: KIWIFY_ACCOUNT_ID
   Valor: av8qNBGVVoyVD75
   ```

3. Também configure as variáveis do Supabase:

   ```
   Nome: SUPABASE_URL
   Valor: https://keawapzxqoyesptwpwav.supabase.co
   ```

   ```
   Nome: SUPABASE_SERVICE_ROLE_KEY
   Valor: [sua-service-role-key]
   ```

   > **Onde encontrar a Service Role Key:**
   > Dashboard → Settings → API → Project API keys → service_role key (secret)

#### Opção B: Via CLI

```bash
# Credenciais Kiwify
npx supabase secrets set KIWIFY_CLIENT_ID="4c747409-c212-45d1-aaf9-4a5d43dac808"
npx supabase secrets set KIWIFY_CLIENT_SECRET="seu-client-secret-aqui"
npx supabase secrets set KIWIFY_ACCOUNT_ID="av8qNBGVVoyVD75"

# Credenciais Supabase
npx supabase secrets set SUPABASE_URL="https://keawapzxqoyesptwpwav.supabase.co"
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key-aqui"

# IDs dos Planos (deixar vazio por enquanto, vamos descobrir depois)
npx supabase secrets set KIWIFY_PLAN_MONTHLY_ID=""
npx supabase secrets set KIWIFY_PLAN_QUARTERLY_ID=""
npx supabase secrets set KIWIFY_PLAN_ANNUAL_ID=""
```

#### Verificar Secrets Configurados

```bash
npx supabase secrets list
```

Deve mostrar algo como:

```
NAME                         DIGEST
KIWIFY_CLIENT_ID             abc123...
KIWIFY_CLIENT_SECRET         def456...
KIWIFY_ACCOUNT_ID            ghi789...
SUPABASE_URL                 jkl012...
SUPABASE_SERVICE_ROLE_KEY    mno345...
```

### 3️⃣ Redeploy das Edge Functions

Após configurar os Secrets, você **DEVE** fazer redeploy das funções:

#### Opção A: Via Dashboard (Mais Fácil)

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions

2. Para cada função (`kiwify-api` e `kiwify-sync`):
   - Clique nos 3 pontinhos (⋮)
   - Clique em **"Deploy new version"**
   - Selecione o arquivo local ou use o código atual

#### Opção B: Via CLI

```bash
# Deploy individual
npx supabase functions deploy kiwify-api
npx supabase functions deploy kiwify-sync

# Ou deploy de todas
npx supabase functions deploy
```

### 4️⃣ Testar a Configuração

#### Teste 1: Verificar OAuth

Abra no navegador: **http://localhost:3001/test-kiwify-oauth.html**

Clique em **"Verificar Status OAuth"**

✅ **Sucesso**: Deve mostrar "Autenticação OAuth VÁLIDA"
❌ **Erro**: Volte ao passo 2 e verifique os Secrets

#### Teste 2: Descobrir IDs dos Planos

Abra no navegador: **http://localhost:3001/test-kiwify-discover-plans.html**

1. Digite um email com compra ativa: `birofov720@hh7f.com`
2. Clique em **"Descobrir Planos"**
3. Copie os IDs que aparecerem

Exemplo do resultado esperado:

```
KIWIFY_PLAN_MONTHLY_ID=prod_abc123
KIWIFY_PLAN_QUARTERLY_ID=prod_def456
KIWIFY_PLAN_ANNUAL_ID=prod_ghi789
```

#### Teste 3: Atualizar IDs dos Planos

Adicione os IDs descobertos:

**No `.env.local`:**
```env
KIWIFY_PLAN_MONTHLY_ID=prod_abc123
KIWIFY_PLAN_QUARTERLY_ID=prod_def456
KIWIFY_PLAN_ANNUAL_ID=prod_ghi789
```

**Nos Secrets do Supabase:**
```bash
npx supabase secrets set KIWIFY_PLAN_MONTHLY_ID="prod_abc123"
npx supabase secrets set KIWIFY_PLAN_QUARTERLY_ID="prod_def456"
npx supabase secrets set KIWIFY_PLAN_ANNUAL_ID="prod_ghi789"
```

**Redeploy novamente:**
```bash
npx supabase functions deploy kiwify-api
npx supabase functions deploy kiwify-sync
```

#### Teste 4: Sincronizar Compra

Abra no navegador: **http://localhost:3001/test-kiwify-sync.html**

1. Digite o email: `birofov720@hh7f.com`
2. Clique em **"Sincronizar Agora"**

✅ **Sucesso**: Deve mostrar "Assinaturas sincronizadas: 1"

### 5️⃣ Verificar no Banco de Dados

Execute no SQL Editor do Supabase:

```sql
SELECT
  u.email,
  s.plan,
  s.status,
  s.current_period_end,
  s.kiwify_plan_id,
  s.kiwify_subscription_id,
  s.last_event_at
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'birofov720@hh7f.com';
```

Deve retornar algo como:

```
email                | plan              | status | current_period_end | kiwify_plan_id
---------------------|-------------------|--------|--------------------|----------------
birofov720@hh7f.com  | premium_monthly   | active | 2025-12-02...      | prod_abc123
```

## 🔍 Troubleshooting

### Erro: "Erro interno na integração com a Kiwify"

**Causa**: Secrets não configurados ou Edge Function não deployada

**Solução**:
1. Configure todos os Secrets (passo 2)
2. Faça redeploy da função (passo 3)
3. Teste com a ferramenta OAuth (passo 4.1)

### Erro: "Nenhuma assinatura encontrada"

**Causa**: Email não possui compras ou credenciais incorretas

**Solução**:
1. Verifique se o email está correto
2. Confirme que há compra ativa na Kiwify
3. Teste com test-kiwify-oauth.html

### Erro: "Assinaturas encontradas mas não sincronizadas"

**Causa**: IDs dos planos não configurados

**Solução**:
1. Use test-kiwify-discover-plans.html
2. Configure os IDs descobertos
3. Refaça sincronização

### Plano permanece "free"

**Causa**: IDs dos planos incorretos ou não configurados nos Secrets

**Solução**:
1. Verifique se os IDs estão corretos
2. Confirme que estão nos Secrets: `npx supabase secrets list`
3. Redeploy: `npx supabase functions deploy kiwify-api`

## 📋 Checklist Completa

- [ ] ✅ Credenciais no `.env.local` (desenvolvimento)
- [ ] ✅ Secrets configurados no Supabase (produção)
  - [ ] KIWIFY_CLIENT_ID
  - [ ] KIWIFY_CLIENT_SECRET
  - [ ] KIWIFY_ACCOUNT_ID
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] ✅ Edge Functions deployadas
  - [ ] kiwify-api
  - [ ] kiwify-sync
- [ ] ✅ OAuth testado e funcionando
- [ ] ✅ IDs dos planos descobertos
- [ ] ✅ IDs configurados no .env.local
- [ ] ✅ IDs configurados nos Secrets
- [ ] ✅ Edge Functions re-deployadas
- [ ] ✅ Sincronização testada e funcionando
- [ ] ✅ Dados verificados no banco

## 🚀 Ferramentas Disponíveis

- **test-kiwify-oauth.html** - Testa autenticação OAuth
- **test-kiwify-discover-plans.html** - Descobre IDs dos planos
- **test-kiwify-sync.html** - Testa sincronização manual
- **KIWIFY_SETUP_RAPIDO.md** - Guia rápido
- **scripts/diagnosticar-kiwify.md** - Guia detalhado

## 📞 Próximos Passos

1. Configure os Secrets no Supabase (passo 2)
2. Faça redeploy das Edge Functions (passo 3)
3. Teste OAuth (http://localhost:3001/test-kiwify-oauth.html)
4. Descubra IDs dos planos (http://localhost:3001/test-kiwify-discover-plans.html)
5. Configure os IDs nos Secrets
6. Teste sincronização (http://localhost:3001/test-kiwify-sync.html)

---

**Precisa de ajuda?** Verifique os logs das Edge Functions:

```bash
# Dashboard do Supabase
# Edge Functions → kiwify-api → Logs

# Ou via SQL
SELECT * FROM logs.edge_functions
WHERE function_name = 'kiwify-api'
ORDER BY timestamp DESC
LIMIT 10;
```
