# Instruções Kiwify API

## 1. Credenciais e variáveis de ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `KIWIFY_CLIENT_ID` | Client ID fornecido pela Kiwify (OAuth client credentials) | ✅ |
| `KIWIFY_CLIENT_SECRET` | Client secret correspondente | ✅ |
| `KIWIFY_ACCOUNT_ID` | Identificador da conta na Kiwify. Usado no header `x-kiwify-account-id`. | ✅ |
| `KIWIFY_PLAN_MONTHLY_ID` | ID do plano mensal na Kiwify (para mapear `premium_monthly`) | ⚠️ Recomendado |
| `KIWIFY_PLAN_QUARTERLY_ID` | ID do plano trimestral | ⚠️ Recomendado |
| `KIWIFY_PLAN_ANNUAL_ID` | ID do plano anual | ⚠️ Recomendado |
| `KIWIFY_OAUTH_TOKEN` | (Opcional) Token seed para bootstrap manual do cache | Opcional |
| `KIWIFY_OAUTH_EXPIRES_AT` | (Opcional) Timestamp em ms do token seed | Opcional |

Aplique os valores via Supabase Secrets Vault:

```bash
supabase secrets set \
  KIWIFY_CLIENT_ID="4c747409-c212-45d1-aaf9-4a5d43dac808" \
  KIWIFY_CLIENT_SECRET="00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac03401" \
  KIWIFY_ACCOUNT_ID="av8qNBGVVoyVD75" \
  --project-ref <PROJECT_REF>
```

> Nunca commit os valores reais. Utilize o script `scripts/setup-kiwify-secrets.sh` para gravar os secrets de forma interativa.

## 2. Deploy das Edge Functions

```bash
supabase functions deploy kiwify-api kiwify-sync --project-ref <PROJECT_REF>
```

- `kiwify-api`: expõe ações seguras (listagem, cancelamento, sync manual, healthcheck OAuth).
- `kiwify-sync`: executa a sincronização incremental (assinaturas + pagamentos) via API oficial.

## 3. Job incremental (cron)

Agende a execução automática (sugerido: a cada 15 minutos):

```bash
supabase functions schedule create \
  --project-ref <PROJECT_REF> \
  --cron '*/15 * * * *' \
  kiwify-sync
```

Parar o job temporariamente:

```bash
supabase functions schedule pause kiwify-sync --project-ref <PROJECT_REF>
```

Reativar:

```bash
supabase functions schedule resume kiwify-sync --project-ref <PROJECT_REF>
```

## 4. Sync manual (on-demand)

### Por usuário (user_id)

```bash
supabase functions invoke kiwify-api \
  --project-ref <PROJECT_REF> \
  --body '{"action":"sync_subscription","user_id":"<USER_UUID>"}'
```

### Por e-mail ou assinatura

```bash
supabase functions invoke kiwify-api \
  --project-ref <PROJECT_REF> \
  --body '{
    "action": "sync_manual",
    "emails": ["cliente@exemplo.com"],
    "subscription_ids": ["sub_kiwify_123"],
    "include_payments": true
  }'
```

### Forçar execução completa (últimas 24h)

```bash
supabase functions invoke kiwify-sync \
  --project-ref <PROJECT_REF> \
  --body '{"since": "${SINCE_ISO}", "include_payments": true}'
```

> O job aplica janela com overlap de 5 minutos e respeita o rate limit (100 req/min) automaticamente.

## 5. Observabilidade e logs

- `supabase functions logs kiwify-sync --follow --project-ref <PROJECT_REF>`: acompanha execuções do job incremental.
- `supabase functions logs kiwify-api --follow --project-ref <PROJECT_REF>`: monitora ações manuais (cancelamentos, sync pontual, teste OAuth).
- Todos os logs exibem `correlation_id`. Use esse campo para correlacionar entradas de assinatura e pagamento.
- Métricas emitidas:
  - `subscriptions_persisted`
  - `payments_inserted`
  - `users_matched` / `users_missing`
  - `last_subscription_timestamp` / `last_payment_timestamp`

## 6. Persistência de dados

### `user_subscriptions`

Campos atualizados pelo sync:

- `plan`: `free` ou `premium_*` (mapeado por ID/frequência)
- `status`: `active`, `cancelled`, `past_due`, `incomplete`
- `current_period_start` / `current_period_end`
- `kiwify_subscription_id`, `kiwify_plan_id`, `kiwify_order_id`
- `last_event_at`

### `payment_history`

Inserções somente para pagamentos efetivados:

- `amount_cents` (conversão automática para centavos)
- `currency` (padrão `BRL`)
- `payment_method`
- `kiwify_order_id` (constraint única)
- `kiwify_transaction_id`
- `payment_status = 'paid'`
- `paid_at`

## 7. Testes rápidos

1. **OAuth**: `supabase functions invoke kiwify-api --body '{"action":"oauth_status"}'`
   - Confirme `token_valid: true` e verifique `expires_at`.
2. **Sync manual**: execute `sync_manual` para um usuário real e confira as tabelas.
3. **Pagamentos**: gere uma compra teste na Kiwify, rode o sync e valide `payment_history` (sem duplicidade).
4. **Rate limit**: monitore logs buscando `rate_limited` ou `server_error_retry`; o backoff deve funcionar automaticamente.

## 8. Rotação de credenciais

1. Gere novo client secret no painel da Kiwify.
2. Atualize o secret no Supabase Vault (`supabase secrets set KIWIFY_CLIENT_SECRET=...`).
3. Invoque `oauth_status` com `force_refresh: true` para garantir que o token antigo foi descartado.
4. Opcional: limpe o cache persistido executando `supabase functions invoke kiwify-sync --body '{"include_payments": false}'` (um refresh é realizado na primeira chamada).

## 9. Checklist pós-deploy

- [ ] Secrets atualizados (`KIWIFY_CLIENT_*`, `KIWIFY_ACCOUNT_ID`, `KIWIFY_PLAN_*_ID`).
- [ ] Job `kiwify-sync` agendado e em execução.
- [ ] Sync manual validado (assinatura + pagamento) em ambiente de teste.
- [ ] Logs conferidos com `correlation_id` e métricas positivas.
- [ ] Documentação interna revisada (`CLAUDE.md`, `agents.md`, `README`, esta instrução).
- [ ] Variáveis antigas de webhook removidas de todos os ambientes (`KIWIFY_WEBHOOK_SECRET`).

## 10. Referências úteis

- Base URL oficial: https://public-api.kiwify.com
- Documentação pública: https://developers.kiwify.com.br
- Suporte Kiwify: developers@kiwify.com.br
