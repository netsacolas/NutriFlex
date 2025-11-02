# 🚨 SOLUÇÃO: Erro "Unauthorized" no Painel Admin

## Problema

A página `/admin` mostra erro "Unauthorized" e no console aparecem erros:
```
TypeError: error sending request for url (https://keawapzxqoyesptwpwav.supabase.co/auth/v1/user): client error
```

## Causa Raiz

O problema pode ser um dos seguintes:

1. **Migration 014 não foi aplicada** (tabela `admin_users` não existe)
2. **Usuário `mariocromia@gmail.com` não está cadastrado** em `admin_users`
3. **Migration 015 não foi aplicada** (view `admin_user_snapshot` não existe)
4. **Edge Function não foi deployada** ou está com versão antiga

## ✅ SOLUÇÃO PASSO A PASSO

### PASSO 1: Verificar o estado atual

Execute no **SQL Editor** do Supabase: `scripts/verify-admin-setup.sql`

Ou execute direto:

```sql
-- Verificar se admin_users existe
SELECT COUNT(*) FROM public.admin_users WHERE email = 'mariocromia@gmail.com';

-- Verificar se a view existe
SELECT COUNT(*) FROM public.admin_user_snapshot LIMIT 1;

-- Verificar funções
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name LIKE 'admin%';
```

### PASSO 2: Aplicar todas as migrations

**Execute o script consolidado completo:**

No SQL Editor, execute TODO o conteúdo de: `scripts/apply-admin-system.sql`

Este script inclui:
- ✅ Tabela `admin_users`
- ✅ Cadastro de `mariocromia@gmail.com`
- ✅ Funções básicas (`is_admin`, `admin_search_users`, `admin_update_subscription`)
- ✅ View `admin_user_snapshot`
- ✅ Funções avançadas (`admin_list_users`, `admin_get_plan_metrics`, etc.)
- ✅ Tabelas de auditoria e segmentos

### PASSO 3: Verificar se o usuário foi cadastrado

```sql
SELECT
  au.email,
  au.id,
  admin.id as admin_id
FROM auth.users au
LEFT JOIN public.admin_users admin ON admin.user_id = au.id
WHERE au.email = 'mariocromia@gmail.com';
```

**Resultado esperado:**
- Deve mostrar o email
- `admin_id` NÃO pode ser `null`

**Se admin_id estiver NULL**, execute:

```sql
INSERT INTO public.admin_users (user_id, email)
SELECT id, 'mariocromia@gmail.com'
FROM auth.users
WHERE email = 'mariocromia@gmail.com'
ON CONFLICT (email) DO NOTHING;
```

### PASSO 4: Deploy da Edge Function

**Opção A: Via Dashboard (RECOMENDADO)**

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/functions
2. Procure `admin-operations` na lista
3. Clique em "Edit"
4. Cole TODO o conteúdo de `supabase/functions/admin-operations/index.ts`
5. Clique em "Deploy"

**Opção B: Via CLI (se configurado)**

```bash
npx supabase login
npx supabase link --project-ref keawapzxqoyesptwpwav
npx supabase functions deploy admin-operations
```

### PASSO 5: Verificar secrets da Edge Function

A Edge Function precisa destas variáveis de ambiente:

1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav/settings/functions
2. Verifique se existem:
   - `PROJECT_URL` ou `SUPABASE_URL`
   - `SERVICE_ROLE_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`

**Se não existirem**, adicione manualmente no Dashboard.

### PASSO 6: Testar a Edge Function

Execute este curl para testar:

```bash
curl -X POST \
  'https://keawapzxqoyesptwpwav.supabase.co/functions/v1/admin-operations' \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI' \
  -H 'Content-Type: application/json' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXdhcHp4cW95ZXNwdHdwd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzE4MTAsImV4cCI6MjA3Njk0NzgxMH0.gc42HHODbHSsIIztIevnER6zt__CN19Mm7Ba0a98kM8' \
  -d '{"action": "get_metrics", "type": "plan"}'
```

**Resposta esperada:**
```json
{
  "plans": [
    {"metric": "free", "total": X},
    {"metric": "premium_monthly", "total": Y}
  ]
}
```

### PASSO 7: Limpar cache do navegador e testar

1. Abra o navegador em modo anônimo (Ctrl+Shift+N)
2. Acesse a aplicação
3. Faça login com `mariocromia@gmail.com`
4. Verifique se aparece o item "Administração" no menu
5. Clique em "Administração"
6. A página deve carregar sem erro "Unauthorized"

## 🔍 Diagnóstico de Erros Específicos

### Erro: "Forbidden: Admin access required"

**Causa:** Usuário não está em `admin_users`

**Solução:**
```sql
INSERT INTO public.admin_users (user_id, email)
SELECT id, 'mariocromia@gmail.com' FROM auth.users
WHERE email = 'mariocromia@gmail.com';
```

### Erro: "function admin_list_users does not exist"

**Causa:** Migration 015 não foi aplicada

**Solução:** Execute `scripts/apply-admin-system.sql` completo

### Erro: "view admin_user_snapshot does not exist"

**Causa:** Migration 015 não criou a view

**Solução:** Execute manualmente a seção da view em `apply-admin-system.sql`

### Erro: "Invalid action: list_users"

**Causa:** Edge Function não foi deployada ou está com versão antiga

**Solução:** Faça deploy da Edge Function (Passo 4)

### Erro: "Unauthorized" (401)

**Causas possíveis:**
1. Token expirado - faça logout e login novamente
2. Edge Function sem SERVICE_ROLE_KEY - adicione nos secrets
3. ANON_KEY inválida - verifique `.env.local`

## 📋 Checklist Final

Antes de declarar que está funcionando, verifique:

- [ ] Tabela `admin_users` existe e tem registros
- [ ] `mariocromia@gmail.com` está em `admin_users`
- [ ] View `admin_user_snapshot` existe e retorna dados
- [ ] Funções `admin_*` existem (pelo menos 10 funções)
- [ ] Edge Function `admin-operations` está deployada
- [ ] Secrets da Edge Function estão configurados
- [ ] Item "Administração" aparece no menu quando logado com `mariocromia@gmail.com`
- [ ] Página `/admin` carrega sem erro "Unauthorized"
- [ ] Cards de métricas aparecem no topo da página
- [ ] Tabela de usuários carrega com dados

## 🎯 Teste Rápido

Execute esta query para ver todos os usuários na view:

```sql
SELECT
  email,
  plan,
  plan_label,
  status,
  days_remaining,
  risk_bucket
FROM public.admin_user_snapshot
ORDER BY email
LIMIT 10;
```

**Se retornar dados:** ✅ A view está funcionando
**Se der erro:** ❌ Execute a migration 015 novamente

---

## 🆘 Se NADA funcionar

Execute TUDO do zero:

1. **Backup** (se tiver dados importantes):
```sql
-- Backup de admin_users
CREATE TABLE admin_users_backup AS SELECT * FROM admin_users;
```

2. **Limpar tudo**:
```sql
DROP VIEW IF EXISTS public.admin_user_snapshot CASCADE;
DROP TABLE IF EXISTS public.admin_subscription_audit CASCADE;
DROP TABLE IF EXISTS public.admin_saved_segments CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP FUNCTION IF EXISTS public.admin_list_users CASCADE;
DROP FUNCTION IF EXISTS public.admin_get_plan_metrics CASCADE;
-- etc...
```

3. **Executar** `scripts/apply-admin-system.sql` completo

4. **Deploy** da Edge Function

5. **Testar** novamente

---

**Última atualização:** 02 Nov 2025, 11:54
**Status:** Aguardando execução das migrations e deploy da Edge Function
