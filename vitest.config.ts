import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://test.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('test-anon-key'),
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify('test-gemini-key'),
    'import.meta.env.DEV': JSON.stringify(true),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    css: false,
    exclude: [
      'node_modules/**/*',
      'dist/**/*',
      '.supabase/**/*',
      'coverage/**/*',
      'build/**/*',
      'e2e/**/*',
    ],
    coverage: {
      enabled: process.env.CI === 'true' || !!process.env.VITEST_COVERAGE,
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'contexts/AuthContext.tsx',
        'hooks/**/*.{ts,tsx}',
        'pages/{LandingPage,PlanMealPage,HydrationPage}.tsx',
        'services/{calorieGoalService,hydrationService,supabaseClient}.ts',
        'utils/logger.ts',
      ],
      exclude: [
        '**/__tests__/**',
        '**/*.d.ts',
        'components/**/*',
        'dist/**',
        '.supabase/**',
        'pages/**/{AuthPage,AuthCallbackPage,ChatPage,HealthPage,HistoryPage,HomePage,ProfilePage}.tsx',
        'services/**/index.ts',
        'utils/backgroundSync.tsx',
        'utils/hydrationNotifications.ts',
      ],
    },
  },
});
