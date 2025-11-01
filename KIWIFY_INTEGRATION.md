# 🎉 Integração Kiwify - NutriMais AI

## ✅ Status da Integração

**Data de Conclusão:** 29 de Outubro de 2025  
**Status:** ✅ Totalmente integrado (API oficial + sincronização automática)

---

## 📋 Planos Configurados

### 1️⃣ Plano Mensal - R$ 19,90/mês
- **Checkout:** https://pay.kiwify.com.br/y3vvLeb
- **Benefícios:** refeições ilimitadas, histórico completo, chat IA, relatórios personalizados, suporte prioritário

### 2️⃣ Plano Trimestral - R$ 47,00/trimestre
- **Checkout:** https://pay.kiwify.com.br/rIx7EEh
- **Economia:** 21% vs mensal  
- **Benefícios extras:** acesso a betas, renovação automática trimestral

### 3️⃣ Plano Anual - R$ 179,90/ano ⭐ RECOMENDADO
- **Checkout:** https://pay.kiwify.com.br/qIQusYO
- **Economia:** 25% vs mensal  
- **Benefícios extras:** prioridade em novidades, relatórios avançados

---

## 🔧 Configuração Técnica (resumo)

```env
# Frontend (links de checkout)
VITE_KIWIFY_CHECKOUT_MONTHLY=https://pay.kiwify.com.br/y3vvLeb
VITE_KIWIFY_CHECKOUT_QUARTERLY=https://pay.kiwify.com.br/rIx7EEh
VITE_KIWIFY_CHECKOUT_ANNUAL=https://pay.kiwify.com.br/qIQusYO

# Supabase Secrets (Vault)
KIWIFY_CLIENT_ID=4c747409-c212-45d1-aaf9-4a5d43dac808
KIWIFY_CLIENT_SECRET=00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac03401
KIWIFY_ACCOUNT_ID=av8qNBGVVoyVD75
KIWIFY_PLAN_MONTHLY_ID=<id_plano_mensal>
KIWIFY_PLAN_QUARTERLY_ID=<id_plano_trimestral>
KIWIFY_PLAN_ANNUAL_ID=<id_plano_anual>
```

> Webhook foi descontinuado. Nenhuma variável `KIWIFY_WEBHOOK_*` é necessária.

---

## 🔁 Fluxo Atualizado (API)

1. **Agendador Supabase** chama `kiwify-sync` a cada 10-15 minutos.  
2. **Edge Function `kiwify-sync`** obtém token OAuth (`/oauth/token`) e consulta `https://public-api.kiwify.com/v1/subscriptions` e `/v1/payments`.  
3. Dados são processados com backoff/retries e upsert em `user_subscriptions` + insert seguro em `payment_history`.  
4. Frontend recebe atualizações via Realtime e enforce de limites.  
5. Operações de suporte (cancelamento, sync manual, status OAuth) passam por `kiwify-api`.

### Principais arquivos
- `supabase/functions/kiwify-sync/index.ts`
- `supabase/functions/kiwify-api/index.ts`
- `services/kiwifyApiService.ts`
- `services/subscriptionService.ts`

---

## 📊 Monitoramento

- `supabase functions logs kiwify-sync --follow` → sincronização periódica (exibe `subscriptions_persisted`, `payments_inserted`, `users_matched`, `correlation_id`).
- `supabase functions logs kiwify-api --follow` → ações manuais (cancelamento, sync pontual, diagnóstico OAuth).
- `kiwify_sync_state` guarda o último cursor/`last_synced_at` processado.
- Constraint `payment_history(kiwify_order_id)` evita duplicidade em reprocessamentos.

---

## ✅ Checklist de Validação

- [x] Secrets Kiwify configurados no Vault (`KIWIFY_CLIENT_*`, `KIWIFY_ACCOUNT_ID`, `KIWIFY_PLAN_*`).
- [x] Funções deployadas (`supabase functions deploy kiwify-api kiwify-sync`).
- [x] Job agendado (`supabase functions schedule create --cron '*/15 * * * *' kiwify-sync`).
- [x] Sync manual validado (`sync_manual` por e-mail/assinatura) com atualização das tabelas.
- [x] Logs monitorados usando `correlation_id`.
- [x] Variáveis/rotas de webhook removidas de todos os ambientes.

---

## 🔐 Segurança & Boas Práticas

- Tokens e segredos nunca aparecem em logs.
- Cache OAuth em memória + Deno KV; refresh automático com margem de 5 minutos.
- Rate limit respeitado (100 req/min) com intervalo mínimo de 600 ms entre chamadas + backoff exponencial em 429/5xx.
- Manual de suporte e procedimentos completos em `INSTRUCOES_KIWIFY_API.md`.

---

## 🚀 Próximos passos sugeridos

1. Criar alertas (Logflare/Observability) para falhas de sync (`errors > 0`).
2. Implementar dashboard interno exibindo métricas de sincronização (totais por janela, último sucesso, usuários pendentes).
3. Automatizar testes end-to-end simulando compra/cancelamento via API sandbox da Kiwify.
