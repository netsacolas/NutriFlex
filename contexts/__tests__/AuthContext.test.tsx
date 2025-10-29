import React, { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';

const authServiceMocks = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  signInMock: vi.fn(),
  signUpMock: vi.fn(),
  signOutMock: vi.fn(),
  resetPasswordMock: vi.fn(),
  unsubscribeMock: vi.fn(),
}));

vi.mock('../../services/authService', () => ({
  authService: {
    getSession: authServiceMocks.getSessionMock,
    onAuthStateChange: authServiceMocks.onAuthStateChangeMock,
    signIn: authServiceMocks.signInMock,
    signUp: authServiceMocks.signUpMock,
    signOut: authServiceMocks.signOutMock,
    resetPassword: authServiceMocks.resetPasswordMock,
  },
}));

const wrapper = ({ children }: PropsWithChildren) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    authServiceMocks.getSessionMock.mockResolvedValue({ user: { id: 'session-user' } });
    authServiceMocks.signInMock.mockResolvedValue({ user: { id: 'signed-user' }, error: null });
    authServiceMocks.signUpMock.mockResolvedValue({ user: { id: 'signup-user' }, error: null });
    authServiceMocks.signOutMock.mockResolvedValue({ error: null });
    authServiceMocks.resetPasswordMock.mockResolvedValue({ error: null });
    authServiceMocks.unsubscribeMock.mockReset();

    authServiceMocks.onAuthStateChangeMock.mockImplementation((callback: (user: any) => void) => {
      callback({ id: 'listener-user' });
      return {
        data: {
          subscription: {
            unsubscribe: authServiceMocks.unsubscribeMock,
          },
        },
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('expõe sessão inicial e atualiza via listener', async () => {
    const { result, unmount } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user?.id).toBe('listener-user');
    expect(authServiceMocks.getSessionMock).toHaveBeenCalledTimes(1);
    expect(authServiceMocks.onAuthStateChangeMock).toHaveBeenCalledTimes(1);

    unmount();
    expect(authServiceMocks.unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it('signIn atualiza usuário no contexto', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signIn('user@example.com', 'secret');
    });

    expect(authServiceMocks.signInMock).toHaveBeenCalledWith('user@example.com', 'secret');
    expect(result.current.user?.id).toBe('signed-user');
  });

  it('signOut limpa usuário', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(authServiceMocks.signOutMock).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
  });

  it('resetPassword delega para authService', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.resetPassword('user@example.com');
    });

    expect(authServiceMocks.resetPasswordMock).toHaveBeenCalledWith('user@example.com');
  });
});
