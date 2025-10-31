-- ============================================================================
-- Migration: 010_add_payment_history.sql
-- Descricao: Adiciona tabela de historico de pagamentos e campos de expiracao
-- Data: 2025-01-30
-- ============================================================================

-- Criar tabela de historico de pagamentos
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
    plan subscription_plan NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BRL',
    payment_method TEXT,
    kiwify_order_id TEXT,
    kiwify_transaction_id TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payment_history IS 'Historico de todos os pagamentos realizados pelos usuarios';

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON public.payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_kiwify_order ON public.payment_history(kiwify_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_paid_at ON public.payment_history(paid_at DESC);

-- RLS Policies
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment history" ON public.payment_history;
CREATE POLICY "Users can view own payment history"
    ON public.payment_history FOR SELECT
    USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_payment_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_history_updated_at ON public.payment_history;
CREATE TRIGGER trg_payment_history_updated_at
    BEFORE UPDATE ON public.payment_history
    FOR EACH ROW
    EXECUTE FUNCTION public.set_payment_history_updated_at();

-- Funcao para calcular dias restantes de assinatura
CREATE OR REPLACE FUNCTION public.get_subscription_days_remaining(sub_record public.user_subscriptions)
RETURNS INTEGER AS $$
BEGIN
    IF sub_record.current_period_end IS NULL OR sub_record.status != 'active' THEN
        RETURN NULL;
    END IF;

    RETURN GREATEST(0, EXTRACT(DAY FROM (sub_record.current_period_end - NOW()::DATE))::INTEGER);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.get_subscription_days_remaining IS 'Calcula quantos dias faltam para o vencimento da assinatura';

-- Funcao para verificar se assinatura expira em breve (3 dias)
CREATE OR REPLACE FUNCTION public.is_subscription_expiring_soon(sub_record public.user_subscriptions)
RETURNS BOOLEAN AS $$
DECLARE
    days_remaining INTEGER;
BEGIN
    days_remaining := public.get_subscription_days_remaining(sub_record);

    IF days_remaining IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN days_remaining <= 3 AND days_remaining > 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.is_subscription_expiring_soon IS 'Retorna true se a assinatura expira em 3 dias ou menos';

-- View para facilitar consultas de assinaturas com informacoes calculadas
CREATE OR REPLACE VIEW public.subscriptions_with_status AS
SELECT
    s.*,
    public.get_subscription_days_remaining(s) AS days_remaining,
    public.is_subscription_expiring_soon(s) AS is_expiring_soon,
    CASE
        WHEN s.status = 'active' AND s.current_period_end IS NOT NULL AND s.current_period_end < NOW()
        THEN TRUE
        ELSE FALSE
    END AS is_expired
FROM public.user_subscriptions s;

COMMENT ON VIEW public.subscriptions_with_status IS 'View que inclui status calculados de assinaturas (dias restantes, expiracao proxima, expirado)';

-- Grant acesso a view
GRANT SELECT ON public.subscriptions_with_status TO authenticated;

-- ============================================================================
-- Fim da Migration
-- ============================================================================
