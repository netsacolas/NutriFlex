-- Script de Diagnóstico Completo do Sistema Admin
-- Execute este script no SQL Editor do Supabase

-- ========================================
-- 1. VERIFICAR USUÁRIO ADMIN
-- ========================================
SELECT
  '1. VERIFICAR USUÁRIO ADMIN' as secao,
  au.email,
  au.id as user_id,
  admin.id as admin_id,
  admin.created_at as admin_desde,
  CASE
    WHEN admin.id IS NOT NULL THEN '✅ CADASTRADO'
    ELSE '❌ NÃO CADASTRADO'
  END as status
FROM auth.users au
LEFT JOIN public.admin_users admin ON admin.user_id = au.id
WHERE au.email = 'mariocromia@gmail.com';

-- ========================================
-- 2. VERIFICAR TODAS AS FUNÇÕES ADMIN
-- ========================================
SELECT
  '2. FUNÇÕES ADMIN EXISTENTES' as secao,
  routine_name as funcao,
  routine_type as tipo,
  '✅' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'admin%'
ORDER BY routine_name;

-- ========================================
-- 3. VERIFICAR VIEW ADMIN_USER_SNAPSHOT
-- ========================================
SELECT
  '3. VIEW ADMIN_USER_SNAPSHOT' as secao,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name = 'admin_user_snapshot'
    ) THEN '✅ View existe'
    ELSE '❌ View NÃO existe'
  END as status;

-- Testar a view
SELECT
  '3.1. TESTE DA VIEW' as secao,
  COUNT(*) as total_usuarios,
  COUNT(DISTINCT plan) as total_planos
FROM public.admin_user_snapshot;

-- ========================================
-- 4. VERIFICAR TABELAS DO SISTEMA ADMIN
-- ========================================
SELECT
  '4. TABELAS DO SISTEMA' as secao,
  table_name as tabela,
  '✅' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('admin_users', 'admin_subscription_audit', 'admin_saved_segments')
ORDER BY table_name;

-- ========================================
-- 5. TESTAR FUNÇÃO IS_ADMIN
-- ========================================
SELECT
  '5. TESTAR FUNÇÃO IS_ADMIN' as secao,
  public.is_admin() as resultado,
  CASE
    WHEN public.is_admin() = true THEN '✅ Você é admin'
    ELSE '❌ Você NÃO é admin'
  END as status;

-- ========================================
-- 6. LISTAR TODOS OS USUÁRIOS ADMIN
-- ========================================
SELECT
  '6. TODOS OS ADMINS CADASTRADOS' as secao,
  admin.email,
  admin.created_at,
  au.email as email_auth,
  au.confirmed_at,
  au.last_sign_in_at
FROM public.admin_users admin
LEFT JOIN auth.users au ON au.id = admin.user_id
ORDER BY admin.created_at;

-- ========================================
-- 7. VERIFICAR POLÍTICAS RLS
-- ========================================
SELECT
  '7. POLÍTICAS RLS ADMIN' as secao,
  schemaname,
  tablename,
  policyname,
  cmd as operacao,
  '✅' as status
FROM pg_policies
WHERE tablename IN ('admin_users', 'admin_subscription_audit', 'admin_saved_segments')
ORDER BY tablename, policyname;

-- ========================================
-- 8. ESTATÍSTICAS GERAIS
-- ========================================
SELECT
  '8. ESTATÍSTICAS GERAIS' as secao,
  (SELECT COUNT(*) FROM auth.users) as total_usuarios,
  (SELECT COUNT(*) FROM public.user_subscriptions) as total_assinaturas,
  (SELECT COUNT(*) FROM public.admin_users) as total_admins,
  (SELECT COUNT(*) FROM public.admin_subscription_audit) as total_auditorias;

-- ========================================
-- 9. USUÁRIOS POR PLANO
-- ========================================
SELECT
  '9. DISTRIBUIÇÃO DE PLANOS' as secao,
  plan,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.user_subscriptions), 2) as percentual
FROM public.user_subscriptions
GROUP BY plan
ORDER BY quantidade DESC;

-- ========================================
-- 10. VERIFICAR SE MIGRATION 014 FOI APLICADA
-- ========================================
SELECT
  '10. MIGRATION 014 (ADMIN SYSTEM)' as secao,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'admin_users'
    ) THEN '✅ Aplicada'
    ELSE '❌ NÃO aplicada'
  END as status;

-- ========================================
-- 11. VERIFICAR SE MIGRATION 015 FOI APLICADA
-- ========================================
SELECT
  '11. MIGRATION 015 (ADMIN ENHANCEMENTS)' as secao,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'public' AND table_name = 'admin_user_snapshot'
    ) THEN '✅ Aplicada'
    ELSE '❌ NÃO aplicada'
  END as status;

-- ========================================
-- 12. AMOSTRA DE USUÁRIOS NA VIEW
-- ========================================
SELECT
  '12. AMOSTRA DE USUÁRIOS' as secao,
  email,
  plan,
  plan_label,
  status,
  days_remaining,
  risk_bucket
FROM public.admin_user_snapshot
ORDER BY email
LIMIT 5;

-- ========================================
-- DIAGNÓSTICO FINAL
-- ========================================
SELECT
  '=== DIAGNÓSTICO FINAL ===' as resultado,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM public.admin_users WHERE email = 'mariocromia@gmail.com')
    THEN '❌ PROBLEMA: Usuário mariocromia@gmail.com NÃO está cadastrado como admin'

    WHEN NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'admin_user_snapshot')
    THEN '❌ PROBLEMA: View admin_user_snapshot NÃO existe (migration 015 não aplicada)'

    WHEN NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'admin_list_users')
    THEN '❌ PROBLEMA: Função admin_list_users NÃO existe (migration 015 não aplicada)'

    ELSE '✅ TUDO OK: Sistema admin configurado corretamente'
  END as status,

  CASE
    WHEN NOT EXISTS (SELECT 1 FROM public.admin_users WHERE email = 'mariocromia@gmail.com')
    THEN 'Execute: INSERT INTO public.admin_users (user_id, email) SELECT id, email FROM auth.users WHERE email = ''mariocromia@gmail.com'';'

    WHEN NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'admin_user_snapshot')
    THEN 'Execute o arquivo: scripts/apply-admin-system.sql'

    ELSE 'Verifique se a Edge Function está com as variáveis de ambiente configuradas (PROJECT_URL e SERVICE_ROLE_KEY)'
  END as proxima_acao;
