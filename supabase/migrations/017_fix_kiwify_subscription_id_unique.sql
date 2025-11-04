-- ============================================================================
-- Migration 017: Corrigir duplicação de kiwify_subscription_id
-- ============================================================================
-- Problema: Múltiplos usuários com mesmo kiwify_subscription_id
-- Solução: Adicionar constraint UNIQUE e limpar duplicatas
-- ============================================================================

-- 1. Identificar e limpar registros duplicados
-- Mantém apenas o primeiro registro com kiwify_subscription_id não-nulo
-- e reseta os duplicados para NULL

WITH duplicates AS (
  SELECT
    id,
    kiwify_subscription_id,
    ROW_NUMBER() OVER (
      PARTITION BY kiwify_subscription_id
      ORDER BY created_at ASC
    ) as rn
  FROM public.user_subscriptions
  WHERE kiwify_subscription_id IS NOT NULL
)
UPDATE public.user_subscriptions
SET
  kiwify_subscription_id = NULL,
  plan = 'free',
  status = 'active'
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Adicionar constraint UNIQUE para kiwify_subscription_id
-- Permite múltiplos NULL (usuários sem assinatura Kiwify)
-- Mas não permite duplicação de IDs válidos

ALTER TABLE public.user_subscriptions
  DROP CONSTRAINT IF EXISTS unique_kiwify_subscription_id;

ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT unique_kiwify_subscription_id
  UNIQUE NULLS NOT DISTINCT (kiwify_subscription_id);

-- 3. Adicionar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_kiwify_sub_id
  ON public.user_subscriptions(kiwify_subscription_id)
  WHERE kiwify_subscription_id IS NOT NULL;

-- 4. Comentários explicativos
COMMENT ON CONSTRAINT unique_kiwify_subscription_id ON public.user_subscriptions IS
  'Garante que cada assinatura Kiwify está associada a apenas um usuário. NULL é permitido para usuários sem assinatura Kiwify.';

-- ============================================================================
-- Verificação pós-migration
-- ============================================================================
-- Execute este SELECT para confirmar que não há mais duplicatas:
--
-- SELECT kiwify_subscription_id, COUNT(*)
-- FROM user_subscriptions
-- WHERE kiwify_subscription_id IS NOT NULL
-- GROUP BY kiwify_subscription_id
-- HAVING COUNT(*) > 1;
--
-- Se retornar vazio, a correção foi bem-sucedida.
-- ============================================================================
