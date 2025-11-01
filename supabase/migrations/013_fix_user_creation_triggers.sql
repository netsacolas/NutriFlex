-- ============================================================================
-- Migration: 013_fix_user_creation_triggers.sql
-- Descrição: Consolida triggers de criação de usuário para evitar conflitos
-- Data: 2025-11-01
-- ============================================================================

-- Remove os triggers antigos que podem estar causando conflito
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_auth_user_create_subscription ON auth.users;

-- Remove as funções antigas
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_default_subscription();

-- Cria nova função consolidada que cria perfil E assinatura
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

    -- Insere assinatura gratuita padrão
    INSERT INTO public.user_subscriptions (user_id, plan, status, current_period_start)
    VALUES (NEW.id, 'free', 'active', NOW())
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria trigger único consolidado
CREATE TRIGGER on_auth_user_created_complete
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_complete();

-- ============================================================================
-- Comentários e documentação
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user_complete() IS
'Função consolidada que cria perfil e assinatura padrão para novos usuários.
Resolve conflito entre triggers handle_new_user e create_default_subscription.';

-- ============================================================================
-- Fim da Migration
-- ============================================================================
