import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUserMock = vi.fn();
const fromMock = vi.fn();

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
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

const { hydrationService, generateReminders } = await import('../hydrationService');

describe('hydrationService (supabase integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });
  });

  it('recupera configurações existentes', async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: { id: 'settings-1', daily_goal_ml: 2200 },
      error: null,
    });

    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: singleMock,
    });

    const result = await hydrationService.getSettings();

    expect(result.error).toBeNull();
    expect(result.data?.daily_goal_ml).toBe(2200);
    expect(singleMock).toHaveBeenCalledTimes(1);
  });

  it('faz upsert atualizando registros existentes', async () => {
    const existingRecord = {
      data: { id: 'settings-1' },
      error: null,
    };
    const updatedRecord = {
      data: { id: 'settings-1', daily_goal_ml: 2100 },
      error: null,
    };

    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(existingRecord),
    };

    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(updatedRecord),
    };

    fromMock
      .mockImplementationOnce(() => selectChain)
      .mockImplementationOnce(() => updateChain);

    const result = await hydrationService.upsertSettings({ daily_goal_ml: 2100 });

    expect(result.error).toBeNull();
    expect(result.data?.daily_goal_ml).toBe(2100);
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ daily_goal_ml: 2100 })
    );
  });

  it('cria lembretes diários com base no intervalo configurado', async () => {
    const deleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    const insertChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    fromMock
      .mockImplementationOnce(() => deleteChain)
      .mockImplementationOnce(() => insertChain);

    const wake = '07:00';
    const sleep = '22:00';
    const goal = 2000;
    const intake = 250;
    const expectedReminders = generateReminders(wake, sleep, goal, intake);

    const result = await hydrationService.createDailyReminders(wake, sleep, goal, intake);

    expect(result.error).toBeNull();
    expect(deleteChain.delete).toHaveBeenCalledTimes(1);
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          amount_ml: 250,
        }),
      ]),
    );
    expect((insertChain.insert.mock.calls[0] as any)[0]).toHaveLength(expectedReminders.length);
  });
});
