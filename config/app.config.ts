// Configuração da aplicação NutriMais AI
export const APP_CONFIG = {
  // Domínio principal
  domain: 'https://nutrimais.app',

  // URLs da aplicação
  urls: {
    base: 'https://nutrimais.app',
    app: 'https://nutrimais.app',
    api: 'https://api.nutrimais.app', // Se tiver API separada
    landing: 'https://nutrimais.app',
    blog: 'https://blog.nutrimais.app', // Se tiver blog
  },

  // Configurações de Email
  email: {
    support: 'suporte@nutrimais.app',
    noreply: 'noreply@nutrimais.app',
    contact: 'contato@nutrimais.app',
  },

  // Metadados da aplicação
  meta: {
    name: 'NutriMais AI',
    shortName: 'NutriMais',
    description: 'Planejador nutricional inteligente com IA - Você escolhe os alimentos, nossa IA calcula as porções perfeitas',
    keywords: 'nutrição, dieta, alimentação saudável, inteligência artificial, planejamento nutricional, calorias, macronutrientes',
    author: 'NutriMais AI Team',
    themeColor: '#ff6b35',
    backgroundColor: '#ffffff',
  },

  // Configurações de Autenticação
  auth: {
    // URLs de redirecionamento após ações de autenticação
    redirects: {
      afterSignIn: '/home',
      afterSignUp: '/welcome',
      afterSignOut: '/',
      afterPasswordReset: '/login',
      afterEmailConfirmation: '/home',
    },

    // Configurações de sessão
    session: {
      // Tempo de expiração em minutos
      expirationTime: 60 * 24 * 7, // 7 dias
      // Renovação automática
      autoRefresh: true,
    },
  },

  // Configurações de Planos e Preços
  pricing: {
    currency: 'BRL',
    plans: {
      free: {
        name: 'Gratuito',
        price: 0,
        features: {
          mealsPerDay: 2,
          historyLimit: 6,
          aiAssistant: false,
          reports: 'basic',
        },
      },
      monthly: {
        name: 'Mensal',
        price: 19.90,
        features: {
          mealsPerDay: -1, // ilimitado
          historyLimit: -1,
          aiAssistant: true,
          reports: 'complete',
        },
      },
      quarterly: {
        name: 'Trimestral',
        price: 49.90,
        months: 3,
        discount: 16,
        features: {
          mealsPerDay: -1,
          historyLimit: -1,
          aiAssistant: true,
          reports: 'complete',
        },
      },
      yearly: {
        name: 'Anual',
        price: 179.90,
        months: 12,
        discount: 25,
        features: {
          mealsPerDay: -1,
          historyLimit: -1,
          aiAssistant: true,
          reports: 'complete',
        },
      },
    },
  },

  // Configurações de Social Media
  social: {
    instagram: 'https://instagram.com/nutrimaisai',
    facebook: 'https://facebook.com/nutrimaisai',
    twitter: 'https://twitter.com/nutrimaisai',
    linkedin: 'https://linkedin.com/company/nutrimais-ai',
    youtube: 'https://youtube.com/@nutrimaisai',
  },

  // Configurações de Analytics (se usar)
  analytics: {
    googleAnalyticsId: '', // Adicionar quando configurar
    facebookPixelId: '', // Adicionar quando configurar
    hotjarId: '', // Adicionar quando configurar
  },

  // Configurações de Recursos
  features: {
    // Feature flags para habilitar/desabilitar recursos
    enablePWA: true,
    enableNotifications: true,
    enableOfflineMode: true,
    enableBetaFeatures: false,
    enableMaintenanceMode: false,
  },

  // Mensagens do Sistema
  messages: {
    maintenance: 'Estamos realizando melhorias no sistema. Voltamos em breve!',
    emailConfirmation: 'Por favor, confirme seu email para acessar todos os recursos.',
    trialEnded: 'Seu período de teste terminou. Faça upgrade para continuar usando todos os recursos.',
  },

  // Configurações de API
  api: {
    timeout: 30000, // 30 segundos
    retryAttempts: 3,
    retryDelay: 1000, // 1 segundo
  },

  // Versão da aplicação
  version: '1.0.0',

  // Ambiente
  environment: import.meta.env.MODE || 'production',
};

// Função helper para obter URL completa
export function getFullUrl(path: string): string {
  const baseUrl = APP_CONFIG.domain;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Função helper para verificar se é ambiente de desenvolvimento
export function isDevelopment(): boolean {
  return APP_CONFIG.environment === 'development';
}

// Função helper para verificar se é ambiente de produção
export function isProduction(): boolean {
  return APP_CONFIG.environment === 'production';
}

// Export default para facilitar importação
export default APP_CONFIG;