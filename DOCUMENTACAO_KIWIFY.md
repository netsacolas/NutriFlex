# Documentação Completa: Integração Kiwify via API

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura da Solução](#arquitetura-da-solução)
3. [Configuração Inicial](#configuração-inicial)
4. [Componentes da Integração](#componentes-da-integração)
5. [Fluxo de Compra e Ativação](#fluxo-de-compra-e-ativação)
6. [Edge Functions](#edge-functions)
7. [Frontend - Auto-Sync](#frontend---auto-sync)
8. [Testes e Validação](#testes-e-validação)
9. [Troubleshooting](#troubleshooting)
10. [Manutenção e Monitoramento](#manutenção-e-monitoramento)

---

## 🎯 Visão Geral

A integração com a Kiwify foi implementada usando a **API Pública oficial** da Kiwify, sem depender de webhooks. Esta abordagem garante:

- ✅ **Sincronização confiável** - não depende de webhooks que podem falhar
- ✅ **Auto-recuperação** - sincroniza automaticamente ao fazer login
- ✅ **Rastreabilidade completa** - logs estruturados com correlation_id
- ✅ **Controle de taxa** - rate limiting e backoff exponencial
- ✅ **Cache OAuth** - token reutilizado com renovação automática

### Estado Atual
- **Status**: ✅ Funcionando em produção
- **Última atualização**: Janeiro 2025
- **Commits principais**:
  - `72b430a` - Fix plan_id detection (suporte a product.plan_id)
  - `8ff3286` - Auto-sync ao fazer login
  - `38ee923` - Fix reload infinito

---

## 🏗️ Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLUXO COMPLETO                          │
└─────────────────────────────────────────────────────────────────┘

1. COMPRA NA KIWIFY
   Usuario → Checkout Kiwify → Pagamento aprovado
                                      ↓
2. REDIRECT PÓS-COMPRA
   Kiwify redireciona → /obrigado?plan=premium_monthly
                                      ↓
3. SYNC IMEDIATO (ThankYouPage)
   useEffect executa → sync_manual (últimas 24h)
   ├─ Busca compras do email
   ├─ Persiste em user_subscriptions
   └─ Atualiza contexto → Plano Premium ativado ✅
                                      ↓
4. FALLBACK AUTO-SYNC (Login)
   Se sync falhou ou usuário fechou página:
   useAutoSyncSubscription hook executa ao login
   ├─ Verifica sessionStorage (cooldown 5min)
   ├─ Busca compras (últimas 48h)
   ├─ Sincroniza assinatura
   └─ Reload página → Premium ativado ✅

┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENTES PRINCIPAIS                        │
└─────────────────────────────────────────────────────────────────┘

EDGE FUNCTIONS (Supabase)
├─ kiwify-api
│  ├─ Action: sync_manual (usado pelo frontend)
│  ├─ Action: list_subscriptions (debug)
│  ├─ Action: oauth_status (diagnostico)
│  └─ Action: cancel_subscription (suporte)
│
└─ kiwify-sync (job agendado - opcional)
   └─ Sync incremental automático

FRONTEND
├─ pages/ThankYouPage.tsx (sync imediato pós-compra)
├─ hooks/useAutoSyncSubscription.ts (fallback no login)
├─ components/AutoSyncWrapper.tsx (wrapper do hook)
├─ contexts/SubscriptionContext.tsx (estado global)
└─ pages/SubscriptionPage.tsx (checkout e gerenciamento)

BANCO DE DADOS
├─ user_subscriptions (plano ativo do usuário)
├─ payment_history (histórico de pagamentos)
└─ kiwify_sync_state (controle de sincronização)
```

---

## ⚙️ Configuração Inicial

### 1. Credenciais Kiwify

Obtenha as credenciais no painel da Kiwify:

1. Acesse: https://app.kiwify.com.br/settings/api
2. Anote:
   - **Client ID**
   - **Client Secret**
   - **Account ID**

### 2. Descobrir Plan IDs

Execute o script de descoberta:

```bash
node debug-kiwify.js
```

Ou acesse a página de teste:
```
http://localhost:5173/test-kiwify-discover-plans.html
```

Anote os **Plan IDs** retornados pela API.

### 3. Variáveis de Ambiente

#### `.env.local` (Frontend)

```env
# Supabase
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=seu_anon_key

# URLs de Checkout Kiwify
VITE_KIWIFY_CHECKOUT_MONTHLY=https://pay.kiwify.com.br/SEU_LINK_MENSAL
VITE_KIWIFY_CHECKOUT_QUARTERLY=https://pay.kiwify.com.br/SEU_LINK_TRIMESTRAL
VITE_KIWIFY_CHECKOUT_ANNUAL=https://pay.kiwify.com.br/SEU_LINK_ANUAL
```

#### Secrets Supabase (Edge Functions)

Configure via CLI ou Dashboard:

```bash
# Credenciais OAuth
npx supabase secrets set KIWIFY_CLIENT_ID="seu_client_id"
npx supabase secrets set KIWIFY_CLIENT_SECRET="seu_client_secret"
npx supabase secrets set KIWIFY_ACCOUNT_ID="seu_account_id"

# Plan IDs (obtidos no passo 2)
npx supabase secrets set KIWIFY_PLAN_MONTHLY_ID="plan_id_mensal"
npx supabase secrets set KIWIFY_PLAN_QUARTERLY_ID="plan_id_trimestral"
npx supabase secrets set KIWIFY_PLAN_ANNUAL_ID="plan_id_anual"

# Supabase (obrigatórios)
npx supabase secrets set SUPABASE_URL="https://SEU_PROJECT_ID.supabase.co"
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="seu_service_role_key"
```

### 4. Configurar Redirect Pós-Compra na Kiwify

Para cada produto/plano na Kiwify:

1. Acesse o produto no painel Kiwify
2. Configure "URL de Redirecionamento" (Thank You Page):
   ```
   https://seu-dominio.com/obrigado?plan=premium_monthly
   https://seu-dominio.com/obrigado?plan=premium_quarterly
   https://seu-dominio.com/obrigado?plan=premium_annual
   ```

---

## 🧩 Componentes da Integração

### 1. Edge Function: kiwify-api

**Localização**: `supabase/functions/kiwify-api/index.ts`

**Ações disponíveis**:

#### `sync_manual`
Sincroniza compras de emails específicos.

**Request**:
```json
{
  "action": "sync_manual",
  "emails": ["usuario@example.com"],
  "since": "2025-01-01T00:00:00.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "correlation_id": "uuid",
  "result": {
    "subscriptionsFetched": 1,
    "subscriptionsPersisted": 1,
    "usersMatched": 1,
    "usersMissing": 0,
    "errors": 0
  }
}
```

#### `list_subscriptions`
Lista assinaturas de um email (debug).

**Request**:
```json
{
  "action": "list_subscriptions",
  "email": "usuario@example.com"
}
```

#### `oauth_status`
Verifica status do token OAuth.

**Request**:
```json
{
  "action": "oauth_status"
}
```

**Response**:
```json
{
  "success": true,
  "cached": true,
  "expiresIn": 3456,
  "expiresAt": "2025-01-15T12:00:00.000Z"
}
```

### 2. Shared Module: kiwify.ts

**Localização**: `supabase/functions/_shared/kiwify.ts`

**Função principal**: `resolvePlan()`

Converte dados da API Kiwify para plano interno:

```typescript
// Busca plan_id em múltiplos locais:
const planId = getFirstNonEmpty(
  data.plan_id,
  data.product_id,
  planData?.id,
  productData?.plan_id,  // ← CRÍTICO: suporte a product.plan_id
  productData?.id,
);

// Mapeia para subscription_plan enum
if (planId === KIWIFY_PLAN_MONTHLY_ID) return 'premium_monthly';
if (planId === KIWIFY_PLAN_QUARTERLY_ID) return 'premium_quarterly';
if (planId === KIWIFY_PLAN_ANNUAL_ID) return 'premium_annual';

// Fallback: frequency ou plan_name
```

**Mapeamento de status**:

| Status Kiwify | Status Interno | Plano |
|--------------|----------------|-------|
| `approved`, `paid`, `completed`, `active` | `active` | `premium_*` |
| contém `cancel` ou `expired` | `cancelled` | `free` |
| `past_due`, `overdue` | `past_due` | `free` |
| outros | `incomplete` | `free` |

### 3. Frontend: ThankYouPage

**Localização**: `pages/ThankYouPage.tsx`

**Função**: Sincronização imediata após compra.

```typescript
useEffect(() => {
  const updateSubscription = async () => {
    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const userEmail = sessionData?.session?.user?.email;

      if (token && userEmail) {
        // Sync manual - últimas 24h
        await fetch(
          `${SUPABASE_URL}/functions/v1/kiwify-api`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: 'sync_manual',
              emails: [userEmail],
              since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            }),
          }
        );
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    }

    await refresh(); // Atualiza SubscriptionContext
    setTimeout(() => setIsLoading(false), 2000);
  };

  updateSubscription();
}, []); // Executa apenas 1x ao montar
```

**Características**:
- ✅ Countdown de 5 segundos
- ✅ Redirect para `/` (home)
- ✅ Executa mesmo se usuário clicar em outro link (dependencies: `[]`)

### 4. Frontend: useAutoSyncSubscription Hook

**Localização**: `hooks/useAutoSyncSubscription.ts`

**Função**: Fallback de sincronização ao fazer login.

```typescript
export const useAutoSyncSubscription = () => {
  const { user } = useAuth();
  const hasSynced = useRef(false);

  useEffect(() => {
    const syncSubscription = async () => {
      // 1. Verificar sessionStorage (cooldown 5min)
      const syncKey = user?.email ? `autosync_${user.email}` : null;
      const lastSync = syncKey ? sessionStorage.getItem(syncKey) : null;

      if (lastSync) {
        const lastSyncTime = parseInt(lastSync, 10);
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        if (lastSyncTime > fiveMinutesAgo) {
          console.log('[AutoSync] Sincronização já executada recentemente');
          return; // Pula
        }
      }

      // 2. Verificar se já sincronizou (useRef)
      if (!user || !user.email || hasSynced.current) {
        return;
      }

      try {
        // 3. Chamar sync_manual (últimas 48h)
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/kiwify-api`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: 'sync_manual',
              emails: [user.email],
              since: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          // 4. Marcar como sincronizado
          hasSynced.current = true;
          if (syncKey) {
            sessionStorage.setItem(syncKey, Date.now().toString());
          }

          // 5. Se encontrou assinatura, recarregar (só 1x)
          if (result.result?.subscriptionsPersisted > 0) {
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } else {
          // Marcar como sincronizado mesmo com erro (evita loop)
          hasSynced.current = true;
          if (syncKey) {
            sessionStorage.setItem(syncKey, Date.now().toString());
          }
        }
      } catch (error) {
        // Marcar como sincronizado mesmo com erro
        hasSynced.current = true;
        if (syncKey) {
          sessionStorage.setItem(syncKey, Date.now().toString());
        }
      }
    };

    syncSubscription();
  }, [user]);
};
```

**Proteções contra loop infinito**:
1. ✅ sessionStorage persiste entre reloads
2. ✅ Cooldown de 5 minutos
3. ✅ Marca como sincronizado mesmo com erro
4. ✅ Reload acontece apenas 1x

### 5. Banco de Dados

#### Tabela: `user_subscriptions`

```sql
CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  kiwify_plan_id text,
  kiwify_order_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
```

#### Tabela: `payment_history`

```sql
CREATE TABLE payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kiwify_order_id text UNIQUE,
  amount decimal(10,2),
  status text,
  plan text,
  payment_date timestamptz,
  created_at timestamptz DEFAULT now()
);
```

#### Trigger: Auto-criar assinatura free

```sql
CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_subscription();
```

---

## 🔄 Fluxo de Compra e Ativação

### Cenário 1: Fluxo Ideal (Tudo Funciona)

```
1. Usuário compra no Kiwify
   └─ Status: paid
   └─ Email: usuario@example.com

2. Kiwify redireciona
   └─ URL: https://app.com/obrigado?plan=premium_monthly

3. ThankYouPage carrega
   └─ useEffect executa sync_manual
   └─ Busca compras (últimas 24h)
   └─ Encontra compra aprovada
   └─ Persiste em user_subscriptions
      ├─ plan: premium_monthly
      ├─ status: active
      └─ kiwify_plan_id: xxx
   └─ refresh() atualiza SubscriptionContext
   └─ isPremium: true ✅

4. Countdown de 5s
   └─ Redirect para /

5. Usuário vê "Conta Premium" no dashboard ✅
```

### Cenário 2: Sync Falha (Usuário Fecha Página)

```
1. Usuário compra no Kiwify
   └─ Status: paid

2. Kiwify redireciona para /obrigado

3. ThankYouPage carrega
   └─ Inicia sync_manual
   └─ Usuário fecha aba antes de completar ❌

4. Banco NÃO foi atualizado
   └─ plan: free

5. Usuário faz login novamente
   └─ useAutoSyncSubscription detecta login
   └─ Verifica sessionStorage: nenhum sync recente
   └─ Executa sync_manual (últimas 48h)
   └─ Encontra compra aprovada
   └─ Persiste em user_subscriptions
   └─ Salva timestamp no sessionStorage
   └─ window.location.reload() ✅

6. Após reload
   └─ sessionStorage possui timestamp
   └─ Cooldown 5min → pula novo sync
   └─ SubscriptionContext carrega plan: premium_monthly
   └─ Usuário vê "Conta Premium" ✅
```

### Cenário 3: Compra Pendente

```
1. Usuário compra mas pagamento está pendente
   └─ Status: pending

2. Sync executa
   └─ resolvePlan() verifica status
   └─ Status não está em [approved, paid, completed, active]
   └─ Retorna: incomplete

3. user_subscriptions
   └─ plan: free
   └─ status: incomplete

4. Quando pagamento for aprovado
   └─ Próximo login executará auto-sync
   └─ Status mudou para: paid
   └─ plan: premium_monthly ✅
```

---

## 🧪 Testes e Validação

### 1. Testar Sync Manual de Email Específico

```bash
node test-user-email.js usuario@example.com
```

**Output esperado**:
```
═══════════════════════════════════════════════════════════════
TESTE: usuario@example.com
═══════════════════════════════════════════════════════════════

1️⃣ Buscando compras na Kiwify...

✅ 1 compra(s) encontrada(s)

Compra mais recente:
  Status: paid
  Email: usuario@example.com
  Plan ID: 636ae5ac-1648-413d-9f24-ff428a9a723d
  Plan Name: Mensal
  Data: 2025-01-15T10:30:00.000Z

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2️⃣ Forçando sincronização...

Resultado:
  Sucesso: true
  Assinaturas encontradas: 1
  Assinaturas salvas: 1
  Usuários encontrados: 1
  Usuários NÃO encontrados: 0
  Erros: 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SUCESSO! Assinatura salva no banco!

PRÓXIMOS PASSOS:
1. Login com: usuario@example.com
2. Acessar: http://localhost:5173/app
3. Verificar se mostra "Conta Premium"

═══════════════════════════════════════════════════════════════
```

### 2. Verificar Logs da Edge Function

```bash
npx supabase functions logs kiwify-api --project-ref SEU_PROJECT_REF
```

**Procurar por**:
- ✅ `sync_manual_completed` - sucesso
- ⚠️ `subscription_user_not_found` - usuário não existe
- ❌ `subscription_upsert_failed` - erro ao salvar

### 3. Verificar Banco de Dados

```sql
-- Ver assinaturas ativas
SELECT
  u.email,
  s.plan,
  s.status,
  s.kiwify_plan_id,
  s.current_period_end,
  s.updated_at
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
ORDER BY s.updated_at DESC
LIMIT 20;

-- Ver assinatura de email específico
SELECT
  u.email,
  s.plan,
  s.status,
  s.kiwify_plan_id,
  s.updated_at
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'usuario@example.com';
```

### 4. Testar OAuth Status

```bash
curl -X POST https://SEU_PROJECT_ID.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -d '{"action":"oauth_status"}'
```

**Response esperado**:
```json
{
  "success": true,
  "cached": true,
  "expiresIn": 3456,
  "expiresAt": "2025-01-15T12:00:00.000Z"
}
```

---

## 🔧 Troubleshooting

### Problema: "Compra não reconhecida após checkout"

**Sintomas**: Usuário comprou mas continua com plano Free.

**Diagnóstico**:
1. Verificar se usuário está cadastrado:
   ```sql
   SELECT * FROM auth.users WHERE email = 'usuario@example.com';
   ```

2. Verificar se compra existe na Kiwify:
   ```bash
   node test-user-email.js usuario@example.com
   ```

3. Verificar logs da Edge Function:
   ```bash
   npx supabase functions logs kiwify-api | grep "usuario@example.com"
   ```

**Soluções**:

- **Se usuário não existe**: Criar conta primeiro
- **Se compra não aparece**: Verificar credenciais Kiwify
- **Se sync falhou**: Forçar sync manual via script
- **Se plan_id incorreto**: Revisar KIWIFY_PLAN_*_ID nos secrets

### Problema: "Reload infinito após login"

**Sintomas**: Página fica recarregando sem parar.

**Causa**: sessionStorage não está persistindo ou cooldown muito curto.

**Solução**:
1. Limpar sessionStorage:
   ```javascript
   sessionStorage.clear();
   ```

2. Verificar console do navegador:
   ```
   [AutoSync] Sincronização já executada recentemente, pulando...
   ```

3. Se não aparecer, revisar código do hook.

### Problema: "Plan ID não reconhecido"

**Sintomas**: Logs mostram `plan_id_not_found` ou plano fica como Free.

**Diagnóstico**:
1. Executar debug script:
   ```bash
   node debug-kiwify.js
   ```

2. Comparar plan_id retornado com secrets:
   ```bash
   npx supabase secrets list --project-ref SEU_REF
   ```

**Solução**:
```bash
# Atualizar com plan_id correto
npx supabase secrets set KIWIFY_PLAN_MONTHLY_ID="plan_id_correto"

# Re-deploy da Edge Function
npx supabase functions deploy kiwify-api --project-ref SEU_REF
```

### Problema: "OAuth 401 Unauthorized"

**Sintomas**: Edge Function retorna erro 401.

**Diagnóstico**:
```bash
# Verificar status OAuth
curl -X POST https://SEU_PROJECT.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ANON_KEY" \
  -d '{"action":"oauth_status"}'
```

**Soluções**:

1. **Token expirado**: Aguardar renovação automática (5min antes da expiração)

2. **Credenciais incorretas**:
   ```bash
   npx supabase secrets set KIWIFY_CLIENT_ID="novo_valor"
   npx supabase secrets set KIWIFY_CLIENT_SECRET="novo_valor"
   ```

3. **Forçar nova autenticação**: Limpar cache Deno KV (re-deploy)

---

## 📊 Manutenção e Monitoramento

### Logs Estruturados

Todos os logs seguem o formato:

```json
{
  "level": "INFO|WARN|ERROR",
  "message": "evento_descritivo",
  "correlation_id": "uuid",
  "action": "sync_manual",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "data": { /* detalhes */ }
}
```

**Eventos principais**:

| Evento | Level | Descrição |
|--------|-------|-----------|
| `sync_manual_started` | INFO | Início da sincronização |
| `sync_manual_completed` | INFO | Sincronização concluída com sucesso |
| `subscription_upsert_success` | INFO | Assinatura salva no banco |
| `subscription_user_not_found` | WARN | Usuário não existe no sistema |
| `subscription_upsert_failed` | ERROR | Erro ao salvar assinatura |
| `oauth_token_refreshed` | INFO | Token OAuth renovado |
| `oauth_request_failed` | ERROR | Falha na autenticação OAuth |

### Queries Úteis de Monitoramento

```sql
-- Assinaturas criadas hoje
SELECT COUNT(*)
FROM user_subscriptions
WHERE plan LIKE 'premium%'
  AND created_at >= CURRENT_DATE;

-- Assinaturas por plano
SELECT plan, COUNT(*) as total
FROM user_subscriptions
WHERE status = 'active'
GROUP BY plan;

-- Últimas 10 sincronizações
SELECT
  u.email,
  s.plan,
  s.status,
  s.updated_at
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.plan != 'free'
ORDER BY s.updated_at DESC
LIMIT 10;

-- Assinaturas com problema
SELECT
  u.email,
  s.plan,
  s.status,
  s.kiwify_plan_id
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.status IN ('incomplete', 'past_due', 'cancelled')
ORDER BY s.updated_at DESC;
```

### Checklist de Deploy

Antes de cada deploy de Edge Function:

- [ ] Verificar secrets configurados
- [ ] Testar OAuth com `oauth_status`
- [ ] Validar plan_ids corretos
- [ ] Executar test-user-email.js em staging
- [ ] Verificar logs não mostram erros
- [ ] Confirmar RLS policies ativas
- [ ] Backup do banco antes de migração

### Rotina de Suporte

**Usuário reclama que plano não ativou**:

1. Verificar email usado na compra
2. Executar script de diagnóstico:
   ```bash
   node debug-complete-flow.js email@usuario.com
   ```
3. Se compra existe mas não sincronizou:
   ```bash
   node test-user-email.js email@usuario.com
   ```
4. Verificar logs com correlation_id retornado
5. Se necessário, atualizar manualmente no SQL

**Cancelamento de assinatura**:

1. Cancelar via API:
   ```bash
   curl -X POST https://PROJECT.supabase.co/functions/v1/kiwify-api \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{
       "action": "cancel_subscription",
       "subscription_id": "kiwify_subscription_id"
     }'
   ```

2. Ou atualizar manualmente:
   ```sql
   UPDATE user_subscriptions
   SET plan = 'free', status = 'cancelled'
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usuario@example.com');
   ```

---

## 📚 Referências

- **API Kiwify**: https://docs.kiwify.com.br/api
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **OAuth 2.0**: https://oauth.net/2/

---

## ✅ Checklist de Implementação

Para implementar em um novo projeto:

- [ ] Obter credenciais Kiwify (Client ID, Secret, Account ID)
- [ ] Descobrir Plan IDs dos produtos
- [ ] Configurar secrets no Supabase
- [ ] Aplicar migrations do banco (009_add_subscriptions.sql)
- [ ] Copiar Edge Functions (kiwify-api, _shared/kiwify.ts)
- [ ] Deploy das Edge Functions
- [ ] Configurar URLs de redirect na Kiwify
- [ ] Implementar ThankYouPage no frontend
- [ ] Implementar useAutoSyncSubscription hook
- [ ] Integrar AutoSyncWrapper no App.tsx
- [ ] Testar fluxo completo em staging
- [ ] Configurar monitoramento de logs
- [ ] Documentar playbook de suporte

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0
**Status**: ✅ Produção
