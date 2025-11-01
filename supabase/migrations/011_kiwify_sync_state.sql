-- ============================================================================
-- Migration: 011_kiwify_sync_state.sql
-- Descricao: Cria estado de sincronizacao e garante unicidade de pagamentos
-- Data: 2025-10-31
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kiwify_sync_state (
    id TEXT PRIMARY KEY DEFAULT 'singleton',
    last_synced_at TIMESTAMPTZ
);

COMMENT ON TABLE public.kiwify_sync_state IS 'Cursor da sincronizacao ativa com a Kiwify (utilizado pelo processo de polling).';

INSERT INTO public.kiwify_sync_state (id, last_synced_at)
VALUES ('singleton', NULL)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'payment_history'
          AND constraint_name = 'payment_history_kiwify_order_unique'
    ) THEN
        ALTER TABLE public.payment_history
            ADD CONSTRAINT payment_history_kiwify_order_unique UNIQUE (kiwify_order_id);
    END IF;
END
$$;

-- ============================================================================
-- Fim da Migration
-- ============================================================================
