import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

import { createLogger, serializeError } from '../_shared/logger.ts';
import { getFirstNonEmpty } from '../_shared/kiwify.ts';
import { KiwifyApiClient } from '../_shared/kiwifyClient.ts';
import { runManualSync } from '../_shared/kiwifySyncEngine.ts';

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

const badRequest = (message: string, correlationId: string): Response =>
  new Response(JSON.stringify({ error: message, correlation_id: correlationId }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const unauthorized = (message: string, correlationId: string): Response =>
  new Response(JSON.stringify({ error: message, correlation_id: correlationId }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const forbidden = (message: string, correlationId: string): Response =>
  new Response(JSON.stringify({ error: message, correlation_id: correlationId }), {
    status: 403,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const okResponse = (payload: unknown, correlationId: string): Response =>
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  const logger = createLogger(correlationId);

  try {
    const supabase = createSupabaseClient();
    const client = new KiwifyApiClient(logger);

    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return unauthorized('Cabeçalho Authorization ausente ou inválido.', correlationId);
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return unauthorized('Token de acesso não informado.', correlationId);
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      logger.warn('auth_get_user_failed', serializeError(userError));
      return unauthorized('Sessão inválida. Faça login novamente.', correlationId);
    }

    const authenticatedUser = userData.user;

    const { data: adminRecord, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', authenticatedUser.id)
      .maybeSingle();

    if (adminError) {
      logger.warn('admin_lookup_failed', serializeError(adminError));
    }

    const isAdmin = Boolean(adminRecord);

    const body = req.method === 'POST' ? await req.json() : {};
    const action = (body?.action as string | undefined) ?? null;

    if (!action) {
      return badRequest('Campo "action" é obrigatório.', correlationId);
    }

    logger.info('kiwify_api_request', { action });

    switch (action) {
      case 'list_subscriptions': {
        const requestedExternalId = getFirstNonEmpty(
          body.external_id as string | undefined,
          body.user_id as string | undefined,
        );
        const requestedEmail = body.email as string | undefined;

        let effectiveExternalId: string | undefined = requestedExternalId ?? undefined;
        let effectiveEmail: string | undefined = requestedEmail ?? undefined;

        if (!isAdmin) {
          // Usuário comum só pode consultar a própria conta
          if (requestedExternalId && requestedExternalId !== authenticatedUser.id) {
            return forbidden('Você não tem permissão para consultar outras assinaturas.', correlationId);
          }
          if (requestedEmail && authenticatedUser.email && requestedEmail.toLowerCase() !== authenticatedUser.email.toLowerCase()) {
            return forbidden('Você não tem permissão para consultar outras assinaturas.', correlationId);
          }

          effectiveExternalId = authenticatedUser.id;
          effectiveEmail = authenticatedUser.email ?? undefined;
        }

        if (!effectiveExternalId && !effectiveEmail) {
          return badRequest('Informe "user_id/external_id" ou "email" para listar assinaturas.', correlationId);
        }

        const result = await client.fetchSubscriptions({
          externalId: effectiveExternalId,
          email: effectiveEmail,
          perPage: body.per_page as number | undefined,
        });

        logger.info('list_subscriptions_success', {
          count: result.items.length,
          has_more: result.hasMore,
        });

        return okResponse({ data: result.items, meta: result.meta }, correlationId);
      }

      case 'get_subscription': {
        const subscriptionId = body.subscription_id as string | undefined;
        if (!subscriptionId) {
          return badRequest('Campo "subscription_id" é obrigatório.', correlationId);
        }

        if (!isAdmin) {
          const { data: ownership } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('user_id', authenticatedUser.id)
            .eq('kiwify_subscription_id', subscriptionId)
            .maybeSingle();

          if (!ownership) {
            return forbidden('Assinatura não pertence ao usuário autenticado.', correlationId);
          }
        }

        const result = await client.fetchSubscriptions({ subscriptionId });
        const subscription = result.items[0] ?? null;

        if (!subscription) {
          return new Response(
            JSON.stringify({ error: 'Assinatura não encontrada.', correlation_id: correlationId }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        logger.info('get_subscription_success', { subscription_id: subscriptionId });
        return okResponse({ data: subscription }, correlationId);
      }

      case 'cancel_subscription': {
        if (!isAdmin) {
          return forbidden('Apenas administradores podem cancelar assinaturas.', correlationId);
        }

        const subscriptionId = body.subscription_id as string | undefined;
        const userId = body.user_id as string | undefined;

        if (!subscriptionId || !userId) {
          return badRequest('Campos "subscription_id" e "user_id" são obrigatórios.', correlationId);
        }

        const { data: subscriptionRecord, error } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', userId)
          .eq('kiwify_subscription_id', subscriptionId)
          .maybeSingle();

        if (error) {
          logger.error('cancel_subscription_lookup_failed', serializeError(error));
          return new Response(
            JSON.stringify({ error: 'Falha ao validar assinatura.', correlation_id: correlationId }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        if (!subscriptionRecord) {
          return new Response(
            JSON.stringify({ error: 'Assinatura não pertence ao usuário informado.', correlation_id: correlationId }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        await client.cancelSubscription(subscriptionId);
        logger.info('cancel_subscription_success', { subscription_id: subscriptionId, user_id: userId });

        // Atualiza estado local após cancelamento
        const syncResult = await runManualSync({
          supabase,
          client,
          logger,
          subscriptionIds: [subscriptionId],
          userIds: [userId],
        });

        return okResponse({ success: true, sync: syncResult }, correlationId);
      }

      case 'sync_subscription': {
        const userId = body.user_id as string | undefined;
        if (!userId) {
          return badRequest('Campo "user_id" é obrigatório para sincronização.', correlationId);
        }

        if (!isAdmin && userId !== authenticatedUser.id) {
          return forbidden('Você não tem permissão para sincronizar esse usuário.', correlationId);
        }

        const syncResult = await runManualSync({
          supabase,
          client,
          logger,
          userIds: [userId],
        });

        logger.info('sync_subscription_completed', {
          user_id: userId,
          subscriptions: syncResult.subscriptionsPersisted,
          payments: syncResult.paymentsInserted,
        });

        return okResponse({ success: true, result: syncResult }, correlationId);
      }

      case 'sync_manual': {
        const emailsRaw = (body.emails as string[] | undefined) ?? [];
        const userIdsRaw = (body.user_ids as string[] | undefined) ?? (body.user_id ? [body.user_id] : []);
        const subscriptionIdsRaw = (body.subscription_ids as string[] | undefined) ?? (body.subscription_id ? [body.subscription_id] : []);

        const emails = emailsRaw.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
        const userIds = userIdsRaw.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
        const subscriptionIds = subscriptionIdsRaw.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

        if (!isAdmin) {
          const normalizedUserEmail = authenticatedUser.email?.toLowerCase() ?? null;

          if (
            emails.some((email) => normalizedUserEmail && email?.toLowerCase() !== normalizedUserEmail) ||
            userIds.some((id) => id !== authenticatedUser.id)
          ) {
            return forbidden('Sincronização manual limitada ao próprio usuário.', correlationId);
          }

          if (subscriptionIds.length > 0) {
            const { data: ownedSubscriptions } = await supabase
              .from('user_subscriptions')
              .select('kiwify_subscription_id')
              .eq('user_id', authenticatedUser.id)
              .in('kiwify_subscription_id', subscriptionIds)
              .limit(subscriptionIds.length);

            const ownedIds = new Set(
              (ownedSubscriptions ?? [])
                .map((item) => item.kiwify_subscription_id)
                .filter((value): value is string => typeof value === 'string' && value.length > 0),
            );
            const unauthorizedIds = subscriptionIds.filter((id) => !ownedIds.has(id));

            if (unauthorizedIds.length > 0) {
              return forbidden('Sincronização manual limitada ao próprio usuário.', correlationId);
            }
          }
        }

        if (emails.length === 0 && userIds.length === 0 && subscriptionIds.length === 0) {
          return badRequest('Informe ao menos "emails", "user_ids" ou "subscription_ids" para sincronização manual.', correlationId);
        }

        const syncResult = await runManualSync({
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

        logger.info('sync_manual_completed', {
          emails: emails.length,
          user_ids: userIds.length,
          subscription_ids: subscriptionIds.length,
          subscriptions: syncResult.subscriptionsPersisted,
          payments: syncResult.paymentsInserted,
        });

        return okResponse({ success: true, result: syncResult }, correlationId);
      }

      case 'oauth_status': {
        if (!isAdmin) {
          return forbidden('Apenas administradores podem consultar o status OAuth.', correlationId);
        }
        const forceRefresh = body.force_refresh === true;
        const status = await client.tokenMetadata(forceRefresh);
        logger.info('oauth_status', { source: status.source, expires_at: status.expiresAt });
        return okResponse({
          token_valid: Boolean(status.expiresAt && status.expiresAt > Date.now()),
          expires_at: status.expiresAt,
          source: status.source,
        }, correlationId);
      }

      default:
        return badRequest(`Ação desconhecida: ${action}`, correlationId);
    }
  } catch (error) {
    logger.error('kiwify_api_failure', serializeError(error));

    return new Response(
      JSON.stringify({
        error: 'Erro interno na integração com a Kiwify.',
        correlation_id: correlationId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
