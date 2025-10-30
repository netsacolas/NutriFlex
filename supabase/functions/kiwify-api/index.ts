import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const KIWIFY_BASE_URL = 'https://api.kiwify.com.br';

interface KiwifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SubscriptionData {
  id: string;
  status: string;
  customer: {
    email: string;
    name: string;
  };
  plan: {
    id: string;
    name: string;
  };
  current_period_start: string;
  current_period_end: string;
  external_id?: string;
}

// Cache do token de acesso (em memória)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Obtém access token da Kiwify (com cache)
 */
async function getKiwifyAccessToken(): Promise<string> {
  const now = Date.now();

  // Retorna token do cache se ainda válido (55 min de cache para token de 60 min)
  if (cachedToken && cachedToken.expiresAt > now) {
    console.log('[Kiwify API] Using cached access token');
    return cachedToken.token;
  }

  console.log('[Kiwify API] Fetching new access token');

  const clientId = Deno.env.get('KIWIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('KIWIFY_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Kiwify credentials not configured in Supabase Secrets');
  }

  const response = await fetch(`${KIWIFY_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Kiwify API] Token error:', errorText);
    throw new Error(`Failed to get Kiwify token: ${response.status}`);
  }

  const data: KiwifyTokenResponse = await response.json();

  // Cache token por 55 minutos (expires_in é 3600 = 60 min)
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 300) * 1000, // -5 min de segurança
  };

  return data.access_token;
}

/**
 * Faz requisição autenticada à API Kiwify
 */
async function kiwifyRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getKiwifyAccessToken();

  const response = await fetch(`${KIWIFY_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response;
}

/**
 * Lista assinaturas de um usuário
 */
async function listSubscriptions(externalId: string): Promise<SubscriptionData[]> {
  const response = await kiwifyRequest(
    `/v1/subscriptions?external_id=${externalId}`
  );

  if (!response.ok) {
    throw new Error(`Failed to list subscriptions: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Obtém detalhes de uma assinatura específica
 */
async function getSubscription(subscriptionId: string): Promise<SubscriptionData> {
  const response = await kiwifyRequest(`/v1/subscriptions/${subscriptionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get subscription: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Cancela uma assinatura
 */
async function cancelSubscription(subscriptionId: string, userId: string): Promise<void> {
  // Validar que a assinatura pertence ao usuário
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('kiwify_subscription_id', subscriptionId)
    .single();

  if (error || !subscription) {
    throw new Error('Subscription not found or unauthorized');
  }

  // Cancelar na Kiwify
  const response = await kiwifyRequest(`/v1/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel subscription: ${response.status}`);
  }

  // Atualizar status local
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  console.log(`[Kiwify API] Subscription ${subscriptionId} canceled for user ${userId}`);
}

/**
 * Sincroniza status de assinatura da Kiwify para o banco local
 */
async function syncSubscription(userId: string): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Buscar assinaturas ativas na Kiwify
  const kiwifySubs = await listSubscriptions(userId);

  // Atualizar banco local
  for (const sub of kiwifySubs) {
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        kiwify_subscription_id: sub.id,
        status: sub.status === 'active' ? 'active' : 'canceled',
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('[Kiwify API] Sync error:', error);
    }
  }

  console.log(`[Kiwify API] Synced ${kiwifySubs.length} subscriptions for user ${userId}`);
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { action, subscription_id, user_id, external_id } = await req.json();

    console.log(`[Kiwify API] Action: ${action}`, { user_id, subscription_id });

    let result;

    switch (action) {
      case 'list_subscriptions':
        if (!external_id && !user_id) {
          throw new Error('external_id or user_id required');
        }
        result = await listSubscriptions(external_id || user_id);
        break;

      case 'get_subscription':
        if (!subscription_id) {
          throw new Error('subscription_id required');
        }
        result = await getSubscription(subscription_id);
        break;

      case 'cancel_subscription':
        if (!subscription_id || !user_id) {
          throw new Error('subscription_id and user_id required');
        }
        await cancelSubscription(subscription_id, user_id);
        result = { success: true, message: 'Subscription canceled' };
        break;

      case 'sync_subscription':
        if (!user_id) {
          throw new Error('user_id required');
        }
        await syncSubscription(user_id);
        result = { success: true, message: 'Subscriptions synced' };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Kiwify API] Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
