-- ============================================
-- SCRIPT: Testar Funções Admin
-- Execute este script para verificar se as funções estão funcionando
-- ============================================

-- TESTE 1: Verificar se você é admin
DO $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Pegar seu user_id
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'mariocromia@gmail.com';

  -- Verificar se está cadastrado
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = v_user_id
  ) INTO v_is_admin;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTE 1: Verificar Admin';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Seu user_id: %', v_user_id;
  RAISE NOTICE 'É admin: %', v_is_admin;

  IF NOT v_is_admin THEN
    RAISE WARNING 'VOCÊ NÃO É ADMIN! Execute: INSERT INTO public.admin_users (user_id, email) SELECT id, email FROM auth.users WHERE email = ''mariocromia@gmail.com'';';
  END IF;
END $$;

-- TESTE 2: Testar função assert_is_admin
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'mariocromia@gmail.com';

  BEGIN
    PERFORM public.assert_is_admin(v_user_id);
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TESTE 2: assert_is_admin';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ assert_is_admin funcionou!';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ ERRO em assert_is_admin: %', SQLERRM;
  END;
END $$;

-- TESTE 3: Testar admin_get_plan_metrics
DO $$
DECLARE
  v_user_id UUID;
  v_metrics RECORD;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'mariocromia@gmail.com';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTE 3: admin_get_plan_metrics';
  RAISE NOTICE '========================================';

  BEGIN
    FOR v_metrics IN
      SELECT * FROM public.admin_get_plan_metrics(v_user_id)
    LOOP
      RAISE NOTICE 'Plano: %, Total: %', v_metrics.metric, v_metrics.total;
    END LOOP;
    RAISE NOTICE '✅ admin_get_plan_metrics funcionou!';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ ERRO em admin_get_plan_metrics: %', SQLERRM;
  END;
END $$;

-- TESTE 4: Testar admin_list_users (com parâmetros mínimos)
DO $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'mariocromia@gmail.com';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTE 4: admin_list_users';
  RAISE NOTICE '========================================';

  BEGIN
    -- Chamar com parâmetros padrão
    SELECT COUNT(*) INTO v_count
    FROM public.admin_list_users(
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
    );

    RAISE NOTICE 'Usuários retornados: %', v_count;
    RAISE NOTICE '✅ admin_list_users funcionou!';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ ERRO em admin_list_users: %', SQLERRM;
    RAISE WARNING 'Detalhes: %', SQLSTATE;
  END;
END $$;

-- TESTE 5: Ver primeiros 5 usuários da view
SELECT
  '========================================' as separador,
  'TESTE 5: Amostra da view admin_user_snapshot' as titulo;

SELECT
  email,
  plan,
  status,
  days_remaining
FROM public.admin_user_snapshot
ORDER BY email
LIMIT 5;

-- TESTE 6: Verificar se todas as funções existem
SELECT
  '========================================' as separador,
  'TESTE 6: Listar todas as funções admin' as titulo;

SELECT
  routine_name as funcao,
  routine_type as tipo,
  '✅' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'admin%'
ORDER BY routine_name;

-- RESULTADO FINAL
DO $$
DECLARE
  v_func_count INTEGER;
  v_admin_count INTEGER;
  v_view_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_func_count
  FROM information_schema.routines
  WHERE routine_schema = 'public' AND routine_name LIKE 'admin%';

  SELECT COUNT(*) INTO v_admin_count FROM public.admin_users;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'admin_user_snapshot'
  ) INTO v_view_exists;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMO FINAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Funções admin criadas: %', v_func_count;
  RAISE NOTICE 'Admins cadastrados: %', v_admin_count;
  RAISE NOTICE 'View admin_user_snapshot: %', CASE WHEN v_view_exists THEN 'Existe' ELSE 'NÃO existe' END;
  RAISE NOTICE '========================================';

  IF v_func_count < 10 THEN
    RAISE WARNING 'PROBLEMA: Esperado pelo menos 10 funções, mas só existem %', v_func_count;
  END IF;

  IF v_admin_count = 0 THEN
    RAISE WARNING 'PROBLEMA: Nenhum admin cadastrado!';
  END IF;

  IF NOT v_view_exists THEN
    RAISE WARNING 'PROBLEMA: View admin_user_snapshot não existe!';
  END IF;
END $$;
