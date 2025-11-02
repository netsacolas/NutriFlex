# Como Ver os Logs da Kiwify API

## FORMA MAIS FACIL - Dashboard do Supabase

Acesse este link direto:
https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions/kiwify-api/logs

Voce vera todos os logs com:
- Mensagens de erro completas
- Stack traces
- Timestamps
- Correlation IDs

## Correlation IDs do Seu Teste

Procure por estes IDs nos logs:

- 52137de8-c529-4dd7-9dec-4c1e9b6df423 (teste OAuth Status)
- 6aa62db2-df07-4049-84d8-109f81fbd54f (teste Refresh)
- 4ff37a48-6521-490a-98fe-15df42114dbb (teste List)

## Via CLI (alternativa)

No servidor Linux, navegue ate o diretorio do projeto:

```bash
cd ~/projetos/nutrimais
npx supabase functions logs kiwify-api
```

## O Que Procurar nos Logs

Baseado no erro 500 que voce esta recebendo, procure por:

1. "Missing credentials" ou "KIWIFY_CLIENT_SECRET"
2. "Unauthorized" ou "Invalid credentials"
3. "Failed to fetch" ou erros de rede
4. Qualquer stack trace ou mensagem de excecao

## Solucao Preventiva

Enquanto verifica os logs, execute estes comandos no servidor:

```bash
cd ~/projetos/nutrimais

# Reconfigure os secrets com valores exatos
npx supabase secrets set KIWIFY_CLIENT_ID="4c747409-c212-45d1-aaf9-4a5d43dac808"
npx supabase secrets set KIWIFY_CLIENT_SECRET="00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac03401"
npx supabase secrets set KIWIFY_ACCOUNT_ID="av8qNBGVVoyVD75"

# Redeploy obrigatorio
npx supabase functions deploy kiwify-api

# Teste novamente
curl -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8" \
  -d '{"action":"oauth_status"}'
```

Resultado esperado (sucesso):
```json
{"token_valid": true, "expires_at": 1234567890, "source": "api"}
```

## Me Envie

- Screenshot dos logs do Dashboard, OU
- Output do comando CLI, OU
- Resultado do teste curl apos reconfigurar os secrets

Isso me permitira identificar o problema exato e fornecer a solucao.
