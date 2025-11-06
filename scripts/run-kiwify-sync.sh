#!/usr/bin/env bash

set -euo pipefail

SUPABASE_ENDPOINT="https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-sync"

if [[ -z "${KIWIFY_SYNC_CRON_TOKEN:-}" ]]; then
  echo "⚠️  Defina a variável KIWIFY_SYNC_CRON_TOKEN antes de executar este script." >&2
  exit 1
fi

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "⚠️  Defina a variável SUPABASE_SERVICE_ROLE_KEY antes de executar este script." >&2
  exit 1
fi

curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "x-nutrimais-cron-token: ${KIWIFY_SYNC_CRON_TOKEN}" \
  --data '{"mode":"incremental"}' \
  "${SUPABASE_ENDPOINT}"
