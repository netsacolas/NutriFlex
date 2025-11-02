-- Teste super simples para identificar o problema

-- 1. Verificar se você é admin
SELECT
  '1. Verificar Admin' as teste,
  CASE
    WHEN EXISTS (SELECT 1 FROM public.admin_users WHERE email = 'mariocromia@gmail.com')
    THEN 'SIM'
    ELSE 'NÃO'
  END as resultado;

-- 2. Pegar seu user_id
SELECT
  '2. Seu User ID' as teste,
  id as user_id,
  email
FROM auth.users
WHERE email = 'mariocromia@gmail.com';

-- 3. Testar admin_list_users com seu user_id
-- IMPORTANTE: Copie o user_id do resultado acima e cole aqui
DO $$
DECLARE
  v_user_id UUID := '3b6c55f5-1e6b-4ac8-a755-90b0d7b75f40'; -- COLE SEU USER_ID AQUI!
  v_result RECORD;
BEGIN
  RAISE NOTICE '=== TESTANDO admin_list_users ===';

  FOR v_result IN
    SELECT * FROM public.admin_list_users(
      p_admin_user := v_user_id,
      p_search := NULL,
      p_plans := NULL,
      p_status := NULL,
      p_due_in_days := NULL,
      p_start_from := NULL,
      p_start_to := NULL,
      p_end_from := NULL,
      p_end_to := NULL,
      p_sort_field := 'name',
      p_sort_direction := 'asc',
      p_page := 1,
      p_page_size := 25
    )
    LIMIT 1
  LOOP
    RAISE NOTICE 'Email: %', v_result.email;
    RAISE NOTICE 'Plan: %', v_result.plan;
    RAISE NOTICE 'Status: %', v_result.status;
    RAISE NOTICE 'SUCCESS!';
    EXIT;
  END LOOP;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'ERRO: %', SQLERRM;
  RAISE WARNING 'CODIGO: %', SQLSTATE;
END $$;
