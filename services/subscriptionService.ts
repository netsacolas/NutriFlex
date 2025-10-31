import { supabase } from './supabaseClient';
import logger from '../utils/logger';
import type {
  PlanTierDefinition,
  SubscriptionPlan,
  SubscriptionRecord
} from '../types';

const isE2EMock = import.meta.env.VITE_E2E_MOCK === 'true';

const planDefinitions: Record<SubscriptionPlan, PlanTierDefinition> = {
  free: {
    id: 'free',
    name: 'Plano Gratis',
    priceLabel: 'R$ 0,00',
    priceCents: 0,
    billingPeriod: 'lifetime',
    features: [
      'Planejamento inteligente de refeicoes',
      'Historico com ultimos 5 registros',
      'Recalcular com IA no painel de saude'
    ],
    limits: {
      maxMealsPerDay: 2,
      historyItems: 5,
      aiChatEnabled: false
    }
  },
  premium_monthly: {
    id: 'premium_monthly',
    name: 'Plano Mensal',
    priceLabel: 'R$ 19,90/mês',
    priceCents: 1990,
    billingPeriod: 'monthly',
    features: [
      'Refeições ilimitadas por dia',
      'Histórico completo sem restrições',
      'Assistente de IA completo com chat',
      'Análises nutricionais detalhadas',
      'Relatórios personalizados',
      'Suporte prioritário'
    ],
    limits: {
      maxMealsPerDay: null,
      historyItems: null,
      aiChatEnabled: true
    }
  },
  premium_quarterly: {
    id: 'premium_quarterly',
    name: 'Plano Trimestral',
    priceLabel: 'R$ 49,90/trimestre',
    priceCents: 4990,
    billingPeriod: 'quarterly',
    features: [
      'Todos os recursos do plano Mensal',
      'Economia de 16% vs. plano mensal',
      'Acesso a recursos beta',
      'Renovação automática trimestral',
      'Garantia de satisfação'
    ],
    limits: {
      maxMealsPerDay: null,
      historyItems: null,
      aiChatEnabled: true
    }
  },
  premium_annual: {
    id: 'premium_annual',
    name: 'Plano Anual',
    priceLabel: 'R$ 179,90/ano',
    priceCents: 17990,
    billingPeriod: 'annual',
    features: [
      'Todos os recursos do plano Mensal',
      'Economia de 25% vs. plano mensal',
      'Acesso prioritário a novidades',
      'Relatórios históricos avançados',
      'Melhor custo-benefício'
    ],
    limits: {
      maxMealsPerDay: null,
      historyItems: null,
      aiChatEnabled: true
    }
  }
};

const checkoutUrls: Partial<Record<Exclude<SubscriptionPlan, 'free'>, string>> = {
  premium_monthly: import.meta.env.VITE_KIWIFY_CHECKOUT_MONTHLY || 'https://pay.kiwify.com.br/uJP288j',
  premium_quarterly: import.meta.env.VITE_KIWIFY_CHECKOUT_QUARTERLY || 'https://pay.kiwify.com.br/Omg0hAs',
  premium_annual: import.meta.env.VITE_KIWIFY_CHECKOUT_ANNUAL || 'https://pay.kiwify.com.br/mHorNkF'
};

const mockSubscription: SubscriptionRecord = {
  id: 'mock-subscription',
  user_id: 'mock-user',
  plan: 'free',
  status: 'active',
  current_period_start: new Date().toISOString(),
  current_period_end: null,
  kiwify_order_id: null,
  kiwify_subscription_id: null,
  kiwify_plan_id: null,
  last_event_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const getPlanDefinition = (plan: SubscriptionPlan): PlanTierDefinition => {
  return planDefinitions[plan] ?? planDefinitions.free;
};

export const subscriptionService = {
  getPlanDefinition,

  getPlanList(): PlanTierDefinition[] {
    return [
      planDefinitions.free,
      planDefinitions.premium_monthly,
      planDefinitions.premium_quarterly,
      planDefinitions.premium_annual
    ];
  },

  getCheckoutUrl(plan: SubscriptionPlan, userId: string, email?: string): string | null {
    if (plan === 'free') {
      logger.warn('Tentativa de checkout para plano gratuito');
      return null;
    }

    if (isE2EMock) {
      return `https://checkout.mock/kiwify/${plan}?user=${userId}`;
    }

    const baseUrl = checkoutUrls[plan];
    logger.debug('Gerando URL de checkout', {
      plan,
      baseUrl,
      hasBaseUrl: !!baseUrl,
      envVars: {
        monthly: import.meta.env.VITE_KIWIFY_CHECKOUT_MONTHLY,
        quarterly: import.meta.env.VITE_KIWIFY_CHECKOUT_QUARTERLY,
        annual: import.meta.env.VITE_KIWIFY_CHECKOUT_ANNUAL
      }
    });

    if (!baseUrl) {
      logger.error('Kiwify checkout URL missing for plan', {
        plan,
        availableUrls: Object.keys(checkoutUrls),
        checkoutUrls
      });
      return null;
    }

    const url = new URL(baseUrl);
    url.searchParams.set('external_id', userId);
    if (email) {
      url.searchParams.set('email', email);
    }
    url.searchParams.set('source', 'nutrimais-app');

    const finalUrl = url.toString();
    logger.info('URL de checkout gerada', { plan, finalUrl });
    return finalUrl;
  },

  async ensureSubscriptionRecord(userId: string): Promise<void> {
    if (isE2EMock) {
      return;
    }

    try {
      const { error } = await supabase
        .from<SubscriptionRecord>('user_subscriptions')
        .insert({
          user_id: userId,
          plan: 'free',
          status: 'active',
          current_period_start: new Date().toISOString()
        } as Partial<SubscriptionRecord>)
        .select()
        .single();

      if (error && error.code !== '23505') {
        logger.warn('Unable to ensure subscription record', error);
      }
    } catch (error) {
      logger.error('ensureSubscriptionRecord failed', error);
    }
  },

  async getCurrentSubscription(): Promise<SubscriptionRecord | null> {
    if (isE2EMock) {
      return mockSubscription;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from<SubscriptionRecord>('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('Failed to fetch subscription', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('getCurrentSubscription failed', error);
      return null;
    }
  },

  listenSubscriptionChanges(userId: string, onChange: (record: SubscriptionRecord) => void) {
    if (isE2EMock) {
      return () => undefined;
    }

    const channel = supabase
      .channel(`subscription:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const record = payload.new as SubscriptionRecord;
          onChange(record);
        }
      )
      .subscribe((status) => {
        logger.debug('Subscription channel status', { status });
      });

    return () => {
      void channel.unsubscribe();
    };
  },

  /**
   * Calcula quantos dias faltam para o vencimento da assinatura
   */
  getDaysRemaining(subscription: SubscriptionRecord | null): number | null {
    if (!subscription || !subscription.current_period_end || subscription.status !== 'active') {
      return null;
    }

    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  },

  /**
   * Verifica se a assinatura expira em breve (3 dias ou menos)
   */
  isExpiringSoon(subscription: SubscriptionRecord | null): boolean {
    const daysRemaining = this.getDaysRemaining(subscription);
    if (daysRemaining === null) {
      return false;
    }
    return daysRemaining <= 3 && daysRemaining > 0;
  },

  /**
   * Verifica se a assinatura está expirada
   */
  isExpired(subscription: SubscriptionRecord | null): boolean {
    if (!subscription || !subscription.current_period_end) {
      return false;
    }

    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    return endDate < now && subscription.status === 'active';
  },

  /**
   * Busca histórico de pagamentos do usuário
   */
  async getPaymentHistory(limit: number = 10): Promise<any[]> {
    if (isE2EMock) {
      return [];
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('paid_at', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to fetch payment history', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('getPaymentHistory failed', error);
      return [];
    }
  },

  /**
   * Formata data de vencimento para exibição
   */
  formatExpirationDate(subscription: SubscriptionRecord | null): string | null {
    if (!subscription || !subscription.current_period_end) {
      return null;
    }

    try {
      return new Date(subscription.current_period_end).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  },

  /**
   * Retorna mensagem de status da assinatura
   */
  getSubscriptionStatusMessage(subscription: SubscriptionRecord | null): string {
    if (!subscription) {
      return 'Plano Grátis';
    }

    if (subscription.plan === 'free') {
      return 'Plano Grátis';
    }

    if (this.isExpired(subscription)) {
      return 'Assinatura expirada - Renovação necessária';
    }

    const daysRemaining = this.getDaysRemaining(subscription);
    if (daysRemaining === null) {
      return 'Plano Premium Ativo';
    }

    if (this.isExpiringSoon(subscription)) {
      return `Expira em ${daysRemaining} dia${daysRemaining === 1 ? '' : 's'} - Renove agora!`;
    }

    return `Válido por mais ${daysRemaining} dias`;
  }
};
