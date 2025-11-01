-- ============================================================================
-- Migration: 012_fix_subscription_policy.sql
-- Descricao: Ajusta policy de INSERT em user_subscriptions para permitir
--            execucao via triggers/rotinas com service role.
-- Data: 2025-11-03
-- ============================================================================

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create default subscription" ON public.user_subscriptions;

CREATE POLICY "Users can create default subscription"
    ON public.user_subscriptions FOR INSERT
    WITH CHECK (
        (
            auth.uid() = user_id
            AND plan = 'free'
            AND status = 'active'
        )
        OR (
            auth.role() IN ('service_role', 'supabase_admin')
            AND plan = 'free'
            AND status = 'active'
        )
    );

-- ============================================================================
-- Fim da Migration
-- ============================================================================
