# 🔧 CORREÇÃO URGENTE: Erro "Database error saving new user"

## 🎯 Problema Identificado

O erro ocorre devido a um **conflito entre triggers** no Supabase:

1. ✅ Trigger `on_auth_user_created` (migration 001) → cria perfil
2. ✅ Trigger `trg_auth_user_create_subscription` (migration 009) → cria assinatura
3. ❌ **Ambos disparam ao mesmo tempo** causando conflito de permissões e contexto

## 🚀 Solução Aplicada

Criei a migration `013_fix_user_creation_triggers.sql` que:
- Remove os triggers duplicados
- Cria uma **função consolidada única** que cria perfil E assinatura
- Usa `SECURITY DEFINER` com `search_path` correto

## 📋 Passos para Aplicar a Correção

### Opção 1: Executar Migration Individual (Recomendado)

1. Acesse o Supabase Dashboard:
   - URL: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav

2. Vá em: **SQL Editor** → **New query**

3. Cole o conteúdo do arquivo:
   ```
   supabase/migrations/013_fix_user_creation_triggers.sql
   ```

4. Clique em **Run**

5. Verifique se apareceu "Success. No rows returned"

### Opção 2: Executar Script Consolidado Completo

1. Acesse o Supabase Dashboard (mesmo link acima)

2. Vá em: **SQL Editor** → **New query**

3. Cole o conteúdo **completo** do arquivo:
   ```
   apply-all-migrations.sql
   ```
   ⚠️ **ATENÇÃO**: Este script já foi atualizado com a correção no início!

4. Clique em **Run**

## ✅ Como Verificar se Funcionou

1. Após executar a migration, tente criar uma nova conta

2. Se o cadastro for bem-sucedido, você verá:
   - ✅ "Conta criada com sucesso!"
   - ✅ Usuário criado em `auth.users`
   - ✅ Perfil criado em `public.profiles`
   - ✅ Assinatura criada em `public.user_subscriptions`

3. Verifique no Supabase:
   ```sql
   -- Consulta para verificar triggers ativos
   SELECT
       trigger_name,
       event_manipulation,
       event_object_table,
       action_statement
   FROM information_schema.triggers
   WHERE event_object_schema = 'auth'
   AND event_object_table = 'users';
   ```

   Deve retornar **apenas 1 trigger**: `on_auth_user_created_complete`

## 🔍 Detalhes Técnicos

### Antes (PROBLEMA):
```sql
-- Trigger 1
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user(); -- SEM SECURITY DEFINER

-- Trigger 2 (CONFLITO!)
CREATE TRIGGER trg_auth_user_create_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_subscription(); -- COM SECURITY DEFINER
```

### Depois (SOLUÇÃO):
```sql
-- Trigger único consolidado
CREATE TRIGGER on_auth_user_created_complete
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_complete();

-- Função consolidada com permissões corretas
CREATE OR REPLACE FUNCTION public.handle_new_user_complete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Cria perfil
    INSERT INTO public.profiles (id, full_name, created_at, updated_at)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Cria assinatura gratuita
    INSERT INTO public.user_subscriptions (user_id, plan, status, current_period_start)
    VALUES (NEW.id, 'free', 'active', NOW())
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🆘 Se Ainda Houver Erro

1. Verifique os logs do Supabase:
   - Dashboard → Logs → Postgres Logs

2. Procure por erros relacionados a:
   - `permission denied`
   - `trigger`
   - `function`
   - `user_subscriptions`

3. Confirme que a tabela `user_subscriptions` existe:
   ```sql
   SELECT * FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'user_subscriptions';
   ```

4. Se a tabela não existir, execute primeiro:
   ```sql
   -- Conteúdo da migration 009_add_subscriptions.sql
   ```

---

**Data da correção**: 2025-11-01
**Versão**: 1.3.2
**Commit**: f7e8289 (restaurado) + correção aplicada
