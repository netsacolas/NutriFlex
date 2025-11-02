-- ============================================
-- FIX: Corrigir tipo VARCHAR para TEXT
-- Problema: admin_list_users retorna VARCHAR(255) mas espera TEXT
-- ============================================

DROP FUNCTION IF EXISTS public.admin_list_users CASCADE;

CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_admin_user UUID,
  p_search TEXT DEFAULT NULL,
  p_plans TEXT[] DEFAULT NULL,
  p_status TEXT[] DEFAULT NULL,
  p_due_in_days INTEGER DEFAULT NULL,
  p_start_from TIMESTAMPTZ DEFAULT NULL,
  p_start_to TIMESTAMPTZ DEFAULT NULL,
  p_end_from TIMESTAMPTZ DEFAULT NULL,
  p_end_to TIMESTAMPTZ DEFAULT NULL,
  p_sort_field TEXT DEFAULT 'name',
  p_sort_direction TEXT DEFAULT 'asc',
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 25
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,                    -- IMPORTANTE: TEXT não VARCHAR!
  full_name TEXT,
  plan TEXT,
  plan_label TEXT,
  status TEXT,
  status_label TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  days_remaining INTEGER,
  last_payment_status TEXT,
  last_payment_at TIMESTAMPTZ,
  last_payment_amount NUMERIC,
  updated_at TIMESTAMPTZ,
  user_created_at TIMESTAMPTZ,
  risk_bucket TEXT,
  total_count BIGINT
) AS $$
DECLARE
  v_sql TEXT;
  v_order TEXT;
  v_direction TEXT := CASE WHEN LOWER(p_sort_direction) = 'desc' THEN 'DESC' ELSE 'ASC' END;
  v_limit INTEGER := LEAST(GREATEST(p_page_size, 5), 100);
  v_offset INTEGER := GREATEST(p_page - 1, 0) * LEAST(GREATEST(p_page_size, 5), 100);
BEGIN
  PERFORM public.assert_is_admin(p_admin_user);

  -- CAST explícito para TEXT em todas as colunas de texto
  v_sql := 'SELECT
    user_id::UUID,
    email::TEXT,
    full_name::TEXT,
    plan::TEXT,
    plan_label::TEXT,
    status::TEXT,
    status_label::TEXT,
    current_period_start,
    current_period_end,
    days_remaining,
    last_payment_status::TEXT,
    last_payment_at,
    last_payment_amount,
    updated_at,
    user_created_at,
    risk_bucket::TEXT,
    COUNT(*) OVER() AS total_count
  FROM public.admin_user_snapshot WHERE TRUE';

  IF p_search IS NOT NULL AND LENGTH(TRIM(p_search)) > 0 THEN
    v_sql := v_sql || format(
      ' AND (LOWER(email::TEXT) LIKE %L OR LOWER(COALESCE(full_name::TEXT, '''')) LIKE %L)',
      '%' || LOWER(TRIM(p_search)) || '%',
      '%' || LOWER(TRIM(p_search)) || '%'
    );
  END IF;

  IF p_plans IS NOT NULL AND CARDINALITY(p_plans) > 0 THEN
    v_sql := v_sql || format(' AND plan::TEXT = ANY(%L::text[])', p_plans);
  END IF;

  IF p_status IS NOT NULL AND CARDINALITY(p_status) > 0 THEN
    v_sql := v_sql || format(' AND status::TEXT = ANY(%L::text[])', p_status);
  END IF;

  IF p_due_in_days IS NOT NULL AND p_due_in_days > 0 THEN
    v_sql := v_sql || format(
      ' AND current_period_end IS NOT NULL AND current_period_end > NOW() AND current_period_end <= NOW() + INTERVAL ''%s days''',
      p_due_in_days
    );
  END IF;

  IF p_start_from IS NOT NULL THEN
    v_sql := v_sql || format(' AND current_period_start >= %L', p_start_from);
  END IF;

  IF p_start_to IS NOT NULL THEN
    v_sql := v_sql || format(' AND current_period_start <= %L', p_start_to);
  END IF;

  IF p_end_from IS NOT NULL THEN
    v_sql := v_sql || format(' AND current_period_end >= %L', p_end_from);
  END IF;

  IF p_end_to IS NOT NULL THEN
    v_sql := v_sql || format(' AND current_period_end <= %L', p_end_to);
  END IF;

  CASE LOWER(p_sort_field)
    WHEN 'email' THEN v_order := ' ORDER BY LOWER(email::TEXT)';
    WHEN 'expiration' THEN v_order := ' ORDER BY current_period_end';
    WHEN 'days_remaining' THEN v_order := ' ORDER BY days_remaining';
    WHEN 'status' THEN v_order := ' ORDER BY status::TEXT';
    WHEN 'plan' THEN v_order := ' ORDER BY plan::TEXT';
    WHEN 'updated_at' THEN v_order := ' ORDER BY updated_at';
    ELSE v_order := ' ORDER BY LOWER(COALESCE(full_name::TEXT, email::TEXT))';
  END CASE;

  v_sql := v_sql || v_order || ' ' || v_direction || ' NULLS LAST';
  v_sql := v_sql || format(' LIMIT %s OFFSET %s', v_limit, v_offset);

  RETURN QUERY EXECUTE v_sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_list_users(UUID, TEXT, TEXT[], TEXT[], INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

-- Verificar se funcionou
DO $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'mariocromia@gmail.com';

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

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORREÇÃO APLICADA COM SUCESSO!';
  RAISE NOTICE 'Usuários retornados: %', v_count;
  RAISE NOTICE '========================================';
END $$;
