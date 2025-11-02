-- ============================================
-- TESTE DIRETO: admin_list_users
-- Este script testa a função exatamente como a Edge Function chama
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_result RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Pegar user_id do admin
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'mariocromia@gmail.com';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTE: admin_list_users com parâmetros exatos da Edge Function';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE '';

  -- Testar exatamente como a Edge Function chama
  BEGIN
    RAISE NOTICE 'Chamando admin_list_users...';

    FOR v_result IN
      SELECT *
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
      )
    LOOP
      v_count := v_count + 1;

      -- Mostrar primeiro registro completo
      IF v_count = 1 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'Primeiro registro retornado:';
        RAISE NOTICE '  user_id: %', v_result.user_id;
        RAISE NOTICE '  email: %', v_result.email;
        RAISE NOTICE '  full_name: %', v_result.full_name;
        RAISE NOTICE '  plan: %', v_result.plan;
        RAISE NOTICE '  plan_label: %', v_result.plan_label;
        RAISE NOTICE '  status: %', v_result.status;
        RAISE NOTICE '  status_label: %', v_result.status_label;
        RAISE NOTICE '  days_remaining: %', v_result.days_remaining;
        RAISE NOTICE '  total_count: %', v_result.total_count;
      END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '✅ SUCESSO!';
    RAISE NOTICE 'Total de registros retornados: %', v_count;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '';
    RAISE WARNING '❌ ERRO ao chamar admin_list_users:';
    RAISE WARNING 'Mensagem: %', SQLERRM;
    RAISE WARNING 'Código: %', SQLSTATE;
    RAISE WARNING 'Contexto: %', SQLSTATE;
  END;

  RAISE NOTICE '========================================';
END $$;

-- Testar também consulta direta na view
SELECT
  '========================================' as separador,
  'TESTE: Consulta direta na view' as titulo;

SELECT
  user_id,
  email,
  full_name,
  plan,
  plan_label,
  status,
  status_label,
  days_remaining
FROM public.admin_user_snapshot
LIMIT 3;
