import React from 'react';
import { useAutoSyncSubscription } from '../hooks/useAutoSyncSubscription';

/**
 * Componente wrapper que executa auto-sync de assinatura ao fazer login
 * Deve ser montado dentro de AuthProvider e SubscriptionProvider
 */
export const AutoSyncWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Hook que sincroniza automaticamente a assinatura ao detectar login
  useAutoSyncSubscription();

  return <>{children}</>;
};
