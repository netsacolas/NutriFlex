-- Criar tabela de histórico de consumo de refeições
CREATE TABLE IF NOT EXISTS public.meal_consumption (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  consumed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  total_calories DECIMAL(7,2) NOT NULL,
  total_protein DECIMAL(6,2),
  total_carbs DECIMAL(6,2),
  total_fat DECIMAL(6,2),
  total_fiber DECIMAL(6,2),
  glycemic_index DECIMAL(5,2),
  glycemic_load DECIMAL(5,2),
  portions JSONB NOT NULL, -- Array de porções consumidas
  notes TEXT, -- Observações do usuário sobre a refeição
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.meal_consumption ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para meal_consumption
CREATE POLICY "Users can view own meal consumption"
  ON public.meal_consumption FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal consumption"
  ON public.meal_consumption FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal consumption"
  ON public.meal_consumption FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal consumption"
  ON public.meal_consumption FOR DELETE
  USING (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS meal_consumption_user_id_idx ON public.meal_consumption(user_id);
CREATE INDEX IF NOT EXISTS meal_consumption_consumed_at_idx ON public.meal_consumption(consumed_at DESC);
CREATE INDEX IF NOT EXISTS meal_consumption_meal_type_idx ON public.meal_consumption(meal_type);
CREATE INDEX IF NOT EXISTS meal_consumption_user_date_idx ON public.meal_consumption(user_id, consumed_at DESC);

-- Comentários para documentação
COMMENT ON TABLE public.meal_consumption IS 'Histórico de refeições consumidas pelos usuários';
COMMENT ON COLUMN public.meal_consumption.portions IS 'Array JSON com detalhes de cada alimento consumido (nome, gramas, calorias, macros, etc)';
COMMENT ON COLUMN public.meal_consumption.consumed_at IS 'Data e hora em que a refeição foi consumida';
