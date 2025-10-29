import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock('../../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    criticalError: vi.fn(),
  },
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    criticalError: vi.fn(),
  },
}));

const { calorieGoalService } = await import('../calorieGoalService');

describe('calorieGoalService', () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleParams = {
    weight: 78,
    height: 178,
    age: 34,
    gender: 'male' as const,
    goal: 'maintain' as const,
    activityLevel: 'moderately_active' as const,
  };

  it('retorna dicionario descritivo para niveis de atividade', () => {
    expect(calorieGoalService.getActivityLevelText('sedentary')).toContain('Sedent');
    expect(calorieGoalService.getActivityLevelText('very_active')).toContain('Muito ativo');
    expect(calorieGoalService.getActivityLevelText('unknown').toLowerCase()).toContain('informado');
  });

  it('calcula fallback com valores arredondados e consistentes', () => {
    const result = calorieGoalService.calculateFallback(sampleParams);

    const sum =
      result.breakfast +
      result.lunch +
      result.dinner +
      result.snack * result.snackQuantity;

    expect(result.totalDaily % 50).toBe(0);
    expect(result.breakfast % 50).toBe(0);
    expect(result.lunch % 50).toBe(0);
    expect(result.dinner % 50).toBe(0);
    expect(result.snack % 50).toBe(0);
    expect(sum).toBe(result.totalDaily);
  });

  it('usa fallback quando sessão supabase não está disponível', async () => {
    getSessionMock.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const result = await calorieGoalService.calculateCalorieGoals(sampleParams);

    expect(result.totalDaily).toBeGreaterThan(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
