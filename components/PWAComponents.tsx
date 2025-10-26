import React, { useState, useEffect } from 'react';

// ===== DETECTOR DE STATUS OFFLINE/ONLINE =====
export const OfflineDetector: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ Conexão restaurada!');
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000); // Esconder após 3s
    };

    const handleOffline = () => {
      console.log('⚠️ Sem conexão com a internet');
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-white shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
          : 'bg-gradient-to-r from-orange-500 to-red-600'
      }`}
      style={{ animation: 'slideDown 0.3s ease-out' }}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">Conexão restaurada!</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">
              Você está offline - Algumas funcionalidades podem estar limitadas
            </span>
          </>
        )}
      </div>
    </div>
  );
};

// ===== PROMPT DE INSTALAÇÃO DO PWA =====
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detectar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;

    if (isStandalone || isIOSStandalone) {
      console.log('✅ App já está instalado!');
      return;
    }

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Mostrar prompt após 5 segundos (dar tempo do usuário explorar)
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      console.log('📲 Prompt de instalação capturado');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar quando app foi instalado
    window.addEventListener('appinstalled', () => {
      console.log('🎉 App instalado com sucesso!');
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar prompt de instalação nativo
    deferredPrompt.prompt();

    // Esperar escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ Usuário aceitou instalar o app');
    } else {
      console.log('❌ Usuário recusou instalar o app');
    }

    // Limpar prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Mostrar novamente em 7 dias
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa_install_dismissed', (Date.now() + sevenDays).toString());
  };

  // Verificar se foi dismissado recentemente
  useEffect(() => {
    const dismissedUntil = localStorage.getItem('pwa_install_dismissed');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
      setShowPrompt(false);
    }
  }, []);

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slideUp"
      style={{ animation: 'slideUp 0.5s ease-out' }}
    >
      <div className="bg-gradient-to-r from-orange-500 to-coral-500 text-white rounded-2xl shadow-2xl p-5 relative">
        {/* Botão fechar */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Conteúdo */}
        <div className="flex items-start gap-4 pr-6">
          {/* Ícone */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">🍎</span>
            </div>
          </div>

          {/* Texto */}
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Instale o NutriMais AI</h3>
            <p className="text-white/90 text-sm mb-4">
              Adicione à tela inicial para acesso rápido e funcione mesmo offline!
            </p>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-white text-orange-600 font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Instalar App
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-white/90 hover:text-white font-medium transition-colors"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>

        {/* Benefícios */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <ul className="space-y-1.5 text-xs text-white/90">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Funciona offline após primeira visita</span>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Carrega 3x mais rápido que um site normal</span>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Aparece como app na tela inicial</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// ===== INDICADOR DE ATUALIZAÇÃO DISPONÍVEL =====
export const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // Checar atualizações a cada 1 hora
      setInterval(() => {
        reg.update();
      }, 60 * 60 * 1000);

      // Detectar nova versão instalada
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowUpdate(true);
          }
        });
      });
    });
  }, []);

  const handleUpdate = () => {
    if (!registration || !registration.waiting) return;

    // Avisar o SW para pular a espera
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Recarregar página quando novo SW assumir controle
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-slideDown">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-1">Nova Atualização!</h4>
            <p className="text-sm text-white/90 mb-3">
              Uma nova versão está disponível com melhorias e correções.
            </p>
            <button
              onClick={handleUpdate}
              className="w-full bg-white text-blue-600 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Atualizar Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL QUE AGRUPA TUDO =====
export const PWAManager: React.FC = () => {
  return (
    <>
      <OfflineDetector />
      <InstallPrompt />
      <UpdateNotification />
    </>
  );
};

// Estilos de animação (adicionar ao index.html ou CSS global)
export const PWAStyles = `
@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slideDown {
  animation: slideDown 0.3s ease-out;
}

.animate-slideUp {
  animation: slideUp 0.5s ease-out;
}
`;
