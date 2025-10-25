-- Migration: Add physical activities and meal calorie goals

-- Add meal calorie goals to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS meals_per_day INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS breakfast_calories INTEGER DEFAULT 400,
ADD COLUMN IF NOT EXISTS lunch_calories INTEGER DEFAULT 600,
ADD COLUMN IF NOT EXISTS dinner_calories INTEGER DEFAULT 600,
ADD COLUMN IF NOT EXISTS snack_calories INTEGER DEFAULT 200;

-- Create physical_activities table
CREATE TABLE IF NOT EXISTS public.physical_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  intensity TEXT CHECK (intensity IN ('low', 'moderate', 'high')),
  calories_burned INTEGER,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_physical_activities_user_id ON public.physical_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_physical_activities_performed_at ON public.physical_activities(performed_at DESC);

-- Enable RLS
ALTER TABLE public.physical_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for physical_activities
CREATE POLICY "Users can view their own activities"
  ON public.physical_activities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON public.physical_activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON public.physical_activities
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON public.physical_activities
  FOR DELETE
  USING (auth.uid() = user_id);
