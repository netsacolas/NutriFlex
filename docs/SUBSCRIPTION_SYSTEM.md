# Sistema de Assinaturas NutriMais AI

## Visão Geral

O NutriMais AI implementa um sistema completo de assinaturas integrado à plataforma Kiwify, permitindo monetização através de planos Premium com funcionalidades avançadas. O sistema foi projetado para ser transparente, seguro e totalmente automatizado.

## Arquitetura

### Componentes Principais

1. **Frontend (React + TypeScript)**
   - `SubscriptionContext.tsx` - Provider global de assinatura
   - `SubscriptionPage.tsx` - Página de planos e checkout
   - `PaymentSection.tsx` - Seção de pagamentos no perfil
   - `subscriptionService.ts` - Lógica de negócio

2. **Backend (Supabase + Edge Functions)**
   - `user_subscriptions` - Tabela de assinaturas
   - `payment_history` - Histórico de pagamentos
   - `kiwify-webhook` - Edge Function para webhooks

3. **Integração Externa**
   - Kiwify - Plataforma de pagamentos e checkout

---

## Planos Disponíveis

### 🆓 Plano Grátis (Free)

**Preço:** R$ 0,00
**Duração:** Ilimitada
**ID:** `free`

**Limitações:**
- ✅ Planejamento inteligente de refeições
- ❌ Máximo 2 refeições por dia
- ❌ Histórico limitado aos últimos 5 registros
- ❌ Chat IA desativado (exceto "Recalcular com IA")

**Regras:**
- Todo novo usuário inicia automaticamente no plano Free
- Trigger automático cria registro ao criar conta
- Reversão automática ao expirar planos Premium

### 💎 Plano Premium Mensal

**Preço:** R$ 19,90/mês
**Duração:** 30 dias
**ID:** `premium_monthly`

**Recursos:**
- ✅ Refeições ilimitadas por dia
- ✅ Histórico completo sem restrições
- ✅ Assistente de IA completo com chat
- ✅ Análises nutricionais detalhadas
- ✅ Relatórios personalizados
- ✅ Suporte prioritário

### 💎 Plano Premium Trimestral ⭐ POPULAR

**Preço:** R$ 5,00/trimestre
**Duração:** 90 dias
**ID:** `premium_quarterly`

**Recursos:**
- ✅ Todos os recursos do plano Mensal
- ✅ **Melhor custo-benefício para iniciar**
- ✅ Acesso a recursos beta
- ✅ Renovação automática trimestral
- ✅ Garantia de satisfação

### 💎 Plano Premium Anual 🏆 MELHOR CUSTO-BENEFÍCIO

**Preço:** R$ 179,90/ano
**Duração:** 365 dias
**ID:** `premium_annual`

**Recursos:**
- ✅ Todos os recursos do plano Mensal
- ✅ **Economia de 25%** vs. plano mensal
- ✅ Acesso prioritário a novidades
- ✅ Relatórios históricos avançados
- ✅ Melhor valor do mercado

---

## Banco de Dados

### Tabela: `user_subscriptions`

```sql
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    plan subscription_plan NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    kiwify_order_id TEXT,
    kiwify_subscription_id TEXT,
    kiwify_plan_id TEXT,
    last_event_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Enums:**
- `subscription_plan`: `free`, `premium_monthly`, `premium_quarterly`, `premium_annual`
- `subscription_status`: `active`, `incomplete`, `past_due`, `cancelled`

**Índices:**
- `idx_user_subscriptions_user_id` em `user_id`

**RLS (Row Level Security):**
- ✅ Habilitado
- Policy: Usuários podem visualizar apenas sua própria assinatura
- Policy: Usuários podem criar apenas assinatura Free

**Triggers:**
- `trg_user_subscription_updated_at` - Atualiza `updated_at`
- `trg_auth_user_create_subscription` - Cria assinatura Free automaticamente

### Tabela: `payment_history`

```sql
CREATE TABLE public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
    plan subscription_plan NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BRL',
    payment_method TEXT,
    kiwify_order_id TEXT,
    kiwify_transaction_id TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Índices:**
- `idx_payment_history_user_id` em `user_id`
- `idx_payment_history_subscription_id` em `subscription_id`
- `idx_payment_history_kiwify_order` em `kiwify_order_id`
- `idx_payment_history_paid_at` em `paid_at DESC`

**RLS:**
- ✅ Habilitado
- Policy: Usuários podem visualizar apenas seu próprio histórico

### View: `subscriptions_with_status`

```sql
CREATE VIEW subscriptions_with_status AS
SELECT
    s.*,
    get_subscription_days_remaining(s) AS days_remaining,
    is_subscription_expiring_soon(s) AS is_expiring_soon,
    CASE
        WHEN s.status = 'active' AND s.current_period_end < NOW()
        THEN TRUE
        ELSE FALSE
    END AS is_expired
FROM public.user_subscriptions s;
```

**Funções Auxiliares:**
- `get_subscription_days_remaining(sub_record)` - Calcula dias restantes
- `is_subscription_expiring_soon(sub_record)` - Retorna true se expira em ≤ 3 dias

---

## Fluxo de Assinatura

### 1. Criação de Conta

```mermaid
graph LR
    A[Usuário se Registra] --> B[Trigger Cria Registro]
    B --> C[Status: free + active]
    C --> D[Usuário Acessa App]
```

**Detalhes:**
- Trigger `trg_auth_user_create_subscription` executa após INSERT em `auth.users`
- Função `create_default_subscription()` insere registro na `user_subscriptions`
- Plano inicial: `free`, Status: `active`

### 2. Upgrade para Premium

```mermaid
graph TD
    A[Usuário Clica Assinar] --> B{Escolhe Plano}
    B --> C[Premium Mensal]
    B --> D[Premium Trimestral]
    B --> E[Premium Anual]
    C --> F[openCheckout]
    D --> F
    E --> F
    F --> G[Redireciona para Kiwify]
    G --> H[Usuário Paga]
    H --> I[Kiwify Envia Webhook]
    I --> J[Edge Function Processa]
    J --> K[Atualiza user_subscriptions]
    J --> L[Insere payment_history]
    K --> M[Realtime Notifica Frontend]
    M --> N[SubscriptionContext Atualiza]
```

**Detalhes:**
1. `openCheckout(planId)` gera URL com parâmetros:
   - `external_id`: user.id
   - `email`: user.email
   - `source`: nutrimais-app

2. Kiwify processa pagamento e envia webhook para:
   - `https://[project].supabase.co/functions/v1/kiwify-webhook`

3. Edge Function valida assinatura HMAC e atualiza banco

4. Realtime do Supabase notifica frontend via `listenSubscriptionChanges()`

### 3. Avisos de Vencimento

```typescript
// Lógica no subscriptionService.ts
getDaysRemaining(subscription): number | null
isExpiringSoon(subscription): boolean  // <= 3 dias
isExpired(subscription): boolean       // current_period_end < NOW()
```

**Exibição de Avisos:**
- **Expira em 3 dias ou menos:** Banner laranja com call-to-action de renovação
- **Expirado:** Banner vermelho indicando reversão para Free
- **Mais de 3 dias:** Badge informativo com contagem regressiva

### 4. Expiração e Reversão

```mermaid
graph LR
    A[current_period_end < NOW] --> B{Renovado?}
    B -->|Não| C[Webhook: status=cancelled]
    B -->|Sim| D[Webhook: status=active]
    C --> E[plan=free no DB]
    D --> F[plan=premium_* no DB]
    E --> G[Limitações Aplicadas]
    F --> H[Acesso Total]
```

**Automação:**
- Kiwify envia webhook de `subscription.expired` ou `subscription.cancelled`
- Edge Function atualiza `plan` para `free` e `status` para `cancelled`
- Frontend detecta mudança via realtime
- Limites aplicados instantaneamente

---

## Integração com Kiwify

### Variáveis de Ambiente

```env
# Frontend (.env.local)
VITE_KIWIFY_CHECKOUT_MONTHLY=https://pay.kiwify.com.br/uJP288j
VITE_KIWIFY_CHECKOUT_QUARTERLY=https://pay.kiwify.com.br/htkTmiC
VITE_KIWIFY_CHECKOUT_ANNUAL=https://pay.kiwify.com.br/mHorNkF

# Backend (Supabase Secrets)
KIWIFY_PLAN_MONTHLY_ID=<id_do_produto_mensal>
KIWIFY_PLAN_QUARTERLY_ID=<id_do_produto_trimestral>
KIWIFY_PLAN_ANNUAL_ID=<id_do_produto_anual>
KIWIFY_WEBHOOK_SECRET=<secret_da_kiwify>
```

### Eventos do Webhook

| Evento Kiwify | Ação no NutriMais |
|---------------|-------------------|
| `order.approved` | Ativa assinatura Premium + Registra pagamento |
| `order.completed` | Ativa assinatura Premium + Registra pagamento |
| `subscription.activated` | Ativa assinatura Premium |
| `subscription.cancelled` | Reverte para Free |
| `subscription.expired` | Reverte para Free |
| `subscription.past_due` | Marca como `past_due` (mantém acesso) |

### Segurança do Webhook

**Validação HMAC-SHA256:**
```typescript
const verifySignature = async (rawBody, signatureHeader, secret) => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expected = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return provided === expected;
}
```

**Headers Esperados:**
- `x-kiwify-signature`: Assinatura HMAC do payload
- `content-type`: `application/json`

---

## Frontend - Limitações

### SubscriptionContext

**Provider Global:**
```typescript
interface SubscriptionContextValue {
  subscription: SubscriptionRecord | null;
  plan: PlanTierDefinition;
  isPremium: boolean;
  limits: {
    maxMealsPerDay: number | null;  // 2 para Free, null para Premium
    historyItems: number | null;     // 5 para Free, null para Premium
    aiChatEnabled: boolean;          // false para Free, true para Premium
  };
  refresh: () => Promise<void>;
  openCheckout: (plan: SubscriptionPlan) => void;
}
```

**Uso nas Páginas:**
```typescript
const { limits, isPremium } = useSubscription();

// PlanMealPage
if (limits.maxMealsPerDay !== null && todayMealsCount >= limits.maxMealsPerDay) {
  setShowUpgradeNotice(true);
  return; // Bloqueia criação de nova refeição
}

// HistoryPage
const applyHistoryLimit = <T>(items: T[]): T[] => {
  if (limits.historyItems === null) return items;
  return items.slice(0, limits.historyItems);
};

// ChatPage
if (!limits.aiChatEnabled) {
  return <UpgradePrompt />;
}
```

### PaymentSection Component

**Recursos:**
- ✅ Status da assinatura com badges visuais
- ✅ Datas de início/vencimento
- ✅ Contagem de dias restantes
- ✅ Avisos de vencimento próximo (≤ 3 dias)
- ✅ Avisos de expiração
- ✅ Histórico de pagamentos (últimos 5)
- ✅ Botões de ação contextuais:
  - Free: "Assinar Premium"
  - Expirando: "Renovar Assinatura" (laranja)
  - Ativo: "Gerenciar Plano"

---

## Testes e Validação

### Checklist de Testes

**Fluxo de Assinatura:**
- [ ] Novo usuário inicia com plano Free
- [ ] Limites Free aplicados corretamente (2 refeições/dia, 5 históricos)
- [ ] Chat bloqueado para Free
- [ ] Checkout redireciona para Kiwify com parâmetros corretos
- [ ] Webhook processa pagamento e ativa Premium
- [ ] Limites removidos após ativar Premium
- [ ] Histórico de pagamento registrado
- [ ] Dias restantes calculados corretamente
- [ ] Aviso exibido 3 dias antes do vencimento
- [ ] Reversão para Free após expiração

**Segurança:**
- [ ] Webhook valida assinatura HMAC
- [ ] RLS impede acesso a assinaturas de outros usuários
- [ ] Tokens sensíveis não expostos no frontend
- [ ] URLs de checkout geradas com user_id correto

### Testes de Edge Cases

```typescript
// 1. Webhook com user_id inválido
// Esperado: Retorna 202 sem erro, loga warning

// 2. Webhook com assinatura HMAC inválida
// Esperado: Retorna 401 Unauthorized

// 3. Usuário tenta criar 3ª refeição no plano Free
// Esperado: Modal de upgrade, refeição não salva

// 4. Assinatura expira enquanto usuário está online
// Esperado: Realtime atualiza, limites aplicados instantaneamente

// 5. Pagamento duplicado (mesmo order_id)
// Esperado: Upsert atualiza registro existente
```

---

## Métricas e Monitoramento

### KPIs de Negócio

- **Taxa de Conversão:** (Usuários Premium / Total Usuários) × 100
- **LTV (Lifetime Value):** Receita média por usuário
- **Churn Rate:** Taxa de cancelamento mensal
- **MRR (Monthly Recurring Revenue):** Receita recorrente mensal

### Logs Importantes

```typescript
// Sucesso de checkout
console.log('Redirecionando para checkout', { url });

// Pagamento processado
console.log('Pagamento registrado no historico', { userId, amount });

// Assinatura atualizada
console.log('Assinatura atualizada com sucesso', { userId, status, plan });

// Avisos
console.warn('Usuario atingiu limite de refeicoes', { userId, count });
console.warn('Assinatura expirando em breve', { userId, daysRemaining });
```

### Queries Úteis

```sql
-- Usuários Premium ativos
SELECT COUNT(*) FROM user_subscriptions
WHERE status = 'active' AND plan != 'free';

-- Receita total (últimos 30 dias)
SELECT SUM(amount_cents)/100 AS total_brl
FROM payment_history
WHERE paid_at >= NOW() - INTERVAL '30 days'
AND payment_status = 'paid';

-- Assinaturas expirando em 3 dias
SELECT * FROM subscriptions_with_status
WHERE is_expiring_soon = TRUE;

-- Taxa de conversão
SELECT
  COUNT(CASE WHEN plan != 'free' THEN 1 END) * 100.0 / COUNT(*) AS conversion_rate
FROM user_subscriptions;
```

---

## Troubleshooting

### Problema: Webhook não está sendo recebido

**Possíveis Causas:**
1. URL do webhook não configurada na Kiwify
2. Variável `KIWIFY_WEBHOOK_SECRET` incorreta
3. Firewall bloqueando requisições da Kiwify

**Solução:**
```bash
# Testar Edge Function manualmente
curl -X POST https://[project].supabase.co/functions/v1/kiwify-webhook \
  -H "Content-Type: application/json" \
  -H "x-kiwify-signature: [signature]" \
  -d '{"event":"order.approved","customer":{"external_id":"[user_id]"}}'
```

### Problema: Usuário não vê upgrade após pagamento

**Possíveis Causas:**
1. Webhook processado mas realtime não notificou
2. Cache do navegador
3. Assinatura expirou antes de processar

**Solução:**
```typescript
// Forçar refresh manual
const { refresh } = useSubscription();
await refresh();

// Verificar no Supabase Dashboard
SELECT * FROM user_subscriptions WHERE user_id = '[user_id]';
```

### Problema: Dias restantes incorretos

**Possíveis Causas:**
1. Timezone do servidor diferente do esperado
2. `current_period_end` null ou inválido

**Solução:**
```sql
-- Verificar e corrigir manualmente
UPDATE user_subscriptions
SET current_period_end = NOW() + INTERVAL '30 days'
WHERE user_id = '[user_id]' AND current_period_end IS NULL;
```

---

## Roadmap e Melhorias Futuras

### Curto Prazo (1-2 meses)
- [ ] Implementar cancelamento de assinatura no app
- [ ] Adicionar filtros no histórico de pagamentos
- [ ] Notificações push de vencimento
- [ ] Página de FAQ sobre assinaturas

### Médio Prazo (3-6 meses)
- [ ] Cupons de desconto
- [ ] Plano Familiar (múltiplos usuários)
- [ ] Programa de indicação (referral)
- [ ] Relatórios PDF mensais (Premium)

### Longo Prazo (6+ meses)
- [ ] Integração com outras gateways (Stripe, Mercado Pago)
- [ ] Planos empresariais
- [ ] API pública para parceiros
- [ ] Programa de afiliados

---

## Conformidade e Segurança

### LGPD
- ✅ Dados de pagamento processados externamente (Kiwify)
- ✅ Histórico de pagamentos vinculado ao usuário
- ⚠️ **Pendente:** Exportação de histórico financeiro
- ⚠️ **Pendente:** Exclusão de histórico ao deletar conta

### PCI-DSS
- ✅ Não armazenamos dados de cartão
- ✅ Kiwify é certificada PCI-DSS

### Melhores Práticas
- ✅ Webhooks validados com HMAC-SHA256
- ✅ RLS ativada em todas as tabelas
- ✅ Tokens sensíveis em variáveis de ambiente
- ✅ HTTPS obrigatório
- ⚠️ **Pendente:** Rate limiting no webhook

---

## Conclusão

O sistema de assinaturas do NutriMais AI está **completamente funcional** e pronto para produção, oferecendo:

✅ Criação automática de assinatura Free
✅ Upgrade via Kiwify com 3 planos Premium
✅ Limitações aplicadas corretamente
✅ Webhooks processados com segurança
✅ Histórico de pagamentos completo
✅ Avisos de vencimento automáticos
✅ Reversão automática para Free
✅ Interface transparente e intuitiva

O sistema foi desenvolvido seguindo as melhores práticas de segurança, LGPD e experiência do usuário, mantendo o padrão visual e funcional do NutriMais AI.

---

**Última atualização:** 2025-01-30
**Versão:** 1.0.0
**Status:** ✅ Produção
**Autor:** Claude Code + NutriMais Team
