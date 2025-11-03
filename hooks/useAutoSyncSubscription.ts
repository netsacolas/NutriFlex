import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

/**
 * Hook que sincroniza automaticamente a assinatura do usuário ao fazer login
 * Garante que compras recentes sejam detectadas e o plano Premium seja ativado
 */
export const useAutoSyncSubscription = () => {
  const { user } = useAuth();
  const hasSynced = useRef(false);

  useEffect(() => {
    const syncSubscription = async () => {
      // Verificar se já sincronizou nesta sessão (persiste entre reloads)
      const syncKey = user?.email ? `autosync_${user.email}` : null;
      const lastSync = syncKey ? sessionStorage.getItem(syncKey) : null;

      // Se já sincronizou nos últimos 5 minutos, não sincronizar novamente
      if (lastSync) {
        const lastSyncTime = parseInt(lastSync, 10);
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        if (lastSyncTime > fiveMinutesAgo) {
          console.log('[AutoSync] Sincronização já executada recentemente, pulando...');
          return;
        }
      }

      // Só sincroniza uma vez por sessão
      if (!user || !user.email || hasSynced.current) {
        return;
      }

      try {
        console.log('[AutoSync] Verificando assinatura para:', user.email);

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          console.warn('[AutoSync] Token não disponível');
          return;
        }

        // Chamar sync_manual para sincronizar compras recentes (últimas 48 horas)
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kiwify-api`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: 'sync_manual',
              emails: [user.email],
              since: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          console.log('[AutoSync] Sincronização concluída:', {
            assinaturas: result.result?.subscriptionsPersisted || 0,
            usuarios: result.result?.usersMatched || 0,
          });

          // Marcar como sincronizado para não executar novamente nesta sessão
          hasSynced.current = true;
          if (syncKey) {
            sessionStorage.setItem(syncKey, Date.now().toString());
          }

          // Se alguma assinatura foi atualizada, recarregar a página para atualizar o contexto
          if (result.result?.subscriptionsPersisted > 0) {
            console.log('[AutoSync] Plano atualizado! Recarregando contexto...');
            // Aguardar 1 segundo para garantir que o banco foi atualizado
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } else {
          console.warn('[AutoSync] Erro na sincronização:', result.error);
          // Marcar como sincronizado mesmo com erro para evitar loop
          hasSynced.current = true;
          if (syncKey) {
            sessionStorage.setItem(syncKey, Date.now().toString());
          }
        }
      } catch (error) {
        console.error('[AutoSync] Erro ao sincronizar:', error);
        // Marcar como sincronizado mesmo com erro para evitar loop
        hasSynced.current = true;
        if (syncKey) {
          sessionStorage.setItem(syncKey, Date.now().toString());
        }
      }
    };

    syncSubscription();
  }, [user]);
};
