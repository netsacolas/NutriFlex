-- Migration 005: Add gemini_requests table for rate limiting
-- This table tracks API requests to implement rate limiting

CREATE TABLE IF NOT EXISTS public.gemini_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index para otimizar queries de rate limiting
CREATE INDEX IF NOT EXISTS idx_gemini_requests_user_created
  ON public.gemini_requests(user_id, created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE public.gemini_requests ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver suas próprias requisições
CREATE POLICY "Users can view their own gemini requests"
  ON public.gemini_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Edge Functions podem inserir requisições (autenticada pelo service_role)
-- Esta política permite que a Edge Function registre requisições
CREATE POLICY "Service role can insert gemini requests"
  ON public.gemini_requests
  FOR INSERT
  WITH CHECK (true);

-- OPCIONAL: Auto-limpeza de requisições antigas (após 24 horas)
-- Isso mantém a tabela pequena e performática
-- Execute este script manualmente ou configure um cron job no Supabase

-- CREATE OR REPLACE FUNCTION cleanup_old_gemini_requests()
-- RETURNS void
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- BEGIN
--   DELETE FROM public.gemini_requests
--   WHERE created_at < NOW() - INTERVAL '24 hours';
-- END;
-- $$;

-- Para configurar limpeza automática:
-- 1. Vá em Database > Extensions e ative 'pg_cron'
-- 2. Execute: SELECT cron.schedule('cleanup-gemini-requests', '0 */6 * * *', 'SELECT cleanup_old_gemini_requests()');
