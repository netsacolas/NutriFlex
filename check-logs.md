# Como Verificar Logs da Edge Function

## 1. Via Supabase Dashboard

Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/logs/edge-functions

Filtros:
- Function: `kiwify-api`
- Procure por: `sync_manual_completed` ou `subscription_upsert_failed`

## 2. Via CLI

```bash
npx supabase functions logs kiwify-api --project-ref keawapzxqoyesptwpwav
```

## 3. Buscar por Correlation ID

Se você tiver um correlation_id de uma chamada específica:

```bash
npx supabase functions logs kiwify-api | grep "SEU_CORRELATION_ID"
```

## 4. O que procurar nos logs

### ✅ Sucesso (esperado):
```json
{
  "level": "INFO",
  "message": "sync_manual_completed",
  "subscriptions": 1,
  "payments": 0
}
```

### ❌ Erros comuns:

**Usuário não encontrado:**
```json
{
  "level": "WARN",
  "message": "subscription_user_not_found",
  "subscription_id": "xxx"
}
```

**Erro ao salvar:**
```json
{
  "level": "ERROR",
  "message": "subscription_upsert_failed",
  "error": "..."
}
```

**Plan ID não reconhecido:**
```json
{
  "level": "WARN",
  "message": "plan_id_not_found"
}
```

## 5. Verificar estado atual do banco

Execute este SQL no Supabase SQL Editor:

```sql
-- Ver todas as assinaturas ativas
SELECT
  u.email,
  s.plan,
  s.status,
  s.kiwify_plan_id,
  s.updated_at
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
ORDER BY s.updated_at DESC
LIMIT 20;
```

```sql
-- Ver assinatura de um email específico
SELECT
  u.email,
  s.plan,
  s.status,
  s.kiwify_plan_id,
  s.current_period_end,
  s.updated_at
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'EMAIL_AQUI';
```

## 6. Forçar sincronização de um email

```bash
node test-user-email.js EMAIL_AQUI
```
