-- ============================================================================
-- Migration 015: Admin Panel Enhancements
-- Cria estruturas para auditoria, segmentos salvos e listagem avançada
-- ============================================================================

-- 1. Tabela de auditoria de ações administrativas
CREATE TABLE IF NOT EXISTS public.admin_subscription_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin_subscription_audit IS 'Histórico de alterações administrativas em assinaturas e acesso';
COMMENT ON COLUMN public.admin_subscription_audit.action_type IS 'Tipo da ação executada (ex: change_plan, adjust_days, bulk_change, block_user)';
COMMENT ON COLUMN public.admin_subscription_audit.before_state IS 'Estado anterior relevante (JSON)';
COMMENT ON COLUMN public.admin_subscription_audit.after_state IS 'Estado posterior relevante (JSON)';

CREATE INDEX IF NOT EXISTS idx_admin_audit_target_user ON public.admin_subscription_audit(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON public.admin_subscription_audit(created_at DESC);

-- 2. Tabela de segmentos salvos
CREATE TABLE IF NOT EXISTS public.admin_saved_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin_saved_segments IS 'Segmentos de filtros salvos pelos administradores do painel';
ALTER TABLE public.admin_saved_segments
  ADD CONSTRAINT admin_saved_segments_unique_name UNIQUE (admin_user_id, name);

CREATE INDEX IF NOT EXISTS idx_admin_segments_admin_user ON public.admin_saved_segments(admin_user_id);

-- 3. View consolidada para listagem de usuários
CREATE OR REPLACE VIEW public.admin_user_snapshot AS
SELECT
  u.id AS user_id,
  u.email,
  u.created_at AS user_created_at,
  p.full_name,
  p.phone,
  COALESCE(us.plan::TEXT, 'free') AS plan,
  COALESCE(us.status::TEXT, 'active') AS status,
  us.current_period_start,
  us.current_period_end,
  us.updated_at,
  GREATEST(
    0,
    FLOOR(
      EXTRACT(EPOCH FROM (COALESCE(us.current_period_end, NOW()) - NOW())) / 86400
    )::INT
  ) AS days_remaining,
  CASE
    WHEN COALESCE(us.current_period_end, NOW()) < NOW() THEN 'expired'
    WHEN us.current_period_end IS NULL THEN 'no_expiration'
    WHEN us.current_period_end <= NOW() + INTERVAL '3 days' THEN 'due_3'
    WHEN us.current_period_end <= NOW() + INTERVAL '7 days' THEN 'due_7'
    WHEN us.current_period_end <= NOW() + INTERVAL '15 days' THEN 'due_15'
    ELSE 'ok'
  END AS risk_bucket,
  payment.payment_status AS last_payment_status,
  payment.paid_at AS last_payment_at,
  CASE
    WHEN payment.amount_cents IS NULL THEN NULL
    ELSE payment.amount_cents::NUMERIC / 100
  END AS last_payment_amount,
  CASE COALESCE(us.plan::TEXT, 'free')
    WHEN 'free' THEN 'Gratuito'
    WHEN 'premium_monthly' THEN 'Premium Mensal'
    WHEN 'premium_quarterly' THEN 'Premium Trimestral'
    WHEN 'premium_annual' THEN 'Premium Anual'
    ELSE COALESCE(us.plan::TEXT, 'Gratuito')
  END AS plan_label,
  CASE
    WHEN COALESCE(us.plan::TEXT, 'free') = 'free' THEN 'Plano Gratuito'
    WHEN us.current_period_end IS NULL THEN 'Sem expiração definida'
    WHEN us.current_period_end < NOW() THEN 'Expirado'
    WHEN us.current_period_end <= NOW() + INTERVAL '7 days' THEN 'Vencendo em breve'
    ELSE 'Ativo'
  END AS status_label
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_subscriptions us ON us.user_id = u.id
LEFT JOIN LATERAL (
  SELECT
    ph.payment_status,
    ph.paid_at,
    ph.amount_cents
  FROM public.payment_history ph
  WHERE ph.user_id = u.id
  ORDER BY ph.paid_at DESC NULLS LAST
  LIMIT 1
) payment ON TRUE;

COMMENT ON VIEW public.admin_user_snapshot IS 'Snapshot consolidado para uso no painel administrativo';

-- 4. Função utilitária para validar acesso administrativo
CREATE OR REPLACE FUNCTION public.assert_is_admin(p_admin_user UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = p_admin_user
  ) THEN
    RAISE EXCEPTION 'Acesso restrito a administradores';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.assert_is_admin(UUID) TO authenticated;

-- 5. Função de listagem com filtros
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
  email TEXT,
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

  v_sql := 'SELECT *, COUNT(*) OVER() AS total_count FROM public.admin_user_snapshot WHERE TRUE';

  IF p_search IS NOT NULL AND LENGTH(TRIM(p_search)) > 0 THEN
    v_sql := v_sql || format(
      ' AND (LOWER(email) LIKE %L OR LOWER(COALESCE(full_name, '''')) LIKE %L)',
      '%' || LOWER(TRIM(p_search)) || '%',
      '%' || LOWER(TRIM(p_search)) || '%'
    );
  END IF;

  IF p_plans IS NOT NULL AND CARDINALITY(p_plans) > 0 THEN
    v_sql := v_sql || format(' AND plan = ANY(%L::text[])', p_plans);
  END IF;

  IF p_status IS NOT NULL AND CARDINALITY(p_status) > 0 THEN
    v_sql := v_sql || format(' AND status = ANY(%L::text[])', p_status);
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
    WHEN 'email' THEN v_order := ' ORDER BY LOWER(email)';
    WHEN 'expiration' THEN v_order := ' ORDER BY current_period_end';
    WHEN 'days_remaining' THEN v_order := ' ORDER BY days_remaining';
    WHEN 'status' THEN v_order := ' ORDER BY status';
    WHEN 'plan' THEN v_order := ' ORDER BY plan';
    WHEN 'updated_at' THEN v_order := ' ORDER BY updated_at';
    ELSE v_order := ' ORDER BY LOWER(COALESCE(full_name, email))';
  END CASE;

  v_sql := v_sql || v_order || ' ' || v_direction || ' NULLS LAST';
  v_sql := v_sql || format(' LIMIT %s OFFSET %s', v_limit, v_offset);

  RETURN QUERY EXECUTE v_sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_list_users(
  UUID, TEXT, TEXT[], TEXT[], INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ,
  TEXT, TEXT, INTEGER, INTEGER
) TO authenticated;

-- 6. Métricas agregadas
CREATE OR REPLACE FUNCTION public.admin_get_plan_metrics(p_admin_user UUID)
RETURNS TABLE (metric TEXT, total BIGINT) AS $$
BEGIN
  PERFORM public.assert_is_admin(p_admin_user);

  RETURN QUERY
  SELECT plan, COUNT(*)::BIGINT
  FROM public.admin_user_snapshot
  GROUP BY plan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_get_plan_metrics(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_risk_metrics(p_admin_user UUID)
RETURNS TABLE (risk_bucket TEXT, total BIGINT) AS $$
BEGIN
  PERFORM public.assert_is_admin(p_admin_user);

  RETURN QUERY
  SELECT risk_bucket, COUNT(*)::BIGINT
  FROM public.admin_user_snapshot
  GROUP BY risk_bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_get_risk_metrics(UUID) TO authenticated;

-- 7. Histórico de usuário
CREATE OR REPLACE FUNCTION public.admin_get_user_history(
  p_admin_user UUID,
  p_target_user UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  action_type TEXT,
  before_state JSONB,
  after_state JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ,
  admin_email TEXT
) AS $$
BEGIN
  PERFORM public.assert_is_admin(p_admin_user);

  RETURN QUERY
  SELECT
    asa.id,
    asa.action_type,
    asa.before_state,
    asa.after_state,
    asa.notes,
    asa.created_at,
    asa.admin_email
  FROM public.admin_subscription_audit asa
  WHERE asa.target_user_id = p_target_user
  ORDER BY asa.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 200);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_get_user_history(UUID, UUID, INTEGER) TO authenticated;

-- 8. Gerenciamento de segmentos
CREATE OR REPLACE FUNCTION public.admin_list_segments(p_admin_user UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  filters JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  PERFORM public.assert_is_admin(p_admin_user);

  RETURN QUERY
  SELECT id, name, description, filters, created_at
  FROM public.admin_saved_segments
  WHERE admin_user_id = p_admin_user
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_list_segments(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_save_segment(
  p_admin_user UUID,
  p_name TEXT,
  p_description TEXT,
  p_filters JSONB
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  filters JSONB,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_row public.admin_saved_segments%ROWTYPE;
BEGIN
  PERFORM public.assert_is_admin(p_admin_user);

  INSERT INTO public.admin_saved_segments (admin_user_id, name, description, filters)
  VALUES (p_admin_user, p_name, p_description, p_filters)
  ON CONFLICT (admin_user_id, name) DO UPDATE
    SET description = EXCLUDED.description,
        filters = EXCLUDED.filters,
        created_at = NOW()
  RETURNING * INTO v_row;

  RETURN QUERY SELECT v_row.id, v_row.name, v_row.description, v_row.filters, v_row.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_save_segment(UUID, TEXT, TEXT, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_segment(
  p_admin_user UUID,
  p_segment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  PERFORM public.assert_is_admin(p_admin_user);

  DELETE FROM public.admin_saved_segments
  WHERE admin_user_id = p_admin_user
    AND id = p_segment_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_delete_segment(UUID, UUID) TO authenticated;

-- 9. Registro de auditoria
CREATE OR REPLACE FUNCTION public.admin_record_subscription_audit(
  p_admin_user UUID,
  p_admin_email TEXT,
  p_target_user UUID,
  p_action_type TEXT,
  p_before JSONB,
  p_after JSONB,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  PERFORM public.assert_is_admin(p_admin_user);

  INSERT INTO public.admin_subscription_audit (
    admin_user_id,
    admin_email,
    target_user_id,
    action_type,
    before_state,
    after_state,
    notes
  )
  VALUES (
    p_admin_user,
    p_admin_email,
    p_target_user,
    p_action_type,
    p_before,
    p_after,
    p_notes
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_record_subscription_audit(UUID, TEXT, UUID, TEXT, JSONB, JSONB, TEXT) TO authenticated;

-- ============================================================================
-- Fim da Migration 015
-- ============================================================================
