import { describe, expect, it } from 'vitest';
import {
  calculateDailyWaterGoal,
  generateReminders,
} from '../hydrationService';

describe('hydrationService helpers', () => {
  it('calcula meta diária ajustando por atividade e idade', () => {
    const sedentary = calculateDailyWaterGoal(70, 170, 30, 'sedentary');
    const active = calculateDailyWaterGoal(70, 170, 30, 'very_active');
    const senior = calculateDailyWaterGoal(70, 170, 70, 'sedentary');

    expect(sedentary % 250).toBe(0);
    expect(active).toBeGreaterThan(sedentary);
    expect(senior).toBeGreaterThanOrEqual(sedentary);
  });

  it('distribui lembretes do despertar até a hora de dormir', () => {
    const reminders = generateReminders('07:00', '23:00', 2000, 250);

    expect(reminders).toHaveLength(8);
    expect(reminders[0].time).toMatch(/^\d{2}:\d{2}$/);
    expect(reminders[0].amount_ml).toBe(250);
    expect(reminders[reminders.length - 1].time).toMatch(/^\d{2}:\d{2}$/);
  });
});
