# 🚀 DEPLOY VIA DASHBOARD SUPABASE

## Problema
A Edge Function `kiwify-api` precisa ser atualizada para reconhecer `product.plan_id`.

## Solução Rápida (5 minutos)

### Opção 1: Deploy via Git (MAIS FÁCIL)

1. Acesse o Dashboard do Supabase:
   https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions

2. Clique em **"kiwify-api"**

3. Clique no botão **"Deploy from GitHub"** ou **"Redeploy"**

4. A função será atualizada automaticamente com os arquivos do repositório

5. Aguarde o deploy completar (30-60 segundos)

### Opção 2: Deploy Manual (se Opção 1 não funcionar)

#### Passo 1: Acessar a função

1. Vá para: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions
2. Clique em **"kiwify-api"**
3. Clique em **"Edit Function"** ou **"Update"**

#### Passo 2: Atualizar arquivo `_shared/kiwify.ts`

Localize a função `resolvePlan` e substitua por:

```typescript
export const resolvePlan = (data: Record<string, unknown>): SubscriptionPlanId => {
  const { monthly, quarterly, annual } = envPlanIds();
  const planData =
    typeof data.plan === 'object' && data.plan !== null
      ? (data.plan as Record<string, unknown>)
      : null;

  // NOVO: Suporte para product.plan_id (estrutura usada pela Kiwify)
  const productData =
    typeof data.product === 'object' && data.product !== null
      ? (data.product as Record<string, unknown>)
      : null;

  const planId = getFirstNonEmpty(
    data.plan_id as string | undefined,
    data.product_id as string | undefined,
    data.plan_code as string | undefined,
    planData?.id as string | undefined,
    planData?.code as string | undefined,
    productData?.plan_id as string | undefined,  // NOVO: buscar dentro de product.plan_id
    productData?.id as string | undefined,
  );

  if (planId && monthly && planId === monthly) return 'premium_monthly';
  if (planId && quarterly && planId === quarterly) return 'premium_quarterly';
  if (planId && annual && planId === annual) return 'premium_annual';

  const frequency = getFirstNonEmpty(
    data.frequency as string | undefined,
    data.billing_period as string | undefined,
    data.billing_cycle as string | undefined,
    planData?.frequency as string | undefined,
    planData?.billing_cycle as string | undefined,
    planData?.interval as string | undefined,
  );

  if (frequency) {
    const normalized = frequency.toLowerCase();
    if (normalized.includes('month')) return 'premium_monthly';
    if (normalized.includes('quarter')) return 'premium_quarterly';
    if (normalized.includes('year') || normalized.includes('annual')) return 'premium_annual';
  }

  // NOVO: Fallback para product.plan_name
  const planName = getFirstNonEmpty(
    productData?.plan_name as string | undefined,
    planData?.name as string | undefined,
  );

  if (planName) {
    const normalized = planName.toLowerCase();
    if (normalized.includes('mensal') || normalized.includes('month')) return 'premium_monthly';
    if (normalized.includes('tri') || normalized.includes('quarter')) return 'premium_quarterly';
    if (normalized.includes('anual') || normalized.includes('year') || normalized.includes('annual')) return 'premium_annual';
  }

  return 'premium_monthly';
};
```

#### Passo 3: Atualizar arquivo `_shared/kiwifySyncEngine.ts`

Localize a função `subscriptionPlanId` (por volta da linha 201) e substitua por:

```typescript
const subscriptionPlanId = (subscription: JsonRecord): string | null =>
  getFirstNonEmpty(
    subscription.plan_id as string | undefined,
    subscription.product_id as string | undefined,
    subscription.plan_code as string | undefined,
    subscription.plan?.id as string | undefined,
    subscription.plan?.code as string | undefined,
    subscription.product?.plan_id as string | undefined,  // NOVO: buscar em product.plan_id
    subscription.product?.id as string | undefined,
    metadataValue(subscription, 'plan_id'),
  );
```

#### Passo 4: Salvar e Deploy

1. Clique em **"Save"** ou **"Deploy"**
2. Aguarde a função ser deployada (30-60 segundos)
3. Verifique se não há erros no deploy

---

## Verificar se funcionou

Execute no terminal:

```bash
node debug-kiwify.js
```

Agora deve mostrar:
```
✅ SERIA MAPEADO PARA: active (Premium deve ser ativado)
```

E execute um sync manual para testar:

```bash
curl -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8" \
  -d '{"action":"sync_manual","emails":["birofov720@hh7f.com"]}'
```

---

## Opção 3: Deploy via CLI com Token

Se preferir usar CLI:

1. Gere um token em: https://supabase.com/dashboard/account/tokens

2. Execute:
```bash
export SUPABASE_ACCESS_TOKEN=seu_token_aqui
npx supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav
```

---

## Verificar user_subscriptions após deploy

Após fazer o deploy e executar sync_manual, verifique a tabela:

```sql
SELECT
  u.email,
  s.plan,
  s.status,
  s.kiwify_plan_id,
  s.current_period_end
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'birofov720@hh7f.com';
```

Deve retornar:
- **plan**: `premium_quarterly`
- **status**: `active`
- **kiwify_plan_id**: `636ae5ac-1648-413d-9f24-ff428a9a723d`

---

## Problemas?

Se ainda não funcionar após deploy:

1. Verifique os logs da função:
   https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/logs/edge-functions

2. Procure por erros relacionados a `resolvePlan` ou `subscriptionPlanId`

3. Confirme que os secrets estão configurados:
   - `KIWIFY_PLAN_MONTHLY_ID=b999e4a7-2372-4a01-a6ac-b08f0803e99c`
   - `KIWIFY_PLAN_QUARTERLY_ID=636ae5ac-1648-413d-9f24-ff428a9a723d`
   - `KIWIFY_PLAN_ANNUAL_ID=` (vazio por enquanto)
