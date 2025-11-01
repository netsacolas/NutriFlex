import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

type SubscriptionPlanId = 'free' | 'premium_monthly' | 'premium_quarterly' | 'premium_annual';
type SubscriptionStatus = 'active' | 'incomplete' | 'past_due' | 'cancelled';

interface KiwifyPayload {
  signature?: string;
  event?: string;
  type?: string;
  data?: Record<string, unknown>;
  customer?: {
    email?: string;
    external_id?: string;
  };
  metadata?: Record<string, unknown>;
}

interface LogContext {
  event_correlation_id: string;
  event_type: string;
  order_id: string | null;
  subscription_id: string | null;
  customer_email: string | null;
  user_id: string | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kiwify-signature',
};

const encoder = new TextEncoder();

const toHex = (buffer: ArrayBufferLike): string =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

async function computeHmac(payload: string, secret: string, algorithm: 'SHA-1' | 'SHA-256'): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {
      name: 'HMAC',
      hash: { name: algorithm },
    },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toHex(signature);
}

function structuredCloneFallback<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function canonicalizePayload(rawBody: string): {
  parsed: KiwifyPayload;
  canonical: string;
  signatureFromBody: string | null;
} {
  const parsed = JSON.parse(rawBody) as KiwifyPayload;
  const signatureFromBody =
    typeof parsed.signature === 'string' && parsed.signature.trim().length > 0
      ? parsed.signature.trim()
      : null;

  const canonicalSource = structuredCloneFallback(parsed);
  if (canonicalSource && typeof canonicalSource === 'object' && 'signature' in canonicalSource) {
    delete (canonicalSource as Record<string, unknown>).signature;
  }

  const canonical = JSON.stringify(canonicalSource ?? {});

  return { parsed, canonical, signatureFromBody };
}

async function generateCorrelationId(orderId: string | null, subscriptionId: string | null): Promise<string> {
  const seed = [orderId, subscriptionId, Date.now().toString(36)]
    .filter(Boolean)
    .join('|') || crypto.randomUUID();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(seed));
  return toHex(digest).slice(0, 12);
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

function log(level: LogLevel, message: string, context: Record<string, unknown>): void {
  const payload = {
    level,
    message,
    ...context,
  };

  const serialized = JSON.stringify(payload);

  if (level === 'ERROR') {
    console.error(serialized);
  } else if (level === 'WARN') {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}

const resolvePlan = (data: Record<string, unknown>): SubscriptionPlanId => {
  const monthlyId = Deno.env.get('KIWIFY_PLAN_MONTHLY_ID');
  const quarterlyId = Deno.env.get('KIWIFY_PLAN_QUARTERLY_ID');
  const annualId = Deno.env.get('KIWIFY_PLAN_ANNUAL_ID');

  const rawPlanId =
    (data?.plan_id as string | undefined) ||
    (data?.product_id as string | undefined) ||
    (data?.plan_code as string | undefined) ||
    (data?.plan instanceof Object && 'id' in data.plan ? (data.plan as Record<string, unknown>).id as string : undefined) ||
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

  const frequency =
    (data?.frequency as string | undefined) ||
    (data?.billing_period as string | undefined) ||
    (data?.plan instanceof Object && 'billing_cycle' in data.plan
      ? (data.plan as Record<string, unknown>).billing_cycle as string
      : undefined) ||
    (data?.plan instanceof Object && 'frequency' in data.plan
      ? (data.plan as Record<string, unknown>).frequency as string
      : undefined) ||
    '';

  if (frequency) {
    const normalized = frequency.toLowerCase();
    if (normalized.includes('month')) return 'premium_monthly';
    if (normalized.includes('quarter')) return 'premium_quarterly';
    if (normalized.includes('year')) return 'premium_annual';
  }

  return 'premium_monthly';
};

const resolveStatus = (eventType: string, rawStatus: string | undefined | null): SubscriptionStatus => {
  const combined = `${eventType || ''} ${rawStatus || ''}`.toLowerCase();

  if (
    combined.includes('approved') ||
    combined.includes('paid') ||
    combined.includes('completed') ||
    combined.includes('active')
  ) {
    return 'active';
  }

  if (combined.includes('cancel')) {
    return 'cancelled';
  }

  if (combined.includes('past_due') || combined.includes('overdue')) {
    return 'past_due';
  }

  return 'incomplete';
};

const getFirstNonEmpty = (...values: (string | undefined | null)[]): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

const resolveTimestamps = (data: Record<string, unknown>) => {
  const nowIso = new Date().toISOString();
  const start = getFirstNonEmpty(
    data.current_period_start as string | undefined,
    data.start_date as string | undefined,
    data.approved_at as string | undefined,
    data.approved_date as string | undefined,
    data.created_at as string | undefined,
  ) ?? nowIso;

  const end = getFirstNonEmpty(
    data.next_payment as string | undefined,
    data.current_period_end as string | undefined,
    data.expiration_date as string | undefined,
  );

  return {
    current_period_start: start,
    current_period_end: end,
  };
};

const resolveAmountCents = (data: Record<string, unknown>): number => {
  const candidates = [
    data.amount_cents,
    data.total_cents,
    data.value_cents,
    data.charge_amount_cents,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return Math.round(candidate);
    }
  }

  const decimalCandidates = [
    data.amount,
    data.total,
    data.total_amount,
    data.charge_amount,
  ];

  for (const candidate of decimalCandidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return Math.round(candidate * 100);
    }
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      const parsed = Number(candidate.replace(',', '.'));
      if (!Number.isNaN(parsed)) {
        return Math.round(parsed * 100);
      }
    }
  }

  return 0;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const secret = Deno.env.get('KIWIFY_WEBHOOK_SECRET');
  if (!secret) {
    log('ERROR', 'secret_missing', { reason: 'KIWIFY_WEBHOOK_SECRET undefined' });
    return new Response(
      JSON.stringify({ error: 'Webhook secret not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const rawBody = await req.text();

  let parsedPayload: KiwifyPayload;
  let canonicalPayload = '';
  let signatureFromBody: string | null = null;

  try {
    const canonical = canonicalizePayload(rawBody);
    parsedPayload = canonical.parsed;
    canonicalPayload = canonical.canonical;
    signatureFromBody = canonical.signatureFromBody;
  } catch (error) {
    log('ERROR', 'payload_parse_error', { error: (error as Error).message });
    return new Response(
      JSON.stringify({ error: 'Invalid payload' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const data = (parsedPayload.data ?? {}) as Record<string, unknown>;
  const customer =
    parsedPayload.customer ??
    (data.customer as { email?: string; external_id?: string } | undefined) ??
    {};
  const metadata =
    parsedPayload.metadata ??
    (data.metadata as Record<string, unknown> | undefined) ??
    {};

  const orderId = getFirstNonEmpty(
    data.order_id as string | undefined,
    data.purchase_id as string | undefined,
    data.orderId as string | undefined,
  );
  const subscriptionId = getFirstNonEmpty(
    data.subscription_id as string | undefined,
    data.subscriptionId as string | undefined,
  );
  const eventType = (parsedPayload.event || parsedPayload.type || 'unknown').toString();
  const correlationId = await generateCorrelationId(orderId, subscriptionId);
  const customerEmail = getFirstNonEmpty(
    customer?.email,
    data.customer_email as string | undefined,
  );

  const baseContext: LogContext = {
    event_correlation_id: correlationId,
    event_type: eventType,
    order_id: orderId,
    subscription_id: subscriptionId,
    customer_email: customerEmail,
    user_id: null,
  };

  log('INFO', 'webhook_received', baseContext);

  const signatureHeader = req.headers.get('x-kiwify-signature');
  const providedSignature = getFirstNonEmpty(signatureHeader ?? undefined, signatureFromBody);

  if (!providedSignature) {
    log('WARN', 'signature_missing', {
      ...baseContext,
      signature_source: 'none',
    });
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const normalizedSignature = providedSignature.trim().toLowerCase();

  let signatureValid = false;
  let matchedAlgorithm: 'sha1' | 'sha256' | null = null;

  try {
    const expectedSha1 = await computeHmac(canonicalPayload, secret, 'SHA-1');
    if (timingSafeEqual(expectedSha1, normalizedSignature)) {
      signatureValid = true;
      matchedAlgorithm = 'sha1';
    } else {
      const expectedSha256 = await computeHmac(canonicalPayload, secret, 'SHA-256');
      if (timingSafeEqual(expectedSha256, normalizedSignature)) {
        signatureValid = true;
        matchedAlgorithm = 'sha256';
      }
    }
  } catch (error) {
    log('ERROR', 'signature_verification_error', {
      ...baseContext,
      error: (error as Error).message,
    });
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  if (!signatureValid) {
    log('WARN', 'signature_invalid', {
      ...baseContext,
      signature_source: signatureHeader ? 'header' : 'body',
      matched_algorithm: matchedAlgorithm,
    });
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  log('INFO', 'signature_valid', {
    ...baseContext,
    signature_source: signatureHeader ? 'header' : 'body',
    matched_algorithm: matchedAlgorithm,
  });

  const normalizedEvent = eventType.toLowerCase();
  const isRelevantEvent =
    normalizedEvent.includes('order') ||
    normalizedEvent.includes('subscription') ||
    normalizedEvent.includes('payment') ||
    normalizedEvent.includes('charge') ||
    normalizedEvent.includes('invoice');

  if (!isRelevantEvent) {
    log('INFO', 'ignored_event', {
      ...baseContext,
      reason: 'event_not_supported',
    });
    return new Response(
      JSON.stringify({ success: true, ignored: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    log('ERROR', 'supabase_credentials_missing', baseContext);
    return new Response(
      JSON.stringify({ error: 'Supabase credentials missing' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let userId =
    getFirstNonEmpty(
      metadata.user_id as string | undefined,
      metadata.external_id as string | undefined,
      customer?.external_id,
      data.external_id as string | undefined,
    );

  if (!userId && customerEmail) {
    const { data: users, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      email: customerEmail,
    });

    if (error) {
      log('ERROR', 'user_lookup_error', { ...baseContext, error: error.message });
      return new Response(
        JSON.stringify({ error: 'Internal error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    userId = users?.users?.[0]?.id ?? null;
  }

  if (!userId) {
    log('WARN', 'user_not_found', baseContext);
    return new Response(
      JSON.stringify({ message: 'User not found' }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const plan = resolvePlan(data);
  const status = resolveStatus(eventType, (data.status as string | undefined) ?? (data.subscription_status as string | undefined));
  const planToPersist: SubscriptionPlanId = status === 'active' ? plan : 'free';
  const { current_period_start, current_period_end } = resolveTimestamps(data);

  const subscriptionPayload = {
    user_id: userId,
    plan: planToPersist,
    status,
    current_period_start,
    current_period_end,
    kiwify_order_id: orderId,
    kiwify_subscription_id: subscriptionId,
    kiwify_plan_id: getFirstNonEmpty(
      data.plan_id as string | undefined,
      data.product_id as string | undefined,
      data.plan_code as string | undefined,
    ),
    last_event_at: new Date().toISOString(),
  };

  const logContext = { ...baseContext, user_id: userId };

  const { data: subscriptionRecord, error: subscriptionError } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionPayload, { onConflict: 'user_id' })
    .select('id')
    .maybeSingle();

  if (subscriptionError) {
    log('ERROR', 'upsert_subscription_failed', {
      ...logContext,
      error: subscriptionError.message,
      hint: subscriptionError.hint ?? null,
    });
    return new Response(
      JSON.stringify({ error: 'Database error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  log('INFO', 'upsert_subscription', {
    ...logContext,
    action: 'upsert_subscription',
    outcome: 'success',
  });

  const shouldRecordPayment =
    status === 'active' &&
    Boolean(orderId) &&
    (eventType.toLowerCase().includes('order') ||
      eventType.toLowerCase().includes('payment') ||
      eventType.toLowerCase().includes('approved') ||
      eventType.toLowerCase().includes('paid') ||
      eventType.toLowerCase().includes('completed'));

  if (shouldRecordPayment) {
    const paymentPayload = {
      user_id: userId,
      subscription_id: subscriptionRecord?.id ?? null,
      plan,
      amount_cents: resolveAmountCents(data),
      currency: (getFirstNonEmpty(data.currency as string | undefined, data.charge_currency as string | undefined) ?? 'BRL'),
      payment_method: getFirstNonEmpty(data.payment_method as string | undefined, data.method as string | undefined),
      kiwify_order_id: orderId,
      kiwify_transaction_id: getFirstNonEmpty(
        data.transaction_id as string | undefined,
        data.payment_id as string | undefined,
      ),
      payment_status: 'paid',
      paid_at: getFirstNonEmpty(
        data.paid_at as string | undefined,
        data.approved_at as string | undefined,
        data.completed_at as string | undefined,
      ) ?? new Date().toISOString(),
    };

    const { error: paymentError } = await supabase
      .from('payment_history')
      .insert(paymentPayload);

    if (paymentError) {
      if (paymentError.code === '23505') {
        log('WARN', 'skip_duplicate_payment', {
          ...logContext,
          action: 'insert_payment',
          outcome: 'duplicate',
        });
      } else {
        log('ERROR', 'insert_payment_failed', {
          ...logContext,
          action: 'insert_payment',
          outcome: 'error',
          error: paymentError.message,
          hint: paymentError.hint ?? null,
        });
      }
    } else {
      log('INFO', 'insert_payment', {
        ...logContext,
        action: 'insert_payment',
        outcome: 'success',
      });
    }
  } else {
    log('INFO', 'skip_payment_record', {
      ...logContext,
      action: 'insert_payment',
      outcome: 'skipped',
      reason: 'event_not_payment_like',
    });
  }

  if (status === 'cancelled' && planToPersist === 'free') {
    log('INFO', 'subscription_cancelled', {
      ...logContext,
      action: 'subscription_status_update',
      outcome: 'cancelled',
    });
  }

  log('INFO', 'webhook_processed', {
    ...logContext,
    outcome: 'success',
  });

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
