-- Migration: 016_enforce_meal_history_limits.sql
-- Descrição: Cria função que aplica limite de histórico conforme plano do usuário

CREATE OR REPLACE FUNCTION public.meal_history_limited(
  p_days integer DEFAULT 30,
  p_start timestamptz DEFAULT NULL,
  p_end timestamptz DEFAULT NULL
)
RETURNS SETOF public.meal_consumption
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  effective_plan subscription_plan := 'free';
  effective_status subscription_status := 'inactive';
  limit_rows integer := 5;
  range_start timestamptz;
  range_end timestamptz;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT plan, status
  INTO effective_plan, effective_status
  FROM public.user_subscriptions
  WHERE user_id = current_user_id
  LIMIT 1;

  IF effective_status = 'active' AND effective_plan <> 'free' THEN
    limit_rows := NULL;
  END IF;

  IF p_days IS NULL OR p_days <= 0 THEN
    p_days := 30;
  END IF;

  range_start := COALESCE(p_start, now() - (p_days || ' days')::interval);
  range_end := COALESCE(p_end, now());

  IF range_end < range_start THEN
    range_end := range_start;
  END IF;

  IF limit_rows IS NULL THEN
    RETURN QUERY
      SELECT *
      FROM public.meal_consumption mc
      WHERE mc.user_id = current_user_id
        AND mc.consumed_at >= range_start
        AND mc.consumed_at <= range_end
      ORDER BY mc.consumed_at DESC;
  ELSE
    RETURN QUERY
      SELECT *
      FROM public.meal_consumption mc
      WHERE mc.user_id = current_user_id
        AND mc.consumed_at >= range_start
        AND mc.consumed_at <= range_end
      ORDER BY mc.consumed_at DESC
      LIMIT limit_rows;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.meal_history_limited(integer, timestamptz, timestamptz) IS
'Retorna o histórico de refeições do usuário autenticado aplicando limites baseados na assinatura';

GRANT EXECUTE ON FUNCTION public.meal_history_limited(integer, timestamptz, timestamptz) TO authenticated;
