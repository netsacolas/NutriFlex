-- Migration: Add snack_quantity to profiles table
-- Adiciona campo para quantidade de lanches por dia

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS snack_quantity INTEGER DEFAULT 1;

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.snack_quantity IS 'Quantidade de lanches por dia (multiplicador para snack_calories)';
