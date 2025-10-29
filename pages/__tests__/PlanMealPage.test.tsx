import React from 'react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

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

vi.mock('../../services/geminiService', () => ({
  calculateMealPortions: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../services/mealHistoryService', () => ({
  mealHistoryService: {
    saveMeal: vi.fn(),
    getRecentMeals: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../../data/foodDatabase', () => ({
  searchFoods: vi.fn().mockReturnValue([]),
}));

const { default: PlanMealPage } = await import('../PlanMealPage');

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={['/plan']}>
      <Routes>
        <Route path="/plan" element={<PlanMealPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('PlanMealPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    getCurrentSessionMock.mockReset();
    getProfileMock.mockReset();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redireciona para login quando sessão está ausente', async () => {
    getCurrentSessionMock.mockResolvedValue(null);

    renderWithRouter();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login');
    });
  });

  it('redireciona para onboarding quando perfil não possui dados obrigatórios', async () => {
    getCurrentSessionMock.mockResolvedValue({ user: { id: 'user-1' } });
    getProfileMock.mockResolvedValue({
      data: {
        id: 'user-1',
        full_name: 'Carlos',
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

    renderWithRouter();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('carrega calorias padrão do perfil quando dados estão completos', async () => {
    getCurrentSessionMock.mockResolvedValue({ user: { id: 'user-1' } });
    const now = new Date().toISOString();
    getProfileMock.mockResolvedValue({
      data: {
        id: 'user-1',
        full_name: 'Ana',
        phone: null,
        avatar_url: null,
        date_of_birth: null,
        age: 32,
        birth_date: null,
        gender: 'female',
        weight: 60,
        height: 168,
        activity_level: 'moderately_active',
        dietary_preferences: null,
        allergies: null,
        health_goals: null,
        meals_per_day: 4,
        breakfast_calories: 350,
        lunch_calories: 720,
        dinner_calories: 560,
        snack_calories: 180,
        snack_quantity: 2,
        created_at: now,
        updated_at: now,
      },
      error: null,
    });

    renderWithRouter();

    await waitFor(() => {
      expect(navigateMock).not.toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('720')).toBeInTheDocument();
    });
  });
});
