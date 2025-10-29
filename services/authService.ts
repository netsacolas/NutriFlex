import { supabase } from './supabaseClient';
import type { User, AuthError, Session } from '@supabase/supabase-js';
import logger from '../utils/logger';

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

const isE2EMock = import.meta.env.VITE_E2E_MOCK === 'true';

type MockUser = User & { email: string };

const mockState: {
  user: MockUser | null;
  session: Session | null;
  listeners: Set<(user: User | null) => void>;
} = {
  user: null,
  session: null,
  listeners: new Set(),
};

const notifyMockListeners = (user: User | null) => {
  mockState.listeners.forEach((listener) => {
    try {
      listener(user);
    } catch (error) {
      logger.warn('Mock auth listener error', error);
    }
  });
};

const buildMockUser = (email: string): MockUser => {
  const now = new Date().toISOString();
  return {
    id: 'mock-user',
    email,
    aud: 'authenticated',
    role: 'authenticated',
    created_at: now,
    app_metadata: {},
    user_metadata: {},
    identities: [],
    factors: [],
    confirmed_at: now,
  } as unknown as MockUser;
};

const setMockSession = (email: string) => {
  const user = buildMockUser(email);
  mockState.user = user;
  mockState.session = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'bearer',
    expires_in: 60 * 60,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    user,
  } as unknown as Session;
  notifyMockListeners(user);
  return user;
};

const clearMockAuth = () => {
  mockState.user = null;
  mockState.session = null;
  notifyMockListeners(null);
};

export const authService = {
  // Sign up com email e senha
  async signUp(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    if (isE2EMock) {
      const user = setMockSession(email);
      mockState.user = {
        ...user,
        user_metadata: { full_name: fullName },
      };
      return { user: mockState.user, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: 'https://nutrimais.app/auth/callback',
          // Desabilita verificação de email obrigatória
          // Nota: também precisa ser configurado no dashboard do Supabase
        },
      });

      if (error) {
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      logger.error('Sign up error', error);
      return { user: null, error: error as AuthError };
    }
  },

  // Sign in com email e senha
  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (isE2EMock) {
      const user = setMockSession(email);
      return { user, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      logger.error('Sign in error', error);
      return { user: null, error: error as AuthError };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    if (isE2EMock) {
      clearMockAuth();
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      logger.error('Sign out error', error);
      return { error: error as AuthError };
    }
  },

  // Recuperação de senha
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    if (isE2EMock) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://nutrimais.app/reset-password`,
      });
      return { error };
    } catch (error) {
      logger.error('Reset password error', error);
      return { error: error as AuthError };
    }
  },

  // Atualizar senha
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    if (isE2EMock) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      logger.error('Update password error', error);
      return { error: error as AuthError };
    }
  },

  // Reenviar email de confirmação
  async resendConfirmationEmail(email: string): Promise<{ error: AuthError | null }> {
    if (isE2EMock) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      return { error };
    } catch (error) {
      logger.error('Resend confirmation email error', error);
      return { error: error as AuthError };
    }
  },

  // Obter usuário atual
  async getCurrentUser(): Promise<User | null> {
    if (isE2EMock) {
      return mockState.user;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      logger.error('Get current user error', error);
      return null;
    }
  },

  // Obter sessão atual
  async getSession() {
    if (isE2EMock) {
      return mockState.session;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      logger.error('Get session error', error);
      return null;
    }
  },

  // Alias para getSession para compatibilidade
  async getCurrentSession() {
    if (isE2EMock) {
      return mockState.session;
    }
    return this.getSession();
  },

  // Listener para mudanças de autenticação
  onAuthStateChange(callback: (user: User | null) => void) {
    if (isE2EMock) {
      mockState.listeners.add(callback);
      callback(mockState.user);
      return {
        data: {
          subscription: {
            unsubscribe: () => mockState.listeners.delete(callback),
          },
        },
      };
    }

    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  },
};
if (isE2EMock && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__nutrimaisSetMockSession = (email: string) => {
    setMockSession(email);
  };
  (window as unknown as Record<string, unknown>).__nutrimaisClearMockSession = () => {
    clearMockAuth();
  };
}
