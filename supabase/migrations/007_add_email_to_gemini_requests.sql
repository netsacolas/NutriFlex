-- Adicionar coluna de email na tabela gemini_requests para facilitar queries de admin
ALTER TABLE public.gemini_requests
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Criar índice para buscas rápidas por email
CREATE INDEX IF NOT EXISTS idx_gemini_requests_user_email ON public.gemini_requests(user_email);

-- Comentário
COMMENT ON COLUMN public.gemini_requests.user_email IS 'Email do usuário para facilitar queries de admin (desnormalizado)';
