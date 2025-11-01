import { supabase } from './supabaseClient';
import logger from '../utils/logger';

interface KiwifySubscription {
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

interface InvokeEnvelope<T> {
  data?: T;
  error?: string;
  correlation_id?: string;
  meta?: unknown;
  [key: string]: unknown;
}

const unwrapData = <T>(payload: InvokeEnvelope<T> | null | undefined): T | null => {
  if (!payload) {
    return null;
  }

  if (payload.data !== undefined) {
    return payload.data as T;
  }

  return (payload as unknown) as T;
};

/**
 * Serviço para comunicação segura com a API Kiwify através das Edge Functions
 *
 * SEGURANÇA:
 * - Credenciais Kiwify ficam APENAS no Supabase Secrets Vault
 * - Frontend nunca acessa diretamente a API Kiwify
 * - Todas as chamadas passam pelas Edge Functions `kiwify-api`/`kiwify-sync`
 */
export const kiwifyApiService = {
  /**
   * Lista assinaturas do usuário na Kiwify
   */
  async listSubscriptions(userId: string): Promise<KiwifySubscription[]> {
    try {
      logger.info('[Kiwify API] Listando assinaturas', { userId });

      const { data, error } = await supabase.functions.invoke<InvokeEnvelope<KiwifySubscription[]>>('kiwify-api', {
        body: {
          action: 'list_subscriptions',
          user_id: userId,
        },
      });

      if (error) {
        logger.error('[Kiwify API] Erro ao listar assinaturas', error);
        throw error;
      }

      const subscriptions = unwrapData<KiwifySubscription[]>(data) ?? [];
      logger.info('[Kiwify API] Assinaturas listadas', { count: subscriptions.length });
      return subscriptions;
    } catch (error) {
      logger.error('[Kiwify API] Falha ao listar assinaturas', error);
      throw new Error('Não foi possível carregar as assinaturas. Tente novamente.');
    }
  },

  /**
   * Obtém detalhes de uma assinatura específica
   */
  async getSubscription(subscriptionId: string): Promise<KiwifySubscription> {
    try {
      logger.info('[Kiwify API] Obtendo assinatura', { subscriptionId });

      const { data, error } = await supabase.functions.invoke<InvokeEnvelope<KiwifySubscription>>('kiwify-api', {
        body: {
          action: 'get_subscription',
          subscription_id: subscriptionId,
        },
      });

      if (error) {
        logger.error('[Kiwify API] Erro ao obter assinatura', error);
        throw error;
      }

      const subscription = unwrapData<KiwifySubscription>(data);
      if (!subscription) {
        throw new Error('Assinatura não encontrada');
      }

      logger.info('[Kiwify API] Assinatura obtida', { status: subscription.status });
      return subscription;
    } catch (error) {
      logger.error('[Kiwify API] Falha ao obter assinatura', error);
      throw new Error('Não foi possível carregar os detalhes da assinatura.');
    }
  },

  /**
   * Cancela uma assinatura
   *
   * IMPORTANTE: Valida que o usuário é o dono da assinatura
   */
  async cancelSubscription(subscriptionId: string, userId: string): Promise<void> {
    try {
      logger.info('[Kiwify API] Cancelando assinatura', { subscriptionId, userId });

      const { data, error } = await supabase.functions.invoke<InvokeEnvelope<{ success: boolean }>>('kiwify-api', {
        body: {
          action: 'cancel_subscription',
          subscription_id: subscriptionId,
          user_id: userId,
        },
      });

      if (error) {
        logger.error('[Kiwify API] Erro ao cancelar assinatura', error);
        throw error;
      }

      const payload = unwrapData<{ success: boolean }>(data);
      if (!payload?.success) {
        throw new Error('Falha ao cancelar assinatura');
      }

      logger.info('[Kiwify API] Assinatura cancelada com sucesso');
    } catch (error) {
      logger.error('[Kiwify API] Falha ao cancelar assinatura', error);

      if (error instanceof Error && error.message.includes('unauthorized')) {
        throw new Error('Você não tem permissão para cancelar esta assinatura.');
      }

      throw new Error('Não foi possível cancelar a assinatura. Tente novamente ou entre em contato com o suporte.');
    }
  },

  /**
   * Sincroniza status das assinaturas da Kiwify para o banco local
   *
   * Útil para:
   * - Verificar status após pagamento
   * - Detectar cancelamentos externos
   * - Atualizar período de renovação
   */
  async syncSubscription(userId: string): Promise<void> {
    try {
      logger.info('[Kiwify API] Sincronizando assinaturas', { userId });

      const { data, error } = await supabase.functions.invoke<InvokeEnvelope<{ success: boolean }>>('kiwify-api', {
        body: {
          action: 'sync_subscription',
          user_id: userId,
        },
      });

      if (error) {
        logger.error('[Kiwify API] Erro ao sincronizar', error);
        throw error;
      }

      const payload = unwrapData<{ success: boolean }>(data);
      if (!payload?.success) {
        throw new Error('Falha ao sincronizar');
      }

      logger.info('[Kiwify API] Sincronização concluída');
    } catch (error) {
      logger.error('[Kiwify API] Falha ao sincronizar', error);
      // Não lançar erro - sincronização é background task
    }
  },

  /**
   * Sincronização manual por filtros (emails, user_ids, subscription_ids)
   */
  async manualSync(options: {
    emails?: string[];
    userIds?: string[];
    subscriptionIds?: string[];
    since?: string;
    until?: string;
    includePayments?: boolean;
  }): Promise<void> {
    try {
      logger.info('[Kiwify API] Sincronização manual solicitada', options);

      const { data, error } = await supabase.functions.invoke<InvokeEnvelope<{ success: boolean }>>('kiwify-api', {
        body: {
          action: 'sync_manual',
          emails: options.emails,
          user_ids: options.userIds,
          subscription_ids: options.subscriptionIds,
          since: options.since,
          until: options.until,
          include_payments: options.includePayments !== false,
        },
      });

      if (error) {
        logger.error('[Kiwify API] Erro ao executar sync manual', error);
        throw error;
      }

      const payload = unwrapData<{ success: boolean }>(data);
      if (!payload?.success) {
        throw new Error('Falha ao executar sincronização manual');
      }

      logger.info('[Kiwify API] Sincronização manual concluída');
    } catch (error) {
      logger.error('[Kiwify API] Falha na sincronização manual', error);
      throw new Error('Não foi possível executar a sincronização manual. Verifique os filtros e tente novamente.');
    }
  },

  /**
   * Verifica se o usuário tem uma assinatura ativa na Kiwify
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscriptions = await this.listSubscriptions(userId);
      const hasActive = subscriptions.some((sub) => sub.status === 'active');

      logger.info('[Kiwify API] Verificação de assinatura ativa', {
        userId,
        hasActive,
        total: subscriptions.length,
      });

      return hasActive;
    } catch (error) {
      logger.error('[Kiwify API] Falha ao verificar assinatura', error);
      return false;
    }
  },

  /**
   * Consulta o status do token OAuth (para tela de diagnóstico interna)
   */
  async getTokenStatus(forceRefresh = false): Promise<{ valid: boolean; expiresAt: number | null }> {
    try {
      const { data, error } = await supabase.functions.invoke<InvokeEnvelope<{ token_valid: boolean; expires_at: number | null }>>('kiwify-api', {
        body: {
          action: 'oauth_status',
          force_refresh: forceRefresh,
        },
      });

      if (error) {
        logger.error('[Kiwify API] Erro ao consultar status do token', error);
        throw error;
      }

      const payload = unwrapData<{ token_valid: boolean; expires_at: number | null }>(data);
      return {
        valid: payload?.token_valid ?? false,
        expiresAt: payload?.expires_at ?? null,
      };
    } catch (error) {
      logger.error('[Kiwify API] Falha ao consultar status do token', error);
      throw new Error('Não foi possível verificar o status do token OAuth.');
    }
  },
};

export default kiwifyApiService;
