import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Plugin para adicionar headers de segurança HTTP
 * Implementa as principais recomendações do OWASP
 */
function securityHeadersPlugin(): Plugin {
  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        // Content Security Policy (CSP) - Previne XSS
        res.setHeader(
          'Content-Security-Policy',
          [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://aistudiocdn.com https://cdn.tailwindcss.com https://esm.sh",
            "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; ')
        );

        // X-Frame-Options - Previne Clickjacking
        res.setHeader('X-Frame-Options', 'DENY');

        // X-Content-Type-Options - Previne MIME sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // X-XSS-Protection - Proteção adicional contra XSS (browsers antigos)
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // Referrer-Policy - Controla informações de referrer
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions-Policy - Controla features do browser
        res.setHeader(
          'Permissions-Policy',
          'camera=(), microphone=(), geolocation=(), interest-cohort=()'
        );

        // Strict-Transport-Security (HSTS) - Força HTTPS
        // NOTA: Só ative em produção com HTTPS configurado
        if (process.env.NODE_ENV === 'production') {
          res.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
          );
        }

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        securityHeadersPlugin(),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Build optimizations
      build: {
        sourcemap: mode === 'development', // Sourcemaps apenas em dev
        minify: 'terser', // Minificação avançada em produção
        terserOptions: {
          compress: {
            drop_console: mode === 'production', // Remove console.logs em produção
            drop_debugger: true, // Remove debugger statements
          },
        },
        // PWA optimizations
        rollupOptions: {
          output: {
            manualChunks: {
              // Separar vendors para melhor cache
              'react-vendor': ['react', 'react-dom'],
              'charts': ['recharts'],
              'supabase': ['@supabase/supabase-js'],
              'gemini': ['@google/genai'],
            },
          },
        },
      },
      // PWA Configuration
      pwa: {
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'tailwind-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 1 semana
                },
              },
            },
          ],
        },
      },
    };
});
