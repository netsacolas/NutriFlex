# Integração Kiwify (Resumo)

A integração com a Kiwify agora funciona **exclusivamente via API oficial** (`https://public-api.kiwify.com`), com autenticação OAuth 2.0 (client credentials). Todos os webhooks anteriores foram descontinuados.

## Componentes principais

- `supabase/functions/kiwify-api`: gateway seguro usado pelo frontend e ferramentas internas.
- `supabase/functions/kiwify-sync`: job incremental responsável por sincronizar assinaturas e pagamentos.
- `services/kiwifyApiService.ts`: cliente do frontend que chama as functions (`listSubscriptions`, `cancelSubscription`, `syncSubscription`, `sync_manual`, `oauth_status`).

## Passos essenciais

1. Configurar secrets: `KIWIFY_CLIENT_ID`, `KIWIFY_CLIENT_SECRET`, `KIWIFY_ACCOUNT_ID` (+ IDs de plano).
2. Deploy das funções: `supabase functions deploy kiwify-api kiwify-sync`.
3. Agendar `kiwify-sync` (cron sugerido: `*/15 * * * *`).
4. Validar sincronização manual (`sync_manual`) e pagamentos (`payment_history`).
5. Monitorar logs com `correlation_id` (`kiwify-api` e `kiwify-sync`).

## Documentação detalhada

Consulte **`INSTRUCOES_KIWIFY_API.md`** para o passo a passo completo (setup, rotinas de sync, observabilidade, checklist pós-deploy).
