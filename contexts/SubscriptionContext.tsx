import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import type {
  PlanTierDefinition,
  SubscriptionPlan,
  SubscriptionRecord
} from '../types';
import { useAuth } from './AuthContext';
import { subscriptionService } from '../services/subscriptionService';
import logger from '../utils/logger';

interface SubscriptionContextValue {
  subscription: SubscriptionRecord | null;
  plan: PlanTierDefinition;
  isLoading: boolean;
  isPremium: boolean;
  limits: PlanTierDefinition['limits'];
  refresh: () => Promise<void>;
  openCheckout: (plan: SubscriptionPlan) => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export const useSubscription = (): SubscriptionContextValue => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription deve ser usado dentro de SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const plan = useMemo<PlanTierDefinition>(() => {
    if (!subscription) {
      return subscriptionService.getPlanDefinition('free');
    }
    if (subscription.status !== 'active') {
      return subscriptionService.getPlanDefinition('free');
    }
    return subscriptionService.getPlanDefinition(subscription.plan);
  }, [subscription]);

  const isPremium = plan.id !== 'free';
  const limits = plan.limits;

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      return;
    }

    setIsLoading(true);
    try {
      await subscriptionService.ensureSubscriptionRecord(user.id);
      const record = await subscriptionService.getCurrentSubscription();
      setSubscription(record);
    } catch (error) {
      logger.error('Falha ao carregar assinatura', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscriptionService.listenSubscriptionChanges(user.id, (record) => {
      setSubscription(record);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const openCheckout = useCallback(
    (planId: SubscriptionPlan) => {
      if (!user) {
        logger.warn('Usuario nao autenticado tentou acessar checkout');
        return;
      }

      if (planId === 'free') {
        logger.warn('Tentativa de abrir checkout para plano gratuito');
        return;
      }

      logger.info('Iniciando checkout', { planId, userId: user.id, email: user.email });

      const url = subscriptionService.getCheckoutUrl(planId, user.id, user.email ?? undefined);

      if (!url) {
        logger.error('URL de checkout nao gerada', { planId });
        alert('Erro ao abrir checkout. Por favor, tente novamente ou entre em contato com o suporte.');
        return;
      }

      logger.info('Redirecionando para checkout', { url });
      window.location.href = url;
    },
    [user]
  );

  const value = useMemo<SubscriptionContextValue>(() => ({
    subscription,
    plan,
    isLoading,
    isPremium,
    limits,
    refresh: fetchSubscription,
    openCheckout
  }), [fetchSubscription, isLoading, isPremium, limits, openCheckout, plan, subscription]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
