import { beforeEach, describe, expect, it, vi } from 'vitest';

const signUpMock = vi.fn();
const signInWithPasswordMock = vi.fn();
const signOutMock = vi.fn();
const resetPasswordMock = vi.fn();
const updateUserMock = vi.fn();
const resendMock = vi.fn();
const getUserMock = vi.fn();
const getSessionMock = vi.fn();
const onAuthStateChangeMock = vi.fn();

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: signUpMock,
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
      resetPasswordForEmail: resetPasswordMock,
      updateUser: updateUserMock,
      resend: resendMock,
      getUser: getUserMock,
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
    },
  },
}));

vi.mock('../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const { authService } = await import('../authService');

describe('authService (Supabase integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('realiza cadastro com sucesso', async () => {
    signUpMock.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const result = await authService.signUp('demo@email.com', '123456', 'Demo');

    expect(signUpMock).toHaveBeenCalledWith({
      email: 'demo@email.com',
      password: '123456',
      options: {
        data: { full_name: 'Demo' },
        emailRedirectTo: 'https://nutrimais.app/auth/callback',
      },
    });
    expect(result.user?.id).toBe('user-1');
    expect(result.error).toBeNull();
  });

  it('propaga erro ao fazer login', async () => {
    const authError = { message: 'Credenciais inválidas' } as any;
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { user: null },
      error: authError,
    });

    const result = await authService.signIn('demo@email.com', '123456');

    expect(signInWithPasswordMock).toHaveBeenCalledTimes(1);
    expect(result.user).toBeNull();
    expect(result.error).toBe(authError);
  });

  it('retorna sessão atual quando disponível', async () => {
    const session = { access_token: 'token', user: { id: 'user-1' } } as any;
    getSessionMock.mockResolvedValueOnce({
      data: { session },
    });

    const result = await authService.getSession();
    expect(result).toBe(session);
  });

  it('registra callback de mudança de autenticação', async () => {
    const unsubscribe = vi.fn();
    onAuthStateChangeMock.mockReturnValueOnce({
      data: { subscription: { unsubscribe } },
    });

    const callback = vi.fn();
    const subscription = authService.onAuthStateChange(callback);

    expect(onAuthStateChangeMock).toHaveBeenCalledTimes(1);
    expect(subscription.data.subscription.unsubscribe).toBe(unsubscribe);
  });

  it('executa signOut e propaga erro', async () => {
    const authError = { message: 'erro' } as any;
    signOutMock.mockResolvedValueOnce({ error: authError });

    const result = await authService.signOut();
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(result.error).toBe(authError);
  });

  it('reenviar email de confirmação chama Supabase', async () => {
    resendMock.mockResolvedValueOnce({ error: null });
    const result = await authService.resendConfirmationEmail('demo@email.com');
    expect(resendMock).toHaveBeenCalledWith({
      type: 'signup',
      email: 'demo@email.com',
    });
    expect(result.error).toBeNull();
  });

  it('resetPassword usa método correto', async () => {
    resetPasswordMock.mockResolvedValueOnce({ error: null });
    await authService.resetPassword('demo@email.com');
    expect(resetPasswordMock).toHaveBeenCalledWith('demo@email.com', {
      redirectTo: 'https://nutrimais.app/reset-password',
    });
  });

  it('updatePassword propaga erros', async () => {
    updateUserMock.mockResolvedValueOnce({ error: null });
    const result = await authService.updatePassword('nova-senha');
    expect(updateUserMock).toHaveBeenCalledWith({ password: 'nova-senha' });
    expect(result.error).toBeNull();
  });

  it('getCurrentUser lida com falhas retornando null', async () => {
    getUserMock.mockRejectedValueOnce(new Error('network'));
    const user = await authService.getCurrentUser();
    expect(user).toBeNull();
  });
});
