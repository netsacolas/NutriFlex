-- Script de Verificação do Sistema Admin
-- Execute este script no SQL Editor do Supabase para diagnosticar problemas

-- 1. Verificar se a tabela admin_users existe e tem registros
SELECT
  'admin_users' as tabela,
  COUNT(*) as total_registros,
  string_agg(email, ', ') as emails
FROM public.admin_users;

-- 2. Verificar se o usuário mariocromia@gmail.com está cadastrado
SELECT
  'Verificação mariocromia@gmail.com' as check_type,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = 'mariocromia@gmail.com'
    ) THEN '✅ Cadastrado'
    ELSE '❌ NÃO CADASTRADO - Execute o INSERT'
  END as status;

-- 3. Verificar se a view admin_user_snapshot existe
SELECT
  'admin_user_snapshot' as objeto,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name = 'admin_user_snapshot'
    ) THEN '✅ Existe'
    ELSE '❌ NÃO EXISTE - Execute migration 015'
  END as status;

-- 4. Verificar funções administrativas
SELECT
  routine_name as funcao,
  '✅ Existe' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'admin%'
ORDER BY routine_name;

-- 5. Testar a view (se existir)
SELECT
  'Teste da view' as tipo,
  COUNT(*) as total_usuarios,
  COUNT(DISTINCT plan) as planos_diferentes
FROM public.admin_user_snapshot;

-- 6. Verificar políticas RLS
SELECT
  schemaname,
  tablename,
  policyname,
  '✅ Configurada' as status
FROM pg_policies
WHERE tablename = 'admin_users';

-- 7. SOLUÇÃO: Se mariocromia@gmail.com NÃO estiver cadastrado, execute:
/*
INSERT INTO public.admin_users (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'mariocromia@gmail.com'
ON CONFLICT (email) DO NOTHING;
*/

-- 8. Verificar se há usuários no sistema
SELECT
  'Total de usuários' as metrica,
  COUNT(*) as valor
FROM auth.users;

-- 9. Verificar assinaturas
SELECT
  plan,
  COUNT(*) as quantidade
FROM public.user_subscriptions
GROUP BY plan;
