# Integracao Kiwify por Webhook (NutriMais)

Este guia cobre a operacao completa do fluxo de assinaturas do NutriMais utilizando apenas webhooks da Kiwify (sem chamadas OAuth). Use-o para implantar, testar e monitorar o processamento de eventos como compras aprovadas, pagamentos em PIX e cancelamentos.

## 1. Pre-requisitos

- Acesso ao painel da **Kiwify** (URL do produto, area de webhooks e relatorios).
- Acesso ao projeto **Supabase** da instalacao do NutriMais (Secrets, Edge Functions, tabelas `user_subscriptions` e `payment_history`).
- Ambiente com **Supabase CLI** configurada (`supabase login` + `supabase link --project-ref <ref>`).
- Conhecimento dos IDs de plano Kiwify (mensal, trimestral, anual) e do secret de webhook.

## 2. Configuracao na Kiwify

1. No dashboard, abra **Configurar > Webhooks**.
2. Adicione um webhook apontando para a URL publica da Edge Function
   ```
   https://<PROJECT_REF>.functions.supabase.co/kiwify-webhook
   ```
3. Gere um **token/secret** exclusivo para o webhook, copie imediatamente e armazene em local seguro. (A Kiwify nao exibe o secret novamente.)
4. Associe o webhook aos produtos/planos relevantes (mensal, trimestral, anual).
5. Utilize o botao **Reenviar webhook** da Kiwify para testes sempre que necessario (voce pode reenviar o ultimo evento entregue).

## 3. Configuracao no Supabase

1. Defina os secrets obrigatorios:
   ```bash
   supabase secrets set \
     KIWIFY_WEBHOOK_SECRET=<secret_webhook> \
     SUPABASE_URL=<supabase_url> \
     SUPABASE_SERVICE_ROLE_KEY=<service_role>
   ```
2. Opcional mas recomendado: mapear os ID dos planos para garantir o plano correto mesmo que a Kiwify mude labels.
   ```bash
   supabase secrets set \
     KIWIFY_PLAN_MONTHLY_ID=<id_plano_mensal> \
     KIWIFY_PLAN_QUARTERLY_ID=<id_plano_trimestral> \
     KIWIFY_PLAN_ANNUAL_ID=<id_plano_anual>
   ```
3. Verifique que o header `x-kiwify-signature` esta presente em `supabase/functions/kiwify-webhook/index.ts` (CORS liberado).
4. Publique a funcao:
   ```bash
   supabase functions deploy kiwify-webhook
   ```
5. Garanta que a tabela `payment_history` possua a constraint `UNIQUE (kiwify_order_id)` (migration `011_kiwify_sync_state.sql` adiciona essa constraint). Sem ela, o webhook pode registrar pagamentos duplicados em reenvios.

## 4. Fluxo tecnico da Edge Function

1. Recebe o payload bruto (`req.text()`) antes de qualquer parse.
2. Reprocessa o JSON removendo o campo `signature` e gera uma versao compactada (`JSON.stringify`).
3. Calcula HMAC usando o secret do webhook:
   - tenta primeiro **SHA-1**
   - se nao bater, tenta **SHA-256**.
4. Aceita a assinatura:
   - preferencialmente pelo header `x-kiwify-signature`;
   - fallback para o campo `signature` dentro do corpo.
5. Em caso de mismatch, responde **401** e registra log `signature_invalid` (sem expor segredos).
6. Cada evento gera um **`event_correlation_id`** (hash curto derivado de `order_id`, `subscription_id`, timestamp). Todos os logs carregam esse ID.
7. Eventos relevantes (`order.*`, `subscription.*`, `payment.*`, `charge.*`) sao processados; demais sao respondidos com 200 e `ignored: true`.

## 5. Mapeamentos (status e planos)

### Status

| Entrada (evento/status Kiwify) | Status persistido |
| ------------------------------ | ----------------- |
| approved, paid, completed, active | `active` |
| contem `cancel` | `cancelled` |
| past_due, overdue | `past_due` |
| demais casos | `incomplete` |

### Plano

1. Se houver `plan_id` e ele corresponder a algum `KIWIFY_PLAN_*_ID`, persiste o plano premium correspondente.
2. Senao, usa `frequency`/`billing_period`:
   - month -> `premium_monthly`
   - quarter/quarterly -> `premium_quarterly`
   - year/annual -> `premium_annual`
3. Se o status final nao for `active`, o plano gravado volta para `free`.

### Periodos

- `current_period_start`: prioridade `start_date` > `current_period_start` > `approved_at/approved_date` > `created_at`.
- `current_period_end`: prioridade `next_payment` > `current_period_end` > `expiration_date`.

## 6. Persistencia e idempotencia

- `user_subscriptions`: `upsert` por `user_id` sempre atualiza plano, status, periodos, IDs Kiwify e `last_event_at`.
- `payment_history`: `insert` com `kiwify_order_id`. Em caso de erro `23505` (duplicate key) a funcao registra log `skip_duplicate_payment` e continua sem falhar.
- Eventos sem usuario correspondente (email divergente) retornam **202** com log `user_not_found`; o replay nao sera processado ate que o usuario seja identificado manualmente.

## 7. Logs e observabilidade

Formato padrao:
```json
{
  "level": "INFO|WARN|ERROR",
  "message": "webhook_received|signature_valid|upsert_subscription|insert_payment|skip_duplicate_payment|webhook_processed|...",
  "event_correlation_id": "abc123def456",
  "event_type": "order_approved",
  "order_id": "12345",
  "subscription_id": "sub_6789",
  "customer_email": "cliente@exemplo.com",
  "user_id": "uuid-supabase",
  "action": "insert_payment",
  "outcome": "success|duplicate|error|skipped"
}
```

Consulta no Supabase:
```bash
supabase functions logs kiwify-webhook --follow --project-ref <PROJECT_REF>
```
Filtro recomendado: usar o `event_correlation_id` exibido no log `webhook_received`.

## 8. Plano de testes guiado

1. **Ping basico**: acione a funcao via `curl` com payload minimo para conferir CORS e assinatura invalida.
2. **Compra real (ex.: plano trimestral)**:
   - espere o webhook;
   - confirme `user_subscriptions.plan = premium_quarterly`, `status = active`;
   - verifique `payment_history` com 1 linha contendo o `kiwify_order_id`.
3. **Reenvio do mesmo webhook**:
   - acione "Reenviar" na Kiwify;
   - confirme inexistencia de novos registros em `payment_history`;
   - avalie log `skip_duplicate_payment`.
4. **Cancelamento**:
   - cancele a assinatura no painel Kiwify;
   - aguarde o webhook;
   - confirme `user_subscriptions.status = cancelled` e `plan = free`.

## 9. Troubleshooting rapido

| Sintoma | Causa provavel | Acao corretiva |
| ------- | -------------- | --------------- |
| **401 Invalid signature** | Secret divergente, header ausente, JSON nao-compacto | Validar `KIWIFY_WEBHOOK_SECRET`, conferir se a Kiwify envia `x-kiwify-signature`, inspecionar se o payload foi modificado antes da assinatur a. |
| **202 User not found** | Email da Kiwify nao existe no Auth | Criar/associar usuario correspondente no Supabase; reenvie o webhook. |
| **Pagamentos duplicados** | Constraint ausente ou dados reprocessados manualmente | Verificar constraint `UNIQUE(kiwify_order_id)`; checar se logs registraram `skip_duplicate_payment`. |
| **500 Internal error** | Falha ao acessar Supabase ou banco | Conferir segredos `SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY`; revisar logs `upsert_subscription_failed` ou `insert_payment_failed`. |

## 10. Operacao continua

- Revise periodicamente os logs em busca de `WARN` e `ERROR`. Crie alertas em cima de `signature_invalid` e `user_not_found`.
- Sempre que o secret for rotacionado na Kiwify, atualize o segredo no Supabase e redeploy a funcao (`supabase secrets set ...` + `supabase functions deploy kiwify-webhook`).
- Para auditorias, filtre `payment_history` por `kiwify_order_id` e compare com os relatórios de vendas da Kiwify.
- Agende testes controlados trimestrais (compra + cancelamento) para validar o fluxo ponta a ponta.

---

**Referencias rapidas**

- Deploy: `supabase functions deploy kiwify-webhook`
- Logs: `supabase functions logs kiwify-webhook --follow`
- Migração (constraint): `supabase/migrations/011_kiwify_sync_state.sql`

