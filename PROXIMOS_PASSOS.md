# Próximos Passos - Resolução Kiwify OAuth

## Situação Atual

CONCLUIDO:
- Edge Function kiwify-api deployed com sucesso
- 5 Secrets configurados no Supabase
- Teste curl executado

PROBLEMA:
- Teste retorna: erro interno na integração com a Kiwify com correlation_id
- Precisamos ver os logs para identificar o erro específico

## AÇÃO IMEDIATA NECESSÁRIA

Execute este comando no servidor Linux:

npx supabase functions logs kiwify-api --project-ref keawapzxqoyesptwpwav --limit 30

ME ENVIE TODO O RESULTADO para eu identificar o problema exato.

## O Que Vou Procurar nos Logs

1. Erro de CLIENT_SECRET (Mais Provável)
- Missing credentials
- KIWIFY_CLIENT_SECRET não encontrado
- Secret não configurado

Solução:
npx supabase secrets set KIWIFY_CLIENT_SECRET="00d8f9dc83a5afeeee0fe459cfb5265272b95e5458c4908411273e5dfac03401" --project-ref keawapzxqoyesptwpwav
npx supabase functions deploy kiwify-api --project-ref keawapzxqoyesptwpwav

2. Erro de OAuth 401/403
- Unauthorized (401)
- Forbidden (403)
- Invalid client credentials

3. Erro de Rede
- Failed to fetch
- Network error

## Comandos Úteis

Ver secrets:
npx supabase secrets list --project-ref keawapzxqoyesptwpwav

Ver logs em tempo real:
npx supabase functions logs kiwify-api --project-ref keawapzxqoyesptwpwav --follow

Testar após correções:
curl -X POST https://keawapzxqoyesptwpwav.supabase.co/functions/v1/kiwify-api -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8" -d '{"action":"oauth_status"}'

Resultado esperado (sucesso):
{"token_valid": true, "expires_at": 1234567890, "source": "api"}

## Recursos Disponíveis

- COMANDOS_LOGS_SIMPLES.txt - comandos básicos para copiar/colar
- public/guia-analise-logs.html - guia visual interativo
- public/debug-oauth-detalhado.html - ferramenta de debug

## Depois que OAuth Funcionar

1. Descobrir Plan IDs
2. Configurar Plan IDs nos secrets
3. Deploy kiwify-sync
4. Testar Sincronização

ESTOU AGUARDANDO O RESULTADO DOS LOGS PARA CONTINUAR
