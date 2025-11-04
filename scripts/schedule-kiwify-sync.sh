#!/usr/bin/env bash

set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "⚠️  Supabase CLI não encontrado no PATH. Instale com: https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

if [[ -z "${KIWIFY_SYNC_CRON_TOKEN:-}" ]]; then
  echo "⚠️  Defina a variável de ambiente KIWIFY_SYNC_CRON_TOKEN antes de executar este script." >&2
  exit 1
fi

# Atualiza (ou cria) agendamento que dispara a função a cada 10 minutos
supabase functions schedule upsert kiwify-sync-incremental \
  --cron "*/10 * * * *" \
  --request-path "/functions/v1/kiwify-sync" \
  --request-method POST \
  --request-header "x-nutrimais-cron-token:${KIWIFY_SYNC_CRON_TOKEN}" \
  --request-body '{"mode":"incremental"}'

echo "✅ Agendamento kiwify-sync-incremental atualizado com sucesso."
