/**
 * Utilitário para sincronização em background de dados
 * Permite guardar dados offline e sincronizar quando a conexão for restaurada
 */

import React from 'react';

// Tipos
interface SyncQueueItem {
  id: string;
  type: 'meal' | 'weight' | 'activity';
  data: any;
  timestamp: number;
  retries: number;
}

const SYNC_QUEUE_KEY = 'nutrimais_sync_queue';
const MAX_RETRIES = 3;

// ===== GERENCIAMENTO DA FILA DE SINCRONIZAÇÃO =====

export const addToSyncQueue = (type: SyncQueueItem['type'], data: any): void => {
  const queue = getSyncQueue();

  const item: SyncQueueItem = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
  };

  queue.push(item);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

  console.log(`📥 Adicionado à fila de sincronização: ${type}`, item);

  // Tentar registrar background sync se disponível
  registerBackgroundSync(type);
};

export const getSyncQueue = (): SyncQueueItem[] => {
  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Erro ao ler fila de sincronização:', error);
    return [];
  }
};

export const removeFromSyncQueue = (itemId: string): void => {
  const queue = getSyncQueue().filter(item => item.id !== itemId);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  console.log(`✅ Removido da fila: ${itemId}`);
};

export const incrementRetry = (itemId: string): void => {
  const queue = getSyncQueue();
  const item = queue.find(i => i.id === itemId);

  if (item) {
    item.retries += 1;

    // Remover se excedeu tentativas
    if (item.retries >= MAX_RETRIES) {
      console.error(`❌ Item falhou após ${MAX_RETRIES} tentativas:`, item);
      removeFromSyncQueue(itemId);
    } else {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      console.log(`🔄 Tentativa ${item.retries}/${MAX_RETRIES} para ${itemId}`);
    }
  }
};

// ===== REGISTRO DE BACKGROUND SYNC =====

export const registerBackgroundSync = async (tag: string): Promise<void> => {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.warn('⚠️ Background Sync não suportado neste navegador');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(`sync-${tag}-data`);
    console.log(`✅ Background Sync registrado: sync-${tag}-data`);
  } catch (error) {
    console.error('Erro ao registrar Background Sync:', error);
  }
};

// ===== SINCRONIZAÇÃO MANUAL =====

export const syncPendingData = async (): Promise<void> => {
  const queue = getSyncQueue();

  if (queue.length === 0) {
    console.log('✅ Nenhum dado pendente para sincronizar');
    return;
  }

  console.log(`🔄 Sincronizando ${queue.length} itens pendentes...`);

  // Processar cada item da fila
  for (const item of queue) {
    try {
      await syncItem(item);
      removeFromSyncQueue(item.id);
    } catch (error) {
      console.error(`Erro ao sincronizar ${item.id}:`, error);
      incrementRetry(item.id);
    }
  }

  const remainingQueue = getSyncQueue();
  if (remainingQueue.length === 0) {
    console.log('🎉 Sincronização completa!');
  } else {
    console.log(`⚠️ ${remainingQueue.length} itens falharam e serão tentados novamente`);
  }
};

// ===== SINCRONIZAR ITEM INDIVIDUAL =====

const syncItem = async (item: SyncQueueItem): Promise<void> => {
  console.log(`🔄 Sincronizando ${item.type}:`, item.data);

  switch (item.type) {
    case 'meal':
      await syncMeal(item.data);
      break;
    case 'weight':
      await syncWeight(item.data);
      break;
    case 'activity':
      await syncActivity(item.data);
      break;
    default:
      console.warn(`Tipo de sincronização desconhecido: ${item.type}`);
  }
};

// Funções de sincronização específicas (você deve implementar com suas APIs)
const syncMeal = async (data: any): Promise<void> => {
  // TODO: Implementar chamada real à API/Supabase
  // Exemplo:
  // const { data: result, error } = await supabase
  //   .from('meal_history')
  //   .insert(data);

  console.log('✅ Refeição sincronizada:', data);

  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 500));
};

const syncWeight = async (data: any): Promise<void> => {
  console.log('✅ Peso sincronizado:', data);
  await new Promise(resolve => setTimeout(resolve, 500));
};

const syncActivity = async (data: any): Promise<void> => {
  console.log('✅ Atividade sincronizada:', data);
  await new Promise(resolve => setTimeout(resolve, 500));
};

// ===== UTILITÁRIO DE STATUS DE CONEXÃO =====

export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve();
    } else {
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline);
        resolve();
      };
      window.addEventListener('online', handleOnline);
    }
  });
};

// ===== INICIALIZAÇÃO AUTOMÁTICA =====

export const initBackgroundSync = (): void => {
  console.log('🚀 Inicializando sistema de sincronização em background...');

  // Sincronizar ao ficar online
  window.addEventListener('online', async () => {
    console.log('📡 Conexão restaurada! Sincronizando dados pendentes...');
    await syncPendingData();
  });

  // Sincronizar ao carregar a página (se online)
  if (navigator.onLine) {
    syncPendingData();
  }

  // Sincronizar periodicamente (a cada 5 minutos se online)
  setInterval(() => {
    if (navigator.onLine) {
      syncPendingData();
    }
  }, 5 * 60 * 1000);

  console.log('✅ Sistema de sincronização inicializado');
};

// ===== HOOK REACT PARA USAR NO COMPONENTE =====

export const useBackgroundSync = () => {
  const [pendingCount, setPendingCount] = React.useState(0);
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    // Atualizar contagem de pendentes
    const updatePendingCount = () => {
      setPendingCount(getSyncQueue().length);
    };

    updatePendingCount();

    // Listener para mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SYNC_QUEUE_KEY) {
        updatePendingCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Verificar periodicamente
    const interval = setInterval(updatePendingCount, 10000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const sync = async () => {
    setIsSyncing(true);
    try {
      await syncPendingData();
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    pendingCount,
    isSyncing,
    sync,
    addToQueue: addToSyncQueue,
    isOnline: isOnline(),
  };
};

// ===== COMPONENTE DE STATUS DE SINCRONIZAÇÃO =====

export const SyncStatusBadge: React.FC = () => {
  const { pendingCount, isSyncing, sync } = useBackgroundSync();

  if (pendingCount === 0 && !isSyncing) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <button
        onClick={sync}
        disabled={isSyncing}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-white text-sm font-medium
          transition-all duration-300
          ${isSyncing
            ? 'bg-blue-500 cursor-wait'
            : 'bg-orange-500 hover:bg-orange-600 cursor-pointer'}
        `}
      >
        {isSyncing ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Sincronizando...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>{pendingCount} pendente{pendingCount !== 1 ? 's' : ''}</span>
          </>
        )}
      </button>
    </div>
  );
};

// Exportar tudo
export default {
  addToSyncQueue,
  getSyncQueue,
  syncPendingData,
  initBackgroundSync,
  useBackgroundSync,
  SyncStatusBadge,
  isOnline,
  waitForOnline,
};
