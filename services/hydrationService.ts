import { supabase } from './supabaseClient';
import type { HydrationSettings, HydrationIntake, HydrationProgress } from '../types';
import logger from '../utils/logger';

/**
 * Calcula a meta diária de água baseada no perfil do usuário
 * Fórmula base: 35ml por kg de peso
 * Ajustes: +500ml para atividade moderada/alta, +500ml em dias quentes
 */
export function calculateDailyWaterGoal(
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: string
): number {
  // Fórmula base: 35ml por kg
  let goalMl = weightKg * 35;

  // Ajuste por nível de atividade
  if (activityLevel === 'moderately_active' || activityLevel === 'very_active') {
    goalMl += 500;
  } else if (activityLevel === 'extra_active') {
    goalMl += 1000;
  }

  // Ajuste por idade (pessoas mais velhas precisam de mais hidratação)
  if (age > 65) {
    goalMl += 250;
  }

  // Arredonda para múltiplos de 250ml
  return Math.round(goalMl / 250) * 250;
}

/**
 * Gera lembretes distribuídos uniformemente entre acordar e dormir
 */
export function generateReminders(
  wakeTime: string,
  sleepTime: string,
  dailyGoalMl: number,
  intakeSizeMl: number
): { time: string; amount_ml: number }[] {
  const reminders: { time: string; amount_ml: number }[] = [];

  // Parse wake/sleep times
  const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
  const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);

  // Calcula minutos desde meia-noite
  const wakeMinutes = wakeHour * 60 + wakeMin;
  let sleepMinutes = sleepHour * 60 + sleepMin;

  // Se dormir é "antes" de acordar (ex: dorme às 23h, acorda às 7h), adiciona 24h
  if (sleepMinutes <= wakeMinutes) {
    sleepMinutes += 24 * 60;
  }

  const awakeMinutes = sleepMinutes - wakeMinutes;

  // Número de lembretes necessários
  const numberOfIntakes = Math.ceil(dailyGoalMl / intakeSizeMl);

  // Intervalo entre lembretes
  const interval = awakeMinutes / numberOfIntakes;

  for (let i = 0; i < numberOfIntakes; i++) {
    const reminderMinutes = wakeMinutes + Math.round(interval * i);
    const hour = Math.floor(reminderMinutes / 60) % 24;
    const min = reminderMinutes % 60;

    reminders.push({
      time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
      amount_ml: intakeSizeMl,
    });
  }

  return reminders;
}

export const hydrationService = {
  /**
   * Busca ou cria configurações de hidratação do usuário
   */
  async getSettings(): Promise<{ data: HydrationSettings | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const { data, error } = await supabase
        .from('hydration_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found
        logger.error('Error fetching hydration settings:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error('Error in getSettings:', error);
      return { data: null, error };
    }
  },

  /**
   * Cria ou atualiza configurações de hidratação
   */
  async upsertSettings(settings: Partial<HydrationSettings>): Promise<{ data: HydrationSettings | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const { data, error } = await supabase
        .from('hydration_settings')
        .upsert({
          ...settings,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Error upserting hydration settings:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error('Error in upsertSettings:', error);
      return { data: null, error };
    }
  },

  /**
   * Registra uma ingestão de água
   */
  async recordIntake(amountMl: number, scheduledTime?: string): Promise<{ data: HydrationIntake | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Tenta encontrar o próximo lembrete não completado
      const { data: incompleteReminder } = await supabase
        .from('hydration_intakes')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('completed', false)
        .order('scheduled_time', { ascending: true })
        .limit(1)
        .single();

      if (incompleteReminder) {
        // Atualiza lembrete existente
        const { data, error } = await supabase
          .from('hydration_intakes')
          .update({
            actual_time: now.toISOString(),
            completed: true,
          })
          .eq('id', incompleteReminder.id)
          .select()
          .single();

        if (error) {
          logger.error('Error updating reminder:', error);
          return { data: null, error };
        }

        return { data, error: null };
      } else {
        // Cria novo registro se não houver lembretes pendentes (ingestão manual)
        const intake: Partial<HydrationIntake> = {
          user_id: user.id,
          amount_ml: amountMl,
          scheduled_time: scheduledTime || now.toISOString(),
          actual_time: now.toISOString(),
          completed: true,
          snoozed: false,
          snooze_count: 0,
          date: today,
          created_at: now.toISOString(),
        };

        const { data, error } = await supabase
          .from('hydration_intakes')
          .insert(intake)
          .select()
          .single();

        if (error) {
          logger.error('Error recording intake:', error);
          return { data: null, error };
        }

        return { data, error: null };
      }
    } catch (error) {
      logger.error('Error in recordIntake:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca progresso de hidratação do dia
   */
  async getTodayProgress(): Promise<{ data: HydrationProgress | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const today = new Date().toISOString().split('T')[0];

      // Busca ingestões do dia
      const { data: intakes, error: intakesError } = await supabase
        .from('hydration_intakes')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today);

      if (intakesError) {
        logger.error('Error fetching intakes:', intakesError);
        return { data: null, error: intakesError };
      }

      // Busca configurações para pegar a meta
      const { data: settings } = await this.getSettings();
      const goalMl = settings?.daily_goal_ml || 2000;

      // Calcula totais
      const consumed_ml = intakes?.reduce((sum, intake) => sum + (intake.completed ? intake.amount_ml : 0), 0) || 0;
      const intakes_completed = intakes?.filter(i => i.completed).length || 0;

      // Total de lembretes programados (todos os registros do dia, completados ou não)
      const intakes_total = intakes?.length || 0;

      // Busca streak (dias consecutivos)
      const streak_days = await this.calculateStreak(user.id);

      const progress: HydrationProgress = {
        date: today,
        consumed_ml,
        goal_ml: goalMl,
        percentage: Math.round((consumed_ml / goalMl) * 100),
        intakes_completed,
        intakes_total,
        streak_days,
      };

      return { data: progress, error: null };
    } catch (error) {
      logger.error('Error in getTodayProgress:', error);
      return { data: null, error };
    }
  },

  /**
   * Calcula quantos dias consecutivos o usuário atingiu a meta
   */
  async calculateStreak(userId: string): Promise<number> {
    try {
      // Busca últimos 30 dias de ingestões
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: intakes } = await supabase
        .from('hydration_intakes')
        .select('date, amount_ml')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (!intakes || intakes.length === 0) return 0;

      const { data: settings } = await this.getSettings();
      const goalMl = settings?.daily_goal_ml || 2000;

      // Agrupa por data
      const dailyTotals = intakes.reduce((acc, intake) => {
        acc[intake.date] = (acc[intake.date] || 0) + intake.amount_ml;
        return acc;
      }, {} as Record<string, number>);

      // Conta streak a partir de hoje
      let streak = 0;
      const today = new Date();

      while (true) {
        const dateStr = today.toISOString().split('T')[0];
        const total = dailyTotals[dateStr] || 0;

        if (total >= goalMl) {
          streak++;
          today.setDate(today.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      logger.error('Error calculating streak:', error);
      return 0;
    }
  },

  /**
   * Adiar lembrete
   */
  async snoozeReminder(intakeId: string, minutesDelay: number = 15): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('hydration_intakes')
        .update({
          snoozed: true,
          snooze_count: supabase.rpc('increment_snooze', { intake_id: intakeId }),
        })
        .eq('id', intakeId);

      if (error) {
        logger.error('Error snoozing reminder:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      logger.error('Error in snoozeReminder:', error);
      return { error };
    }
  },

  /**
   * Busca histórico de hidratação (últimos 7 dias)
   */
  async getWeeklyHistory(): Promise<{ data: HydrationProgress[]; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: new Error('User not authenticated') };
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: intakes, error } = await supabase
        .from('hydration_intakes')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        logger.error('Error fetching weekly history:', error);
        return { data: [], error };
      }

      const { data: settings } = await this.getSettings();
      const goalMl = settings?.daily_goal_ml || 2000;

      // Agrupa por data
      const dailyData = intakes?.reduce((acc, intake) => {
        if (!acc[intake.date]) {
          acc[intake.date] = {
            date: intake.date,
            consumed_ml: 0,
            goal_ml: goalMl,
            percentage: 0,
            intakes_completed: 0,
            intakes_total: 0,
            streak_days: 0,
          };
        }

        acc[intake.date].consumed_ml += intake.completed ? intake.amount_ml : 0;
        acc[intake.date].intakes_total++;
        if (intake.completed) acc[intake.date].intakes_completed++;

        return acc;
      }, {} as Record<string, HydrationProgress>);

      // Converte para array e calcula percentuais
      const history = Object.values(dailyData || {}).map(day => ({
        ...day,
        percentage: Math.round((day.consumed_ml / day.goal_ml) * 100),
      }));

      return { data: history, error: null };
    } catch (error) {
      logger.error('Error in getWeeklyHistory:', error);
      return { data: [], error };
    }
  },

  /**
   * Busca histórico de ingestões (detalhado)
   */
  async getIntakeHistory(days: number = 7): Promise<{ data: HydrationIntake[]; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: new Error('User not authenticated') };
      }

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);

      const { data: intakes, error } = await supabase
        .from('hydration_intakes')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', daysAgo.toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching intake history:', error);
        return { data: [], error };
      }

      return { data: intakes || [], error: null };
    } catch (error) {
      logger.error('Error in getIntakeHistory:', error);
      return { data: [], error };
    }
  },

  /**
   * Deleta uma ingestão
   */
  async deleteIntake(intakeId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('hydration_intakes')
        .delete()
        .eq('id', intakeId);

      if (error) {
        logger.error('Error deleting intake:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      logger.error('Error in deleteIntake:', error);
      return { error };
    }
  },

  /**
   * Cria registros de lembretes para o dia atual
   * Isso permite que o contador mostre "consumidas/programadas" corretamente
   */
  async createDailyReminders(
    wakeTime: string,
    sleepTime: string,
    dailyGoalMl: number,
    intakeSizeMl: number
  ): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: new Error('User not authenticated') };
      }

      const today = new Date().toISOString().split('T')[0];

      // Remove lembretes existentes do dia (para evitar duplicatas)
      await supabase
        .from('hydration_intakes')
        .delete()
        .eq('user_id', user.id)
        .eq('date', today);

      // Gera lembretes com os novos parâmetros
      const reminders = generateReminders(wakeTime, sleepTime, dailyGoalMl, intakeSizeMl);

      // Cria registros para cada lembrete com completed=false
      const records = reminders.map(reminder => ({
        user_id: user.id,
        amount_ml: reminder.amount_ml,
        scheduled_time: `${today}T${reminder.time}:00`,
        actual_time: null,
        completed: false,
        snoozed: false,
        snooze_count: 0,
        date: today,
      }));

      const { error } = await supabase
        .from('hydration_intakes')
        .insert(records);

      if (error) {
        logger.error('Error creating daily reminders:', error);
        return { error };
      }

      logger.info(`Created ${records.length} reminders for today`);
      return { error: null };
    } catch (error) {
      logger.error('Error in createDailyReminders:', error);
      return { error };
    }
  },
};
