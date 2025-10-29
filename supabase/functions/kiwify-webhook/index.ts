import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kiwify-signature',
};

type SubscriptionPlanId = 'free' | 'premium_monthly' | 'premium_quarterly' | 'premium_annual';

interface KiwifyPayload {
  event?: string;
  type?: string;
  data?: Record<string, any>;
  customer?: {
    email?: string;
    external_id?: string;
  };
  metadata?: Record<string, any>;
}

const resolvePlan = (payload: Record<string, any>): SubscriptionPlanId => {
  const monthlyId = Deno.env.get('KIWIFY_PLAN_MONTHLY_ID');
  const quarterlyId = Deno.env.get('KIWIFY_PLAN_QUARTERLY_ID');
  const annualId = Deno.env.get('KIWIFY_PLAN_ANNUAL_ID');

  const rawPlanId =
    payload?.plan_id ||
    payload?.product_id ||
    payload?.product?.id ||
    payload?.plan_code ||
    payload?.plan?.id ||
    '';

  if (rawPlanId && monthlyId && rawPlanId === monthlyId) {
    return 'premium_monthly';
  }
  if (rawPlanId && quarterlyId && rawPlanId === quarterlyId) {
    return 'premium_quarterly';
  }
  if (rawPlanId && annualId && rawPlanId === annualId) {
    return 'premium_annual';
  }

  const billingPeriod = payload?.billing_period || payload?.plan?.billing_cycle || '';
  if (typeof billingPeriod === 'string') {
    const normalized = billingPeriod.toLowerCase();
    if (normalized.includes('month')) return 'premium_monthly';
    if (normalized.includes('quarter')) return 'premium_quarterly';
    if (normalized.includes('year') || normalized.includes('annual')) return 'premium_annual';
  }

  return 'premium_monthly';
};

const resolveStatus = (eventType: string): 'active' | 'incomplete' | 'past_due' | 'cancelled' => {
  const normalized = eventType.toLowerCase();

  if (
    normalized.includes('approved') ||
    normalized.includes('activated') ||
    normalized.includes('completed') ||
    normalized.includes('paid')
  ) {
    return 'active';
  }

  if (normalized.includes('cancel') || normalized.includes('expired')) {
    return 'cancelled';
  }

  if (normalized.includes('past_due') || normalized.includes('overdue')) {
    return 'past_due';
  }

  return 'incomplete';
};

const verifySignature = async (rawBody: string, signatureHeader: string | null, secret: string) => {
  if (!signatureHeader) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const expected = Array.from(new Uint8Array(signature))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');

    const provided = signatureHeader.trim().toLowerCase();
    return provided === expected;
  } catch (error) {
    console.error('Erro ao validar assinatura do webhook', error);
    return false;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const secret = Deno.env.get('KIWIFY_WEBHOOK_SECRET');
  if (!secret) {
    console.error('Variavel KIWIFY_WEBHOOK_SECRET nao configurada');
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get('x-kiwify-signature');
  const validSignature = await verifySignature(rawBody, signatureHeader, secret);

  if (!validSignature) {
    console.warn('Assinatura do webhook invalida');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let payload: KiwifyPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error('Payload invalido recebido do webhook', error);
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !serviceKey) {
    console.error('Credenciais do Supabase nao configuradas');
    return new Response(JSON.stringify({ error: 'Supabase credentials missing' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const eventType = payload.event || payload.type || 'subscription.updated';
  const data = payload.data || {};
  const customer = payload.customer || data.customer || {};
  const metadata = payload.metadata || data.metadata || {};

  let userId: string | null =
    metadata.user_id ||
    metadata.external_id ||
    customer.external_id ||
    data.external_id ||
    null;

  if (!userId && customer.email) {
    const { data: users } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      email: customer.email,
    });
    const match = users?.users?.[0];
    userId = match?.id ?? null;
  }

  if (!userId) {
    console.warn('Nao foi possivel associar webhook a um usuario', { payload });
    return new Response(JSON.stringify({ message: 'User not found' }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const resolvedPlan = resolvePlan(data);
  const status = resolveStatus(eventType);
  const periodEnd =
    data.current_period_end ||
    data.expiration_date ||
    data.next_billing_date ||
    null;
  const periodStart = data.current_period_start || data.start_date || new Date().toISOString();

  const planToPersist: SubscriptionPlanId = status === 'active' ? resolvedPlan : 'free';

  const updates = {
    user_id: userId,
    plan: planToPersist,
    status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    kiwify_order_id: data.order_id || data.purchase_id || null,
    kiwify_subscription_id: data.subscription_id || null,
    kiwify_plan_id: data.plan_id || null,
    last_event_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from('user_subscriptions')
    .upsert(updates, { onConflict: 'user_id' });

  if (upsertError) {
    console.error('Erro ao atualizar assinatura do usuario', upsertError);
    return new Response(JSON.stringify({ error: 'Database error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('Assinatura atualizada com sucesso', { userId, status, plan: planToPersist });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
