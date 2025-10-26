// Service Worker do NutriMais AI
// Versão 1.0.0

const CACHE_NAME = 'nutrimais-v1';
const RUNTIME_CACHE = 'nutrimais-runtime-v1';
const IMAGE_CACHE = 'nutrimais-images-v1';

// Recursos essenciais para cache (Cache First)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Padrões de URL que devem funcionar offline
const CACHE_PATTERNS = {
  static: /\.(js|css|woff2?|ttf|eot|svg)$/,
  images: /\.(png|jpg|jpeg|gif|webp|ico)$/,
  api: /\/api\//,
};

// === INSTALAÇÃO ===
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker v1.0.0...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Fazendo cache dos recursos essenciais');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Service Worker instalado com sucesso!');
        return self.skipWaiting(); // Ativar imediatamente
      })
  );
});

// === ATIVAÇÃO ===
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Remover caches antigos
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== CACHE_NAME &&
                     name !== RUNTIME_CACHE &&
                     name !== IMAGE_CACHE;
            })
            .map((name) => {
              console.log('[SW] Removendo cache antigo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado!');
        return self.clients.claim(); // Controlar todas as páginas imediatamente
      })
  );
});

// === ESTRATÉGIAS DE CACHE ===

// 1. Cache First (para recursos estáticos)
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    console.log('[SW] Cache HIT:', request.url);
    return cached;
  }

  console.log('[SW] Cache MISS, buscando da rede:', request.url);
  try {
    const response = await fetch(request);
    // Cachear apenas respostas válidas
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Erro ao buscar da rede:', error);
    throw error;
  }
}

// 2. Network First (para API/dados dinâmicos)
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    console.log('[SW] Buscando da REDE:', request.url);
    const response = await fetch(request);

    // Cachear resposta bem-sucedida
    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Rede falhou, tentando cache:', request.url);
    const cached = await cache.match(request);

    if (cached) {
      console.log('[SW] Retornando do cache (offline)');
      return cached;
    }

    // Se não há cache, retornar erro offline
    console.error('[SW] Sem cache disponível para:', request.url);
    return new Response(
      JSON.stringify({
        error: 'Sem conexão com a internet',
        offline: true,
        message: 'Esta funcionalidade precisa de internet. Por favor, conecte-se e tente novamente.'
      }),
      {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 3. Stale While Revalidate (para imagens)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  // Buscar da rede em background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  // Retornar cache imediatamente se disponível, senão esperar rede
  return cached || fetchPromise;
}

// === FETCH (INTERCEPTAR REQUISIÇÕES) ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições non-GET e cross-origin (exceto APIs conhecidas)
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar chrome-extension e outras URLs especiais
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // === DECISÃO DE ESTRATÉGIA ===

  // 1. Gemini API e Supabase: Network First (precisa de dados frescos)
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 2. Imagens: Stale While Revalidate
  if (CACHE_PATTERNS.images.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 3. Assets estáticos (JS, CSS, fonts): Cache First
  if (CACHE_PATTERNS.static.test(url.pathname) || url.pathname.includes('/icons/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 4. HTML e navegação: Network First com fallback
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      networkFirst(request).catch(async () => {
        // Se offline, retornar index.html do cache
        const cache = await caches.open(CACHE_NAME);
        return cache.match('/index.html');
      })
    );
    return;
  }

  // 5. Default: Network First
  event.respondWith(networkFirst(request));
});

// === SINCRONIZAÇÃO EM BACKGROUND ===
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-meal-data') {
    event.waitUntil(syncMealData());
  } else if (event.tag === 'sync-weight-data') {
    event.waitUntil(syncWeightData());
  } else if (event.tag === 'sync-activity-data') {
    event.waitUntil(syncActivityData());
  }
});

async function syncMealData() {
  console.log('[SW] Sincronizando dados de refeições...');
  // Implementar sincronização de dados pendentes
  // Por enquanto, apenas log
  return Promise.resolve();
}

async function syncWeightData() {
  console.log('[SW] Sincronizando dados de peso...');
  return Promise.resolve();
}

async function syncActivityData() {
  console.log('[SW] Sincronizando dados de atividades...');
  return Promise.resolve();
}

// === NOTIFICAÇÕES PUSH (futuro) ===
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);

  const options = {
    body: event.data ? event.data.text() : 'Nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('NutriMais AI', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event.action);
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// === MENSAGENS DO CLIENTE ===
self.addEventListener('message', (event) => {
  console.log('[SW] Mensagem recebida:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }

  // Responder ao cliente
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});

console.log('[SW] Service Worker carregado e pronto!');
