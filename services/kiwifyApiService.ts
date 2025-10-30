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

interface KiwifyApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Serviço para comunicação segura com a API Kiwify através da Edge Function
 *
 * SEGURANÇA:
 * - Credenciais Kiwify ficam APENAS no Supabase Secrets Vault
 * - Frontend nunca acessa diretamente a API Kiwify
 * - Todas as chamadas passam pela Edge Function `kiwify-api`
 */
export const kiwifyApiService = {
  /**
   * Lista assinaturas ativas do usuário na Kiwify
   */
  async listSubscriptions(userId: string): Promise<KiwifySubscription[]> {
    try {
      logger.info('[Kiwify API] Listando assinaturas', { userId });

      const { data, error } = await supabase.functions.invoke<KiwifySubscription[]>('kiwify-api', {
        body: {
          action: 'list_subscriptions',
          user_id: userId,
        },
      });

      if (error) {
        logger.error('[Kiwify API] Erro ao listar assinaturas', error);
        throw error;
      }

      logger.info('[Kiwify API] Assinaturas listadas', { count: data?.length || 0 });
      return data || [];
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

      const { data, error } = await supabase.functions.invoke<KiwifySubscription>('kiwify-api', {
        body: {
          action: 'get_subscription',
          subscription_id: subscriptionId,
        },
      });

      if (error) {
        logger.error('[Kiwify API] Erro ao obter assinatura', error);
        throw error;
      }

      if (!data) {
        throw new Error('Assinatura não encontrada');
      }

      logger.info('[Kiwify API] Assinatura obtida', { status: data.status });
      return data;
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

      const { data, error } = await supabase.functions.invoke<{ success: boolean; message: string }>('kiwify-api', {
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

      if (!data?.success) {
        throw new Error(data?.message || 'Falha ao cancelar assinatura');
      }

      logger.info('[Kiwify API] Assinatura cancelada com sucesso');
    } catch (error) {
      logger.error('[Kiwify API] Falha ao cancelar assinatura', error);

      if (error instanceof Error) {
        if (error.message.includes('unauthorized')) {
          throw new Error('Você não tem permissão para cancelar esta assinatura.');
        }
        throw error;
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

      const { data, error } = await supabase.functions.invoke<{ success: boolean; message: string }>('kiwify-api', {
        body: {
          action: 'sync_subscription',
          user_id: userId,
        },
      });

      if (error) {
        logger.error('[Kiwify API] Erro ao sincronizar', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.message || 'Falha ao sincronizar');
      }

      logger.info('[Kiwify API] Sincronização concluída');
    } catch (error) {
      logger.error('[Kiwify API] Falha ao sincronizar', error);
      // Não lançar erro - sincronização é background task
      // O usuário não precisa saber se falhou
    }
  },

  /**
   * Verifica se o usuário tem uma assinatura ativa na Kiwify
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscriptions = await this.listSubscriptions(userId);
      const hasActive = subscriptions.some(sub => sub.status === 'active');

      logger.info('[Kiwify API] Verificação de assinatura ativa', {
        userId,
        hasActive,
        total: subscriptions.length
      });

      return hasActive;
    } catch (error) {
      logger.error('[Kiwify API] Falha ao verificar assinatura', error);
      return false;
    }
  },
};

export default kiwifyApiService;
