-- =====================================================
-- APLICAR TODAS AS MIGRATIONS DO NUTRIMAIS AI
-- =====================================================
-- Execute este arquivo no SQL Editor do Supabase:
-- 1. Acesse: https://supabase.com/dashboard/project/keawapzxqoyesptwpwav
-- 2. Vá em: SQL Editor → New query
-- 3. Cole este conteúdo completo
-- 4. Clique em "Run"
-- =====================================================

-- =====================================================
-- Migration 001: Create profiles table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Migration 002: Add weight history and goals
-- =====================================================
CREATE TABLE IF NOT EXISTS public.weight_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own weight history" ON public.weight_history;
CREATE POLICY "Users can view own weight history"
  ON public.weight_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own weight history" ON public.weight_history;
CREATE POLICY "Users can insert own weight history"
  ON public.weight_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own weight history" ON public.weight_history;
CREATE POLICY "Users can update own weight history"
  ON public.weight_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own weight history" ON public.weight_history;
CREATE POLICY "Users can delete own weight history"
  ON public.weight_history FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS weight_history_user_id_idx ON public.weight_history(user_id);
CREATE INDEX IF NOT EXISTS weight_history_recorded_at_idx ON public.weight_history(recorded_at DESC);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS meals_per_day INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS breakfast_calories INTEGER DEFAULT 400,
  ADD COLUMN IF NOT EXISTS lunch_calories INTEGER DEFAULT 600,
  ADD COLUMN IF NOT EXISTS dinner_calories INTEGER DEFAULT 600,
  ADD COLUMN IF NOT EXISTS snack_calories INTEGER DEFAULT 200;

-- =====================================================
-- Migration 003: Create meal consumption history
-- =====================================================
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
  portions JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.meal_consumption ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own meal consumption" ON public.meal_consumption;
CREATE POLICY "Users can view own meal consumption"
  ON public.meal_consumption FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meal consumption" ON public.meal_consumption;
CREATE POLICY "Users can insert own meal consumption"
  ON public.meal_consumption FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meal consumption" ON public.meal_consumption;
CREATE POLICY "Users can update own meal consumption"
  ON public.meal_consumption FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meal consumption" ON public.meal_consumption;
CREATE POLICY "Users can delete own meal consumption"
  ON public.meal_consumption FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS meal_consumption_user_id_idx ON public.meal_consumption(user_id);
CREATE INDEX IF NOT EXISTS meal_consumption_consumed_at_idx ON public.meal_consumption(consumed_at DESC);
CREATE INDEX IF NOT EXISTS meal_consumption_meal_type_idx ON public.meal_consumption(meal_type);
CREATE INDEX IF NOT EXISTS meal_consumption_user_date_idx ON public.meal_consumption(user_id, consumed_at DESC);

-- =====================================================
-- Migration 004: Add physical activities and meal goals
-- =====================================================
CREATE TABLE IF NOT EXISTS public.physical_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  intensity TEXT CHECK (intensity IN ('light', 'moderate', 'vigorous')),
  calories_burned DECIMAL(6,2),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.physical_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activities" ON public.physical_activities;
CREATE POLICY "Users can view own activities"
  ON public.physical_activities FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activities" ON public.physical_activities;
CREATE POLICY "Users can insert own activities"
  ON public.physical_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own activities" ON public.physical_activities;
CREATE POLICY "Users can update own activities"
  ON public.physical_activities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own activities" ON public.physical_activities;
CREATE POLICY "Users can delete own activities"
  ON public.physical_activities FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS physical_activities_user_id_idx ON public.physical_activities(user_id);
CREATE INDEX IF NOT EXISTS physical_activities_performed_at_idx ON public.physical_activities(performed_at DESC);

-- =====================================================
-- Migration 005: Add gemini_requests table (CRÍTICA!)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gemini_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gemini_requests_user_created
  ON public.gemini_requests(user_id, created_at DESC);

ALTER TABLE public.gemini_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own gemini requests" ON public.gemini_requests;
CREATE POLICY "Users can view their own gemini requests"
  ON public.gemini_requests
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert gemini requests" ON public.gemini_requests;
CREATE POLICY "Service role can insert gemini requests"
  ON public.gemini_requests
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Migration 006: Add snack_quantity
-- =====================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS snack_quantity INTEGER DEFAULT 1;

-- =====================================================
-- Migration 007: Add email to gemini_requests
-- =====================================================
ALTER TABLE public.gemini_requests
  ADD COLUMN IF NOT EXISTS user_email TEXT;

-- =====================================================
-- Migration 008: Create get_users_with_requests function
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_users_with_requests(hours_ago INTEGER DEFAULT 1)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  request_count BIGINT,
  last_request TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gr.user_id,
    gr.user_email,
    COUNT(*) as request_count,
    MAX(gr.created_at) as last_request
  FROM public.gemini_requests gr
  WHERE gr.created_at >= NOW() - (hours_ago || ' hours')::INTERVAL
  GROUP BY gr.user_id, gr.user_email
  ORDER BY request_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCESSO! Todas as migrations foram aplicadas.
-- Agora o cálculo de porções deve funcionar!
-- =====================================================
