-- ============================================================================
-- Migration: 010_add_plan_snapshot_to_gemini_requests.sql
-- Descricao: Adiciona coluna para registrar o plano vigente em cada requisicao
-- ============================================================================

ALTER TABLE public.gemini_requests
  ADD COLUMN IF NOT EXISTS plan_snapshot subscription_plan DEFAULT 'free';

COMMENT ON COLUMN public.gemini_requests.plan_snapshot IS 'Plano do usuario no momento da requisicao Gemini';

UPDATE public.gemini_requests
SET plan_snapshot = COALESCE(plan_snapshot, 'free');

-- ============================================================================
-- Fim da Migration
-- ============================================================================
