import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const navigateMock = vi.fn();
const getCurrentSessionMock = vi.fn();
const getProfileMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentSession: getCurrentSessionMock,
  },
}));

vi.mock('../../services/profileService', () => ({
  profileService: {
    getProfile: getProfileMock,
  },
}));

const { useRequiredProfile } = await import('../useRequiredProfile');

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('useRequiredProfile', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    getCurrentSessionMock.mockReset();
    getProfileMock.mockReset();
  });

  it('redireciona para login quando não existe sessão ativa', async () => {
    getCurrentSessionMock.mockResolvedValue(null);

    const { result } = renderHook(() => useRequiredProfile(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(navigateMock).toHaveBeenCalledWith('/login');
    expect(result.current.profile).toBeNull();
    expect(getProfileMock).not.toHaveBeenCalled();
  });

  it('redireciona para onboarding quando dados obrigatórios estão ausentes', async () => {
    getCurrentSessionMock.mockResolvedValue({ user: { id: 'user-1' } });
    getProfileMock.mockResolvedValue({
      data: {
        id: 'user-1',
        full_name: null,
        phone: null,
        avatar_url: null,
        date_of_birth: null,
        age: null,
        birth_date: null,
        gender: null,
        weight: null,
        height: null,
        activity_level: null,
        dietary_preferences: null,
        allergies: null,
        health_goals: null,
        meals_per_day: null,
        breakfast_calories: null,
        lunch_calories: null,
        dinner_calories: null,
        snack_calories: null,
        snack_quantity: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    const { result } = renderHook(() => useRequiredProfile(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(navigateMock).toHaveBeenCalledWith('/onboarding');
    expect(result.current.profile).toBeNull();
  });

  it('retorna perfil quando dados obrigatórios estão completos', async () => {
    getCurrentSessionMock.mockResolvedValue({ user: { id: 'user-1' } });
    const now = new Date().toISOString();
    const profile = {
      id: 'user-1',
      full_name: 'Maria Souza',
      phone: null,
      avatar_url: null,
      date_of_birth: null,
      age: 29,
      birth_date: null,
      gender: 'female',
      weight: 64,
      height: 165,
      activity_level: 'moderately_active',
      dietary_preferences: null,
      allergies: null,
      health_goals: null,
      meals_per_day: 4,
      breakfast_calories: 350,
      lunch_calories: 600,
      dinner_calories: 550,
      snack_calories: 150,
      snack_quantity: 2,
      created_at: now,
      updated_at: now,
    };

    getProfileMock.mockResolvedValue({
      data: profile,
      error: null,
    });

    const { result } = renderHook(() => useRequiredProfile(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(navigateMock).not.toHaveBeenCalled();
    expect(result.current.profile).toEqual(profile);
  });
});
