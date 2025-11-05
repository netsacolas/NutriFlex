-- ============================================================================
-- Migration 018: Corrigir função handle_new_user_complete corrompida
-- ============================================================================
-- Problema: Alguém modificou manualmente a função handle_new_user_complete
--           adicionando código que preenchia campos Kiwify (customer_email,
--           kiwify_subscription_id, kiwify_plan_id, etc) para TODOS os
--           novos cadastros, mesmo sem compra real.
--
-- Resultado: Usuários recém-cadastrados eram marcados como premium_quarterly
--            com dados Kiwify FALSOS, gerando inconsistência total.
--
-- Solução: Restaurar a função para o código ORIGINAL da migration 013
--          e limpar todos os dados falsos criados.
-- ============================================================================

-- 1. Dropar e recriar a função CORRETAMENTE
DROP FUNCTION IF EXISTS public.handle_new_user_complete() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user_complete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Insere perfil do usuário
    INSERT INTO public.profiles (id, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insere assinatura gratuita padrão APENAS com campos essenciais
    -- IMPORTANTE: NÃO preencher customer_email, kiwify_*, etc
    -- Esses campos devem vir APENAS de sincronização real via kiwify-sync
    INSERT INTO public.user_subscriptions (user_id, plan, status, current_period_start)
    VALUES (NEW.id, 'free', 'active', NOW())
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created_complete ON auth.users;

CREATE TRIGGER on_auth_user_created_complete
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_complete();

-- 3. Atualizar comentário com AVISO FORTE
COMMENT ON FUNCTION public.handle_new_user_complete() IS
'Função consolidada que cria perfil e assinatura padrão (FREE) para novos usuários.

⚠️ ATENÇÃO: Esta função foi CORROMPIDA manualmente em 2025-11-05, causando
criação de dados Kiwify FALSOS para todos os novos cadastros.

✅ REGRA: Esta função deve APENAS inserir:
  - user_id, plan=''free'', status=''active'', current_period_start=NOW()

❌ NUNCA preencher:
  - customer_email, kiwify_subscription_id, kiwify_plan_id, kiwify_order_id

Esses campos devem vir APENAS de sincronização real via kiwify-sync/kiwify-api.';

-- 4. Limpar dados falsos criados pela função corrompida
UPDATE user_subscriptions
SET
  plan = 'free',
  status = 'active',
  kiwify_subscription_id = NULL,
  kiwify_plan_id = NULL,
  customer_email = NULL,
  kiwify_order_id = NULL,
  last_event_at = NULL,
  current_period_end = NULL,
  updated_at = NOW()
WHERE
  kiwify_subscription_id IS NOT NULL
  AND user_id IN (
    SELECT u.id
    FROM auth.users u
    WHERE u.created_at >= '2025-11-01'  -- Criados desde 01/11/2025
      AND NOT EXISTS (
        -- Garantir que não tem pagamento real
        SELECT 1 FROM payment_history ph
        WHERE ph.user_id = u.id
      )
  );

-- ============================================================================
-- Verificação pós-migration
-- ============================================================================
-- Execute para confirmar que não há mais usuários com dados Kiwify falsos:
--
-- SELECT COUNT(*) FROM user_subscriptions
-- WHERE kiwify_subscription_id IS NOT NULL
--   AND kiwify_subscription_id NOT LIKE 'admin_%';
--
-- Resultado esperado: 0 (ou apenas assinaturas reais)
-- ============================================================================
