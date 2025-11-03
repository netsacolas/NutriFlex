-- Verificar assinaturas atualizadas após deploy

-- 1. Verificar assinatura do usuário de teste
SELECT
  u.email,
  s.plan,
  s.status,
  s.kiwify_plan_id,
  s.kiwify_order_id,
  s.current_period_end,
  s.created_at,
  s.updated_at
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'birofov720@hh7f.com';

-- 2. Ver todas as assinaturas premium ativas
SELECT
  u.email,
  s.plan,
  s.status,
  s.kiwify_plan_id
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.plan LIKE 'premium_%'
  AND s.status = 'active'
ORDER BY s.updated_at DESC;

-- 3. Contar assinaturas por plano
SELECT
  plan,
  status,
  COUNT(*) as total
FROM user_subscriptions
GROUP BY plan, status
ORDER BY plan, status;
