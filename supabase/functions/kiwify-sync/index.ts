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
    const cronTokenHeader = req.headers.get('x-nutrimais-cron-token');
    const cronTokenEnv = Deno.env.get('KIWIFY_SYNC_CRON_TOKEN');

    // Debug: Log token validation ANTES de qualquer verificação
    const debugInfo = {
      hasHeaderToken: Boolean(cronTokenHeader),
      hasEnvToken: Boolean(cronTokenEnv),
      headerLength: cronTokenHeader?.length || 0,
      envLength: cronTokenEnv?.length || 0,
      tokensMatch: cronTokenHeader === cronTokenEnv,
      headerFirst10: cronTokenHeader?.substring(0, 10) || 'null',
      envFirst10: cronTokenEnv?.substring(0, 10) || 'null'
    };

    console.log('[KIWIFY-SYNC] Token validation debug:', JSON.stringify(debugInfo));
    logger.info('Token validation debug', debugInfo);

    const isCronInvocation = Boolean(cronTokenEnv && cronTokenHeader && cronTokenHeader === cronTokenEnv);

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

    let authenticatedUser: { id: string; email?: string | null } | null = null;
    let isAdmin = false;

    if (!isCronInvocation) {
      const authHeader = req.headers.get('authorization') ?? '';

      if (!authHeader.toLowerCase().startsWith('bearer ')) {
        return badRequest('Token de acesso obrigatório para sincronização manual.', correlationId);
      }

      const token = authHeader.slice(7).trim();

      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData?.user) {
        logger.warn('sync_auth_failed', serializeError(userError));
        return badRequest('Sessão inválida. Faça login novamente.', correlationId);
      }

      authenticatedUser = {
        id: userData.user.id,
        email: userData.user.email,
      };

      const { data: adminRecord, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', authenticatedUser.id)
        .maybeSingle();

      if (adminError) {
        logger.warn('sync_admin_lookup_failed', serializeError(adminError));
      }

      isAdmin = Boolean(adminRecord);
    }

    if (!isCronInvocation && !authenticatedUser) {
      return badRequest('Não autorizado.', correlationId);
    }

    logger.info('kiwify_sync_invoked', { mode });

    if (mode === 'manual') {
      if (!isCronInvocation && !isAdmin) {
        return badRequest('Sincronização manual disponível apenas para administradores.', correlationId);
      }

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

    if (!isCronInvocation && authenticatedUser && !isAdmin) {
      if (body.lookback_hours && typeof body.lookback_hours === 'number' && body.lookback_hours > 24) {
        return badRequest('Lookback máximo permitido para usuários é de 24 horas.', correlationId);
      }
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
