-- Criar função RPC para buscar usuários com requisições
-- Essa função faz JOIN com auth.users para pegar os emails
CREATE OR REPLACE FUNCTION get_users_with_requests()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  full_name TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    gr.user_id,
    au.email::TEXT as user_email,
    p.full_name
  FROM gemini_requests gr
  INNER JOIN auth.users au ON au.id = gr.user_id
  LEFT JOIN profiles p ON p.id = gr.user_id
  WHERE au.email IS NOT NULL
  ORDER BY au.email;
END;
$$;

-- Permitir que usuários autenticados chamem a função
GRANT EXECUTE ON FUNCTION get_users_with_requests() TO authenticated;

-- Comentário
COMMENT ON FUNCTION get_users_with_requests() IS 'Retorna lista de usuários que fizeram requisições à API com seus emails (para admin)';
