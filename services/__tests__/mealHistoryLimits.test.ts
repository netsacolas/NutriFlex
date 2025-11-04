import { describe, it, expect, beforeEach, vi } from 'vitest';

const getUserMock = vi.fn();
const rpcMock = vi.fn();

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
    },
    rpc: rpcMock,
  },
}));

const { mealConsumptionService } = await import('../mealConsumptionService');
const { mealHistoryService } = await import('../mealHistoryService');

describe('Limites de histórico por assinatura', () => {
  beforeEach(() => {
    getUserMock.mockReset();
    rpcMock.mockReset();

    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'teste@nutrimais.com',
        },
      },
      error: null,
    });

    rpcMock.mockResolvedValue({
      data: [],
      error: null,
    });
  });

  it('usa a RPC meal_history_limited ao buscar histórico simples', async () => {
    await mealConsumptionService.getMealHistory(7);

    expect(rpcMock).toHaveBeenCalledWith('meal_history_limited', { p_days: 7 });
  });

  it('usa a RPC meal_history_limited ao buscar histórico completo', async () => {
    await mealHistoryService.getUserMealHistory('user-1');

    expect(rpcMock).toHaveBeenCalledWith('meal_history_limited', { p_days: 365 });
  });

  it('aplica intervalo ao buscar histórico por período', async () => {
    const start = new Date('2025-01-01T00:00:00.000Z');
    const end = new Date('2025-01-31T23:59:59.000Z');

    await mealHistoryService.getMealHistoryByPeriod('user-1', start, end);

    expect(rpcMock).toHaveBeenCalledWith('meal_history_limited', {
      p_days: 365,
      p_start: start.toISOString(),
      p_end: end.toISOString(),
    });
  });
});
