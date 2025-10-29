import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const navigateMock = vi.fn();
const getProfileMock = vi.fn();
const getSettingsMock = vi.fn();
const getTodayProgressMock = vi.fn();
const getTodayRemindersMock = vi.fn();
const calculateDailyWaterGoalMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../services/profileService', () => ({
  profileService: {
    getProfile: getProfileMock,
  },
}));

vi.mock('../../services/hydrationService', () => ({
  hydrationService: {
    getSettings: getSettingsMock,
    getTodayProgress: getTodayProgressMock,
    getTodayReminders: getTodayRemindersMock,
    upsertSettings: vi.fn(),
    createDailyReminders: vi.fn(),
    completeIntake: vi.fn(),
    uncompleteIntake: vi.fn(),
  },
  calculateDailyWaterGoal: calculateDailyWaterGoalMock,
  generateReminders: vi.fn(),
}));

vi.mock('../../components/SuccessModal', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="success-modal">{title}</div>,
}));

vi.mock('../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    criticalError: vi.fn(),
  },
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    criticalError: vi.fn(),
  },
}));

const { default: HydrationPage } = await import('../HydrationPage');

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/hydration']}>
      <Routes>
        <Route path="/hydration" element={<HydrationPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('HydrationPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    getProfileMock.mockReset();
    getSettingsMock.mockReset();
    getTodayProgressMock.mockReset();
    getTodayRemindersMock.mockReset();
    calculateDailyWaterGoalMock.mockReset();

    getTodayProgressMock.mockResolvedValue({ data: null });
    getTodayRemindersMock.mockResolvedValue({ data: [] });
  });

  it('redireciona para onboarding quando dados obrigatórios não estão preenchidos', async () => {
    getProfileMock.mockResolvedValue({
      data: {
        id: 'user-1',
        weight: null,
        height: null,
        age: null,
        gender: null,
      },
    });
    getSettingsMock.mockResolvedValue({ data: null });
    calculateDailyWaterGoalMock.mockReturnValue(2000);

    renderPage();

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/onboarding'));
  });

  it('carrega meta calculada quando não existem configurações salvas', async () => {
    getProfileMock.mockResolvedValue({
      data: {
        id: 'user-1',
        weight: 70,
        height: 175,
        age: 30,
        gender: 'male',
        activity_level: 'moderately_active',
      },
    });

    getSettingsMock.mockResolvedValue({ data: null });
    calculateDailyWaterGoalMock.mockReturnValue(2500);

    renderPage();

    await waitFor(() => {
      expect(navigateMock).not.toHaveBeenCalled();
      expect(screen.getByDisplayValue('2500')).toBeInTheDocument();
    });
  });

  it('preenche formulário com configurações existentes', async () => {
    getProfileMock.mockResolvedValue({
      data: {
        id: 'user-1',
        weight: 70,
        height: 175,
        age: 30,
        gender: 'male',
        activity_level: 'moderately_active',
      },
    });

    getSettingsMock.mockResolvedValue({
      data: {
        daily_goal_ml: 2200,
        wake_time: '06:30',
        sleep_time: '22:30',
        intake_size_ml: 300,
        notifications_enabled: true,
        sound_enabled: true,
        vibration_enabled: false,
        unit: 'ml',
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('2200')).toBeInTheDocument();
      expect(screen.getByDisplayValue('06:30')).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: (label) => label.includes('300'),
        })
      ).toBeInTheDocument();
    });
  });
});
