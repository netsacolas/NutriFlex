import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Logger } from './logger.ts';
import { serializeError } from './logger.ts';
import {
  getFirstNonEmpty,
  resolvePlan,
  resolveStatus,
  resolveTimestamps,
  resolveAmountCents,
  normalizeCurrency,
  extractCustomerEmail,
  type SubscriptionPlanId,
  type SubscriptionStatus,
} from './kiwify.ts';
import { KiwifyApiClient, type FetchSubscriptionsParams, type FetchChargesParams, type JsonRecord } from './kiwifyClient.ts';

interface SyncMetrics {
  subscriptionsFetched: number;
  subscriptionsPersisted: number;
  paymentsFetched: number;
  paymentsInserted: number;
  paymentsSkipped: number;
  usersMatched: number;
  usersMissing: number;
  errors: number;
  lastSubscriptionTimestamp: string | null;
  lastPaymentTimestamp: string | null;
}

interface SubscriptionContext {
  userId: string;
  localId: string | null;
  plan: SubscriptionPlanId;
  status: SubscriptionStatus;
}

export interface SyncResult {
  subscriptionsFetched: number;
  subscriptionsPersisted: number;
  paymentsFetched: number;
  paymentsInserted: number;
  paymentsSkipped: number;
  usersMatched: number;
  usersMissing: number;
  errors: number;
  startedAt: string;
  finishedAt: string;
  since: string;
  until: string | null;
  lastSubscriptionTimestamp: string | null;
  lastPaymentTimestamp: string | null;
}

export interface IncrementalSyncOptions {
  supabase: SupabaseClient;
  client: KiwifyApiClient;
  logger: Logger;
  lookbackHours?: number;
  since?: string;
  until?: string;
  perPage?: number;
  includePayments?: boolean;
}

export interface ManualSyncOptions {
  supabase: SupabaseClient;
  client: KiwifyApiClient;
  logger: Logger;
  userIds?: string[];
  emails?: string[];
  subscriptionIds?: string[];
  since?: string;
  until?: string;
  lookbackHours?: number;
  includePayments?: boolean;
  perPage?: number;
}

const defaultMetrics = (): SyncMetrics => ({
  subscriptionsFetched: 0,
  subscriptionsPersisted: 0,
  paymentsFetched: 0,
  paymentsInserted: 0,
  paymentsSkipped: 0,
  usersMatched: 0,
  usersMissing: 0,
  errors: 0,
  lastSubscriptionTimestamp: null,
  lastPaymentTimestamp: null,
});

const normalizeIso = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return null;
};

const updateLatest = (current: string | null, candidate: string | null): string | null => {
  if (!candidate) return current;
  if (!current) return candidate;
  return new Date(candidate) > new Date(current) ? candidate : current;
};

const ensureArray = (value?: string | string[]): string[] =>
  Array.isArray(value) ? value : value ? [value] : [];

const metadataValue = (subscription: JsonRecord, key: string): string | null => {
  const metadata =
    typeof subscription.metadata === 'object' && subscription.metadata !== null
      ? (subscription.metadata as Record<string, unknown>)
      : null;
  if (!metadata) return null;
  return getFirstNonEmpty(metadata[key] as string | undefined);
};

const resolveUserId = async (
  subscription: JsonRecord,
  supabase: SupabaseClient,
  logger: Logger,
  emailCache: Map<string, string | null>,
  filtersUserIds: Set<string>,
): Promise<string | null> => {
  const directId = getFirstNonEmpty(
    subscription.external_id as string | undefined,
    subscription.externalId as string | undefined,
    subscription.customer_external_id as string | undefined,
    metadataValue(subscription, 'user_id'),
    metadataValue(subscription, 'external_id'),
  );
  if (directId) {
    if (filtersUserIds.size > 0 && !filtersUserIds.has(directId)) {
      return null;
    }
    return directId;
  }

  const email = extractCustomerEmail(subscription);
  if (!email) {
    return null;
  }

  if (emailCache.has(email)) {
    const cached = emailCache.get(email) ?? null;
    if (cached && filtersUserIds.size > 0 && !filtersUserIds.has(cached)) {
      return null;
    }
    return cached;
  }

  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      email,
    });

    if (error) {
      logger.error('user_lookup_failed', {
        email,
        ...serializeError(error),
      });
      emailCache.set(email, null);
      return null;
    }

    const userId = data?.users?.[0]?.id ?? null;
    emailCache.set(email, userId);

    if (userId && filtersUserIds.size > 0 && !filtersUserIds.has(userId)) {
      return null;
    }

    return userId;
  } catch (error) {
    logger.error('user_lookup_exception', {
      email,
      ...serializeError(error),
    });
    emailCache.set(email, null);
    return null;
  }
};

const subscriptionOrderId = (subscription: JsonRecord): string | null =>
  getFirstNonEmpty(
    subscription.order_id as string | undefined,
    subscription.last_order_id as string | undefined,
    subscription.latest_order_id as string | undefined,
    subscription.last_payment?.order_id as string | undefined,
    subscription.latest_invoice?.order_id as string | undefined,
    metadataValue(subscription, 'order_id'),
  );

const subscriptionPlanId = (subscription: JsonRecord): string | null =>
  getFirstNonEmpty(
    subscription.plan_id as string | undefined,
    subscription.product_id as string | undefined,
    subscription.plan_code as string | undefined,
    subscription.plan?.id as string | undefined,
    subscription.plan?.code as string | undefined,
    metadataValue(subscription, 'plan_id'),
  );

const subscriptionUpdatedAt = (subscription: JsonRecord): string | null =>
  normalizeIso(
    getFirstNonEmpty(
      subscription.updated_at as string | undefined,
      subscription.last_event_at as string | undefined,
      subscription.last_payment?.paid_at as string | undefined,
      subscription.created_at as string | undefined,
    ),
  );

const isSettledPayment = (...values: Array<string | null | undefined>): boolean => {
  const combined = values
    .map(value => (typeof value === 'string' ? value.toLowerCase() : ''))
    .filter(Boolean)
    .join(' ');
  return (
    combined.includes('paid') ||
    combined.includes('approved') ||
    combined.includes('completed') ||
    combined.includes('captured')
  );
};

const paymentSubscriptionId = (payment: JsonRecord): string | null =>
  getFirstNonEmpty(
    payment.subscription_id as string | undefined,
    payment.subscription?.id as string | undefined,
    payment.order?.subscription_id as string | undefined,
  );

const paymentOrderId = (payment: JsonRecord): string | null =>
  getFirstNonEmpty(
    payment.order_id as string | undefined,
    payment.order?.id as string | undefined,
    payment.invoice?.order_id as string | undefined,
  );

const paymentTransactionId = (payment: JsonRecord): string | null =>
  getFirstNonEmpty(
    payment.transaction_id as string | undefined,
    payment.payment_id as string | undefined,
    payment.id as string | undefined,
  );

const paymentPaidAt = (payment: JsonRecord): string | null =>
  normalizeIso(
    getFirstNonEmpty(
      payment.paid_at as string | undefined,
      payment.approved_at as string | undefined,
      payment.completed_at as string | undefined,
      payment.captured_at as string | undefined,
    ),
  );

interface SubscriptionProcessingContext {
  supabase: SupabaseClient;
  logger: Logger;
  metrics: SyncMetrics;
  subscriptionMap: Map<string, SubscriptionContext>;
  emailCache: Map<string, string | null>;
  filtersUserIds: Set<string>;
}

const processSubscription = async (
  subscription: JsonRecord,
  ctx: SubscriptionProcessingContext,
): Promise<void> => {
  const subscriptionId = subscription.id as string | undefined;
  if (!subscriptionId) {
    ctx.metrics.errors += 1;
    ctx.logger.error('subscription_missing_id', { subscription });
    return;
  }

  ctx.metrics.subscriptionsFetched += 1;

  const userId = await resolveUserId(subscription, ctx.supabase, ctx.logger, ctx.emailCache, ctx.filtersUserIds);
  if (!userId) {
    ctx.metrics.usersMissing += 1;
    ctx.logger.warn('subscription_user_not_found', { subscription_id: subscriptionId });
    return;
  }

  ctx.metrics.usersMatched += 1;

  const plan = resolvePlan(subscription);
  const status = resolveStatus(
    subscription.status as string | undefined,
    subscription.subscription_status as string | undefined,
    subscription.state as string | undefined,
  );
  const subscriptionPlanToPersist: SubscriptionPlanId = status === 'active' ? plan : 'free';
  const timestamps = resolveTimestamps(subscription);

  const payload = {
    user_id: userId,
    plan: subscriptionPlanToPersist,
    status,
    current_period_start: timestamps.current_period_start,
    current_period_end: timestamps.current_period_end,
    kiwify_order_id: subscriptionOrderId(subscription),
    kiwify_subscription_id: subscriptionId,
    kiwify_plan_id: subscriptionPlanId(subscription),
    last_event_at: subscriptionUpdatedAt(subscription) ?? new Date().toISOString(),
  };

  const { data, error } = await ctx.supabase
    .from('user_subscriptions')
    .upsert(payload, { onConflict: 'user_id' })
    .select('id')
    .maybeSingle();

  if (error) {
    ctx.metrics.errors += 1;
    ctx.logger.error('subscription_upsert_failed', {
      subscription_id: subscriptionId,
      user_id: userId,
      ...serializeError(error),
    });
    return;
  }

  ctx.metrics.subscriptionsPersisted += 1;
  ctx.subscriptionMap.set(subscriptionId, {
    userId,
    localId: data?.id ?? null,
    plan,
    status,
  });

  ctx.metrics.lastSubscriptionTimestamp = updateLatest(
    ctx.metrics.lastSubscriptionTimestamp,
    subscriptionUpdatedAt(subscription),
  );
};

interface PaymentProcessingContext {
  supabase: SupabaseClient;
  logger: Logger;
  metrics: SyncMetrics;
  subscriptionMap: Map<string, SubscriptionContext>;
}

const processPayment = async (
  payment: JsonRecord,
  ctx: PaymentProcessingContext,
): Promise<void> => {
  ctx.metrics.paymentsFetched += 1;

  const status = getFirstNonEmpty(
    payment.status as string | undefined,
    payment.payment_status as string | undefined,
  );

  if (!isSettledPayment(status)) {
    ctx.metrics.paymentsSkipped += 1;
    ctx.logger.info('payment_skipped_status', {
      status,
      payment_id: payment.id ?? null,
    });
    return;
  }

  const subscriptionId = paymentSubscriptionId(payment);
  const mapping = subscriptionId ? ctx.subscriptionMap.get(subscriptionId) : undefined;

  if (!mapping) {
    ctx.metrics.paymentsSkipped += 1;
    ctx.logger.warn('payment_subscription_not_synced', {
      payment_id: payment.id ?? null,
      subscription_id: subscriptionId,
    });
    return;
  }

  const kiwifyOrderId = paymentOrderId(payment);
  const amountCents = resolveAmountCents(payment);
  const paidAt = paymentPaidAt(payment) ?? new Date().toISOString();

  const payload = {
    user_id: mapping.userId,
    subscription_id: mapping.localId,
    plan: mapping.plan,
    amount_cents: amountCents,
    currency: normalizeCurrency(payment.currency),
    payment_method: getFirstNonEmpty(
      payment.payment_method as string | undefined,
      payment.method as string | undefined,
      payment.card_brand as string | undefined,
    ),
    kiwify_order_id: kiwifyOrderId,
    kiwify_transaction_id: paymentTransactionId(payment),
    payment_status: 'paid',
    paid_at: paidAt,
  };

  const { error } = await ctx.supabase
    .from('payment_history')
    .insert(payload);

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      ctx.metrics.paymentsSkipped += 1;
      ctx.logger.warn('payment_duplicate', {
        subscription_id: subscriptionId,
        kiwify_order_id: kiwifyOrderId,
      });
    } else {
      ctx.metrics.errors += 1;
      ctx.logger.error('payment_insert_failed', {
        subscription_id: subscriptionId,
        kiwify_order_id: kiwifyOrderId,
        ...serializeError(error),
      });
    }
    return;
  }

  ctx.metrics.paymentsInserted += 1;
  ctx.metrics.lastPaymentTimestamp = updateLatest(
    ctx.metrics.lastPaymentTimestamp,
    paidAt,
  );
};

const iterateSubscriptions = async (
  client: KiwifyApiClient,
  params: FetchSubscriptionsParams,
  handler: (subscription: JsonRecord) => Promise<void>,
): Promise<void> => {
  let page = params.page ?? 1;
  let cursor = params.cursor ?? null;

  for (let safety = 0; safety < 500; safety += 1) {
    const response = await client.fetchSubscriptions({
      ...params,
      page,
      cursor: cursor ?? undefined,
    });

    if (response.items.length === 0 && !response.hasMore) {
      break;
    }

    for (const item of response.items) {
      await handler(item);
    }

    if (response.nextCursor) {
      cursor = response.nextCursor;
    } else {
      cursor = null;
    }

    if (response.nextPage) {
      page = response.nextPage;
    } else if (cursor) {
      // keep same page when paging via cursor
    } else if (response.hasMore) {
      page += 1;
    } else {
      break;
    }
  }
};

const iteratePayments = async (
  client: KiwifyApiClient,
  params: FetchChargesParams,
  handler: (payment: JsonRecord) => Promise<void>,
): Promise<void> => {
  let page = params.page ?? 1;
  let cursor = params.cursor ?? null;

  for (let safety = 0; safety < 500; safety += 1) {
    const response = await client.fetchCharges({
      ...params,
      page,
      cursor: cursor ?? undefined,
    });

    if (response.items.length === 0 && !response.hasMore) {
      break;
    }

    for (const item of response.items) {
      await handler(item);
    }

    if (response.nextCursor) {
      cursor = response.nextCursor;
    } else {
      cursor = null;
    }

    if (response.nextPage) {
      page = response.nextPage;
    } else if (cursor) {
      // keep same page when cursor is controlling pagination
    } else if (response.hasMore) {
      page += 1;
    } else {
      break;
    }
  }
};

const defaultSince = (lookbackHours = 24): string => {
  const reference = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
  return reference.toISOString();
};

const overlapSince = (iso: string, minutes = 5): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Date(date.getTime() - minutes * 60 * 1000).toISOString();
};

export const runIncrementalSync = async (options: IncrementalSyncOptions): Promise<SyncResult> => {
  const startedAt = new Date().toISOString();
  const metrics = defaultMetrics();
  const subscriptionMap = new Map<string, SubscriptionContext>();
  const emailCache = new Map<string, string | null>();

  const perPage = options.perPage ?? 50;

  const { data: syncState, error: syncStateError } = await options.supabase
    .from('kiwify_sync_state')
    .select('last_synced_at')
    .eq('id', 'singleton')
    .maybeSingle();

  if (syncStateError) {
    options.logger.warn('sync_state_fetch_error', serializeError(syncStateError));
  }

  let since = options.since ?? syncState?.last_synced_at ?? defaultSince(options.lookbackHours);
  if (!since) {
    since = defaultSince(options.lookbackHours);
  }
  since = overlapSince(since);

  const filtersUserIds = new Set<string>();

  await iterateSubscriptions(
    options.client,
    { updatedFrom: since, updatedTo: options.until, perPage },
    async (subscription) => {
      await processSubscription(subscription, {
        supabase: options.supabase,
        logger: options.logger,
        metrics,
        subscriptionMap,
        emailCache,
        filtersUserIds,
      });
    },
  );

  if (options.includePayments !== false) {
    await iteratePayments(
      options.client,
      { paidFrom: since, paidTo: options.until, perPage },
      async (payment) => {
        await processPayment(payment, {
          supabase: options.supabase,
          logger: options.logger,
          metrics,
          subscriptionMap,
        });
      },
    );
  }

  const lastTimestamp =
    metrics.lastPaymentTimestamp &&
    metrics.lastSubscriptionTimestamp
      ? (new Date(metrics.lastPaymentTimestamp) > new Date(metrics.lastSubscriptionTimestamp)
        ? metrics.lastPaymentTimestamp
        : metrics.lastSubscriptionTimestamp)
      : metrics.lastSubscriptionTimestamp ?? metrics.lastPaymentTimestamp;

  if (lastTimestamp) {
    const { error } = await options.supabase
      .from('kiwify_sync_state')
      .upsert({ id: 'singleton', last_synced_at: lastTimestamp });

    if (error) {
      options.logger.error('sync_state_update_failed', serializeError(error));
      metrics.errors += 1;
    }
  }

  const finishedAt = new Date().toISOString();

  return {
    subscriptionsFetched: metrics.subscriptionsFetched,
    subscriptionsPersisted: metrics.subscriptionsPersisted,
    paymentsFetched: metrics.paymentsFetched,
    paymentsInserted: metrics.paymentsInserted,
    paymentsSkipped: metrics.paymentsSkipped,
    usersMatched: metrics.usersMatched,
    usersMissing: metrics.usersMissing,
    errors: metrics.errors,
    startedAt,
    finishedAt,
    since,
    until: options.until ?? null,
    lastSubscriptionTimestamp: metrics.lastSubscriptionTimestamp,
    lastPaymentTimestamp: metrics.lastPaymentTimestamp,
  };
};

export const runManualSync = async (options: ManualSyncOptions): Promise<SyncResult> => {
  const startedAt = new Date().toISOString();
  const metrics = defaultMetrics();
  const subscriptionMap = new Map<string, SubscriptionContext>();
  const emailCache = new Map<string, string | null>();
  const perPage = options.perPage ?? 50;

  const since = options.since ?? defaultSince(options.lookbackHours);
  const until = options.until ?? null;

  const filtersUserIds = new Set<string>(ensureArray(options.userIds));

  const processedIds = new Set<string>();

  const collect = async (params: FetchSubscriptionsParams) => {
    await iterateSubscriptions(
      options.client,
      { ...params, perPage, updatedFrom: since, updatedTo: until ?? undefined },
      async (subscription) => {
        const subscriptionId = subscription.id as string | undefined;
        if (subscriptionId && processedIds.has(subscriptionId)) {
          return;
        }
        await processSubscription(subscription, {
          supabase: options.supabase,
          logger: options.logger,
          metrics,
          subscriptionMap,
          emailCache,
          filtersUserIds,
        });
        if (subscriptionId) {
          processedIds.add(subscriptionId);
        }
      },
    );
  };

  const subscriptionIds = ensureArray(options.subscriptionIds);
  for (const subscriptionId of subscriptionIds) {
    await collect({ subscriptionId });
  }

  for (const userId of filtersUserIds) {
    await collect({ externalId: userId });
  }

  const emails = ensureArray(options.emails);
  for (const email of emails) {
    await collect({ email });
  }

  if (options.includePayments !== false) {
    await iteratePayments(
      options.client,
      { perPage, paidFrom: since, paidTo: until ?? undefined },
      async (payment) => {
        await processPayment(payment, {
          supabase: options.supabase,
          logger: options.logger,
          metrics,
          subscriptionMap,
        });
      },
    );
  }

  const finishedAt = new Date().toISOString();

  return {
    subscriptionsFetched: metrics.subscriptionsFetched,
    subscriptionsPersisted: metrics.subscriptionsPersisted,
    paymentsFetched: metrics.paymentsFetched,
    paymentsInserted: metrics.paymentsInserted,
    paymentsSkipped: metrics.paymentsSkipped,
    usersMatched: metrics.usersMatched,
    usersMissing: metrics.usersMissing,
    errors: metrics.errors,
    startedAt,
    finishedAt,
    since,
    until,
    lastSubscriptionTimestamp: metrics.lastSubscriptionTimestamp,
    lastPaymentTimestamp: metrics.lastPaymentTimestamp,
  };
};
