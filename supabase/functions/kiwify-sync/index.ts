import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

import { createLogger, serializeError } from '../_shared/logger.ts';
import { KiwifyApiClient } from '../_shared/kiwifyClient.ts';
import { runIncrementalSync, runManualSync } from '../_shared/kiwifySyncEngine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  }

  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
};

const ok = (payload: unknown, correlationId: string): Response =>
  new Response(
    JSON.stringify({
      correlation_id: correlationId,
      ...((typeof payload === 'object' && payload !== null) ? payload : { data: payload }),
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );

const badRequest = (message: string, correlationId: string): Response =>
  new Response(JSON.stringify({ error: message, correlation_id: correlationId }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  const logger = createLogger(correlationId);

  try {
    const supabase = createSupabaseClient();
    const client = new KiwifyApiClient(logger);

    const url = new URL(req.url);
    const modeFromQuery = url.searchParams.get('mode');

    let body: Record<string, unknown> = {};
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const mode = (body.mode as string | undefined) ?? modeFromQuery ?? 'incremental';

    logger.info('kiwify_sync_invoked', { mode });

    if (mode === 'manual') {
      const emails = (body.emails as string[] | undefined) ?? [];
      const userIds = (body.user_ids as string[] | undefined) ?? (body.user_id ? [body.user_id] : []);
      const subscriptionIds = (body.subscription_ids as string[] | undefined) ?? (body.subscription_id ? [body.subscription_id] : []);

      if (emails.length === 0 && userIds.length === 0 && subscriptionIds.length === 0) {
        return badRequest('Informe ao menos "emails", "user_ids" ou "subscription_ids" para sincronização manual.', correlationId);
      }

      const result = await runManualSync({
        supabase,
        client,
        logger,
        emails,
        userIds,
        subscriptionIds,
        since: body.since as string | undefined,
        until: body.until as string | undefined,
        includePayments: body.include_payments !== false,
      });

      logger.info('kiwify_sync_manual_completed', {
        subscriptions_persisted: result.subscriptionsPersisted,
        payments_inserted: result.paymentsInserted,
        users_matched: result.usersMatched,
      });

      return ok({ success: true, mode: 'manual', result }, correlationId);
    }

    const incrementalResult = await runIncrementalSync({
      supabase,
      client,
      logger,
      lookbackHours: typeof body.lookback_hours === 'number' ? body.lookback_hours : undefined,
      since: body.since as string | undefined,
      until: body.until as string | undefined,
      includePayments: body.include_payments !== false,
    });

    logger.info('kiwify_sync_incremental_completed', {
      subscriptions_persisted: incrementalResult.subscriptionsPersisted,
      payments_inserted: incrementalResult.paymentsInserted,
      users_matched: incrementalResult.usersMatched,
      last_subscription_timestamp: incrementalResult.lastSubscriptionTimestamp,
      last_payment_timestamp: incrementalResult.lastPaymentTimestamp,
    });

    return ok({ success: true, mode: 'incremental', result: incrementalResult }, correlationId);
  } catch (error) {
    logger.error('kiwify_sync_failure', serializeError(error));
    return new Response(
      JSON.stringify({
        error: 'Erro interno na sincronização Kiwify.',
        correlation_id: correlationId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
