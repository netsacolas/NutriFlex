-- ============================================
-- SCRIPT: Aplicar Sistema Administrativo
-- Descrição: Cria tabela de admins, funções e permissões
-- Executar no SQL Editor do Supabase Dashboard
-- ============================================

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the main admin user (mariocromia@gmail.com)
INSERT INTO public.admin_users (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'mariocromia@gmail.com'
ON CONFLICT (email) DO NOTHING;

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read admin_users
DROP POLICY IF EXISTS "Admins can read admin_users" ON public.admin_users;
CREATE POLICY "Admins can read admin_users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (
    email IN (SELECT email FROM public.admin_users WHERE user_id = auth.uid())
  );

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search users by email
CREATE OR REPLACE FUNCTION public.admin_search_users(search_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  current_plan TEXT,
  subscription_status TEXT,
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  kiwify_subscription_id TEXT
) AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    au.id as user_id,
    au.email,
    p.full_name,
    COALESCE(us.plan, 'free') as current_plan,
    COALESCE(us.status, 'inactive') as subscription_status,
    us.subscription_start,
    us.subscription_end,
    us.kiwify_subscription_id
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  LEFT JOIN public.user_subscriptions us ON us.user_id = au.id
  WHERE au.email ILIKE '%' || search_email || '%'
  ORDER BY au.email
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user subscription (simulates Kiwify activation)
CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  target_user_id UUID,
  new_plan TEXT,
  duration_days INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  start_date TIMESTAMPTZ := NOW();
  end_date TIMESTAMPTZ := NOW() + (duration_days || ' days')::INTERVAL;
  result JSON;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Validate plan
  IF new_plan NOT IN ('free', 'premium_monthly', 'premium_quarterly', 'premium_annual') THEN
    RAISE EXCEPTION 'Invalid plan: %', new_plan;
  END IF;

  -- Update or insert subscription
  INSERT INTO public.user_subscriptions (
    user_id,
    plan,
    status,
    subscription_start,
    subscription_end,
    kiwify_subscription_id,
    updated_at
  ) VALUES (
    target_user_id,
    new_plan,
    CASE WHEN new_plan = 'free' THEN 'inactive' ELSE 'active' END,
    start_date,
    CASE WHEN new_plan = 'free' THEN NULL ELSE end_date END,
    'admin_' || gen_random_uuid()::TEXT,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    subscription_start = EXCLUDED.subscription_start,
    subscription_end = EXCLUDED.subscription_end,
    kiwify_subscription_id = EXCLUDED.kiwify_subscription_id,
    updated_at = NOW();

  -- Log the change in payment_history
  IF new_plan != 'free' THEN
    INSERT INTO public.payment_history (
      user_id,
      kiwify_order_id,
      product_name,
      amount,
      status,
      paid_at
    ) VALUES (
      target_user_id,
      'admin_' || gen_random_uuid()::TEXT,
      'Admin Manual Activation - ' || new_plan,
      0,
      'approved',
      NOW()
    );
  END IF;

  -- Return updated subscription
  SELECT json_build_object(
    'user_id', us.user_id,
    'plan', us.plan,
    'status', us.status,
    'subscription_start', us.subscription_start,
    'subscription_end', us.subscription_end,
    'updated_at', us.updated_at
  ) INTO result
  FROM public.user_subscriptions us
  WHERE us.user_id = target_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search_users(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_subscription(UUID, TEXT, INTEGER) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- Add comments
COMMENT ON TABLE public.admin_users IS 'Stores admin users who can manage subscriptions';
COMMENT ON FUNCTION public.admin_search_users IS 'Search users by email (admin only)';
COMMENT ON FUNCTION public.admin_update_subscription IS 'Manually update user subscription (admin only)';

-- Verification query
SELECT
  'Admin system created successfully!' as message,
  (SELECT COUNT(*) FROM public.admin_users) as admin_count,
  (SELECT email FROM public.admin_users LIMIT 1) as first_admin;
