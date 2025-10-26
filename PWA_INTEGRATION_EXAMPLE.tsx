/**
 * EXEMPLO DE INTEGRAÇÃO - PWA Components no App.tsx
 *
 * Este arquivo mostra como integrar os componentes PWA no seu App.tsx principal.
 * Copie e cole as partes relevantes no seu arquivo App.tsx existente.
 */

import React, { useEffect, useState } from 'react';
import { PWAManager } from './components/PWAComponents';
import { initBackgroundSync, SyncStatusBadge } from './utils/backgroundSync';

// ===== EXEMPLO COMPLETO =====
function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar sistema de sincronização em background
  useEffect(() => {
    console.log('🚀 Iniciando PWA...');
    initBackgroundSync();

    // Detectar se app foi instalado
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) {
      console.log('✅ Executando como app instalado');
    }
  }, []);

  // Detectar quando usuário fica offline/online
  useEffect(() => {
    const handleOnline = () => {
      console.log('📡 Conexão restaurada!');
      // Opcional: Mostrar toast de sucesso
    };

    const handleOffline = () => {
      console.log('⚠️ Você está offline');
      // Opcional: Mostrar aviso ao usuário
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="app">
      {/*
        PWAManager inclui:
        - OfflineDetector (banner offline/online)
        - InstallPrompt (prompt de instalação)
        - UpdateNotification (notificação de updates)
      */}
      <PWAManager />

      {/*
        SyncStatusBadge mostra quantos itens estão pendentes para sincronizar
        Aparece apenas quando há itens na fila
      */}
      <SyncStatusBadge />

      {/* Seu conteúdo principal */}
      <main>
        {/* ... resto do seu app ... */}
      </main>
    </div>
  );
}

export default App;

// ===== EXEMPLO DE USO DO HOOK DE SINCRONIZAÇÃO =====

import { useBackgroundSync, addToSyncQueue } from './utils/backgroundSync';

function MealForm() {
  const { pendingCount, isSyncing, sync, isOnline } = useBackgroundSync();

  const handleSaveMeal = async (mealData) => {
    if (isOnline) {
      // Online: Salvar diretamente
      try {
        await saveMealToDatabase(mealData);
        console.log('✅ Refeição salva!');
      } catch (error) {
        console.error('Erro ao salvar:', error);
        // Se falhar, adicionar à fila
        addToSyncQueue('meal', mealData);
      }
    } else {
      // Offline: Adicionar à fila de sincronização
      console.log('📥 Offline - Adicionando à fila de sincronização');
      addToSyncQueue('meal', mealData);
      alert('Você está offline. A refeição será sincronizada quando a conexão voltar.');
    }
  };

  return (
    <div>
      <h2>Nova Refeição</h2>

      {/* Indicador de status */}
      {!isOnline && (
        <div className="offline-warning">
          ⚠️ Você está offline. Dados serão sincronizados quando a conexão voltar.
        </div>
      )}

      {pendingCount > 0 && (
        <div className="pending-sync">
          🔄 {pendingCount} item(ns) aguardando sincronização
          <button onClick={sync} disabled={isSyncing}>
            {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
          </button>
        </div>
      )}

      {/* Seu formulário... */}
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSaveMeal({ /* dados */ });
      }}>
        {/* ... campos do formulário ... */}
      </form>
    </div>
  );
}

// ===== EXEMPLO DE INTEGRAÇÃO COM SUPABASE =====

import { supabase } from './services/supabaseClient';
import { addToSyncQueue, isOnline } from './utils/backgroundSync';

async function saveMealWithOfflineSupport(mealData) {
  // Verificar se está online
  if (!isOnline()) {
    console.log('📥 Offline - Salvando na fila');
    addToSyncQueue('meal', mealData);

    // Opcional: Salvar no localStorage também
    const localMeals = JSON.parse(localStorage.getItem('local_meals') || '[]');
    localMeals.push({ ...mealData, local: true, timestamp: Date.now() });
    localStorage.setItem('local_meals', JSON.stringify(localMeals));

    return { success: true, offline: true };
  }

  // Online: Salvar no Supabase
  try {
    const { data, error } = await supabase
      .from('meal_history')
      .insert(mealData);

    if (error) throw error;

    console.log('✅ Refeição salva no servidor');
    return { success: true, data };

  } catch (error) {
    console.error('Erro ao salvar:', error);

    // Se falhar, adicionar à fila
    addToSyncQueue('meal', mealData);

    return { success: false, error, queued: true };
  }
}

// ===== EXEMPLO DE DETECÇÃO DE INSTALAÇÃO =====

function InstallationTracker() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar se já está instalado
    const checkInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const iOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(standalone || iOSStandalone);
    };

    checkInstalled();

    // Listener para quando app é instalado
    window.addEventListener('appinstalled', () => {
      console.log('🎉 App instalado com sucesso!');
      setIsInstalled(true);

      // Opcional: Enviar analytics
      // gtag('event', 'pwa_installed');

      // Opcional: Mostrar mensagem de boas-vindas
      alert('Obrigado por instalar o NutriMais AI! 🎉');
    });

  }, []);

  return (
    <div>
      {isInstalled ? (
        <span className="badge">✅ Instalado</span>
      ) : (
        <span className="badge">🌐 Web</span>
      )}
    </div>
  );
}

// ===== EXEMPLO DE AÇÕES BASEADAS EM SHORTCUTS =====

function handleShortcuts() {
  useEffect(() => {
    // Detectar se app foi aberto via shortcut
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');

    switch (action) {
      case 'new-meal':
        console.log('📱 Aberto via shortcut: Nova Refeição');
        // Navegar para tela de nova refeição
        // navigate('/nova-refeicao');
        break;

      case 'history':
        console.log('📱 Aberto via shortcut: Histórico');
        // Abrir modal de histórico
        // setShowHistoryModal(true);
        break;

      case 'chat':
        console.log('📱 Aberto via shortcut: Chat IA');
        // Abrir chat nutricional
        // setShowChatModal(true);
        break;
    }
  }, []);
}

// ===== EXEMPLO DE NOTIFICAÇÕES PUSH (FUTURO) =====

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('⚠️ Notificações não suportadas');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

async function subscribeToNotifications() {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    console.log('❌ Permissão de notificação negada');
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  // Implementar subscribe com VAPID keys (futuro)
  console.log('✅ Pronto para receber notificações push');
}

// ===== EXEMPLO DE CACHE MANUAL =====

async function cacheUserData(userData) {
  if (!('caches' in window)) return;

  try {
    const cache = await caches.open('nutrimais-user-data');
    const response = new Response(JSON.stringify(userData));
    await cache.put('/user/profile', response);
    console.log('✅ Dados do usuário cacheados');
  } catch (error) {
    console.error('Erro ao cachear:', error);
  }
}

async function getCachedUserData() {
  if (!('caches' in window)) return null;

  try {
    const cache = await caches.open('nutrimais-user-data');
    const response = await cache.match('/user/profile');
    if (response) {
      const data = await response.json();
      console.log('✅ Dados carregados do cache');
      return data;
    }
  } catch (error) {
    console.error('Erro ao ler cache:', error);
  }

  return null;
}

// ===== EXPORTAR PARA USO =====
export {
  App,
  MealForm,
  InstallationTracker,
  handleShortcuts,
  saveMealWithOfflineSupport,
  requestNotificationPermission,
  subscribeToNotifications,
  cacheUserData,
  getCachedUserData,
};
