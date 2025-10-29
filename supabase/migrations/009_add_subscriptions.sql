-- ============================================================================
-- Migration: 009_add_subscriptions.sql
-- Descricao: Cria tabela de assinaturas integradas a Kiwify
-- Data: 2025-10-29
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        CREATE TYPE subscription_plan AS ENUM (
            'free',
            'premium_monthly',
            'premium_quarterly',
            'premium_annual'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM (
            'active',
            'incomplete',
            'past_due',
            'cancelled'
        );
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan subscription_plan NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    kiwify_order_id TEXT,
    kiwify_subscription_id TEXT,
    kiwify_plan_id TEXT,
    last_event_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

COMMENT ON TABLE public.user_subscriptions IS 'Estado de assinatura dos usuarios do NutriMais AI';

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription"
    ON public.user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create default subscription" ON public.user_subscriptions;
CREATE POLICY "Users can create default subscription"
    ON public.user_subscriptions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND plan = 'free'
        AND status = 'active'
    );

CREATE OR REPLACE FUNCTION public.set_user_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_subscription_updated_at ON public.user_subscriptions;
CREATE TRIGGER trg_user_subscription_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_user_subscription_updated_at();

CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_subscriptions (user_id, plan, status, current_period_start)
    VALUES (NEW.id, 'free', 'active', NOW())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

DROP TRIGGER IF EXISTS trg_auth_user_create_subscription ON auth.users;
CREATE TRIGGER trg_auth_user_create_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_subscription();

-- ============================================================================
-- Fim da Migration
-- ============================================================================
