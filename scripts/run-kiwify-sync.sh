#!/usr/bin/env bash

set -euo pipefail

SUPABASE_ENDPOINT="https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-sync"

if [[ -z "${KIWIFY_SYNC_CRON_TOKEN:-}" ]]; then
  echo "⚠️  Defina a variável KIWIFY_SYNC_CRON_TOKEN antes de executar este script." >&2
  exit 1
fi

curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "x-nutrimais-cron-token: ${KIWIFY_SYNC_CRON_TOKEN}" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwNDgzNzgsImV4cCI6MjA0NTYyNDM3OH0.vF3ypBzW-pYbLSr9fS5tRAJL3JD66qWXJ8ztC5KkRKM" \
  --data '{"mode":"incremental"}' \
  "${SUPABASE_ENDPOINT}"
