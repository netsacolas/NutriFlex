type SubscriptionPlanId = 'free' | 'premium_monthly' | 'premium_quarterly' | 'premium_annual';
type SubscriptionStatus = 'active' | 'incomplete' | 'past_due' | 'cancelled';

interface TimestampResult {
  current_period_start: string | null;
  current_period_end: string | null;
}

const nowIso = () => new Date().toISOString();

const envPlanIds = () => ({
  monthly: Deno.env.get('KIWIFY_PLAN_MONTHLY_ID')?.trim() || null,
  quarterly: Deno.env.get('KIWIFY_PLAN_QUARTERLY_ID')?.trim() || null,
  annual: Deno.env.get('KIWIFY_PLAN_ANNUAL_ID')?.trim() || null,
});

const sanitizeString = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
};

export const getFirstNonEmpty = (...values: (string | undefined | null)[]): string | null => {
  for (const value of values) {
    const sanitized = sanitizeString(value);
    if (sanitized) return sanitized;
  }
  return null;
};

export const resolvePlan = (data: Record<string, unknown>): SubscriptionPlanId => {
  const { monthly, quarterly, annual } = envPlanIds();
  const planData =
    typeof data.plan === 'object' && data.plan !== null
      ? (data.plan as Record<string, unknown>)
      : null;

  const planId = getFirstNonEmpty(
    data.plan_id as string | undefined,
    data.product_id as string | undefined,
    data.plan_code as string | undefined,
    planData?.id as string | undefined,
    planData?.code as string | undefined,
  );

  if (planId && monthly && planId === monthly) return 'premium_monthly';
  if (planId && quarterly && planId === quarterly) return 'premium_quarterly';
  if (planId && annual && planId === annual) return 'premium_annual';

  const frequency = getFirstNonEmpty(
    data.frequency as string | undefined,
    data.billing_period as string | undefined,
    data.billing_cycle as string | undefined,
    planData?.frequency as string | undefined,
    planData?.billing_cycle as string | undefined,
    planData?.interval as string | undefined,
  );

  if (frequency) {
    const normalized = frequency.toLowerCase();
    if (normalized.includes('month')) return 'premium_monthly';
    if (normalized.includes('quarter')) return 'premium_quarterly';
    if (normalized.includes('year') || normalized.includes('annual')) return 'premium_annual';
  }

  return 'premium_monthly';
};

export const resolveStatus = (...rawValues: Array<string | null | undefined>): SubscriptionStatus => {
  const normalized = rawValues
    .map(value => sanitizeString(value)?.toLowerCase())
    .filter((value): value is string => Boolean(value))
    .join(' ');

  if (
    normalized.includes('approved') ||
    normalized.includes('paid') ||
    normalized.includes('completed') ||
    normalized.includes('active')
  ) {
    return 'active';
  }

  if (normalized.includes('cancel')) {
    return 'cancelled';
  }

  if (normalized.includes('past_due') || normalized.includes('overdue')) {
    return 'past_due';
  }

  if (normalized.includes('expire')) {
    return 'cancelled';
  }

  return 'incomplete';
};

export const resolveTimestamps = (data: Record<string, unknown>): TimestampResult => {
  const fallbackNow = nowIso();

  const start = getFirstNonEmpty(
    data.current_period_start as string | undefined,
    data.start_date as string | undefined,
    data.approved_at as string | undefined,
    data.approved_date as string | undefined,
    data.created_at as string | undefined,
    data.begin_date as string | undefined,
  ) || fallbackNow;

  const end = getFirstNonEmpty(
    data.current_period_end as string | undefined,
    data.next_payment as string | undefined,
    data.expiration_date as string | undefined,
    data.expires_at as string | undefined,
    data.period_end as string | undefined,
  );

  return {
    current_period_start: start,
    current_period_end: end,
  };
};

export const resolveAmountCents = (data: Record<string, unknown>): number => {
  const integerCandidates: Array<unknown> = [
    data.amount_cents,
    data.total_cents,
    data.value_cents,
    data.charge_amount_cents,
    data.price_cents,
  ];

  for (const candidate of integerCandidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return Math.round(candidate);
    }
    if (typeof candidate === 'string') {
      const parsed = Number(candidate);
      if (!Number.isNaN(parsed)) {
        return Math.round(parsed);
      }
    }
  }

  const decimalCandidates: Array<unknown> = [
    data.amount,
    data.total,
    data.total_amount,
    data.charge_amount,
    data.price,
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

export const normalizeCurrency = (value: unknown): string => {
  const currency = sanitizeString(value);
  if (!currency) return 'BRL';
  return currency.toUpperCase();
};

export const extractCustomerEmail = (data: Record<string, unknown>): string | null => {
  const customer =
    typeof data.customer === 'object' && data.customer !== null
      ? (data.customer as Record<string, unknown>)
      : null;

  const user =
    typeof data.user === 'object' && data.user !== null
      ? (data.user as Record<string, unknown>)
      : null;

  return getFirstNonEmpty(
    customer?.email as string | undefined,
    data.customer_email as string | undefined,
    user?.email as string | undefined,
  );
};

export type { SubscriptionPlanId, SubscriptionStatus, TimestampResult };
