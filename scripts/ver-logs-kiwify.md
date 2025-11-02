# 🔍 Como Ver Logs Detalhados da Edge Function

## Correlation ID do seu erro:
```
09498153-06c6-42b2-a42d-04cd1bac7470
```

## Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions/kiwify-api/logs

2. Procure pelo `correlation_id`: `09498153-06c6-42b2-a42d-04cd1bac7470`

3. Clique no log para ver detalhes completos do erro

## Opção 2: Via SQL Editor

Execute esta query no SQL Editor do Supabase:

```sql
-- Ver logs da Edge Function kiwify-api
SELECT
  timestamp,
  event_message,
  metadata
FROM edge_logs
WHERE metadata->>'correlation_id' = '09498153-06c6-42b2-a42d-04cd1bac7470'
ORDER BY timestamp DESC;
```

## Opção 3: Inspecionar no Navegador

1. Abra test-kiwify-oauth.html
2. Pressione **F12** (Developer Tools)
3. Vá na aba **Console**
4. Clique em "Verificar Status OAuth"
5. Veja se há erros em vermelho

## Erros Comuns e Soluções

### Erro: "KIWIFY_CLIENT_ID is not set"
**Causa**: Secret não configurado
**Solução**:
```bash
npx supabase secrets set KIWIFY_CLIENT_ID="4c747409-c212-45d1-aaf9-4a5d43dac808"
```

### Erro: "KIWIFY_CLIENT_SECRET is not set"
**Causa**: Secret não configurado
**Solução**:
```bash
npx supabase secrets set KIWIFY_CLIENT_SECRET="seu-secret-completo-aqui"
```

### Erro: "Failed to fetch token"
**Causa**: Credenciais OAuth incorretas
**Solução**: Verifique se CLIENT_ID e CLIENT_SECRET estão corretos

### Erro: "Invalid credentials"
**Causa**: CLIENT_SECRET está errado
**Solução**: Copie novamente o CLIENT_SECRET da imagem que você enviou

### Erro: "SUPABASE_SERVICE_ROLE_KEY is not set"
**Causa**: Secret do Supabase não configurado
**Solução**:
1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/api
2. Copie a "service_role" key (secret)
3. Configure: `npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJ..."`

## Próximos Passos

Depois de ver o log detalhado, me envie:
1. A mensagem de erro exata
2. Screenshot dos logs (se possível)
3. Vou te ajudar a resolver!
