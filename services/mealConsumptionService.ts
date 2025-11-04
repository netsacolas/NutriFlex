import { supabase } from './supabaseClient';
import type { MealConsumption, MealResult, MealType } from '../types';
import logger from '../utils/logger';

export const mealConsumptionService = {
  /**
   * Salvar refeição consumida
   */
  async saveMealConsumption(
    mealResult: MealResult,
    mealType: MealType,
    consumedAt: Date,
    notes?: string
  ): Promise<{ data: MealConsumption | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      const { data, error } = await supabase
        .from('meal_consumption')
        .insert({
          user_id: user.id,
          meal_type: mealType,
          consumed_at: consumedAt.toISOString(),
          total_calories: mealResult.totalCalories,
          total_protein: mealResult.totalMacros.protein,
          total_carbs: mealResult.totalMacros.carbs,
          total_fat: mealResult.totalMacros.fat,
          total_fiber: mealResult.totalMacros.fiber,
          glycemic_index: mealResult.glycemicData.index,
          glycemic_load: mealResult.glycemicData.load,
          portions: mealResult.portions,
          notes
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      logger.error('Error saving meal consumption', error);
      return { data: null, error };
    }
  },

  /**
   * Buscar histórico de consumo (últimos 30 dias por padrão)
   */
  async getMealHistory(days: number = 30): Promise<{ data: MealConsumption[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      const { data, error } = await supabase.rpc<MealConsumption[]>(
        'meal_history_limited',
        { p_days: days },
      );

      return { data, error };
    } catch (error) {
      logger.error('Error getting meal history', error);
      return { data: null, error };
    }
  },

  /**
   * Buscar refeições de um dia específico
   */
  async getMealsByDate(date: Date): Promise<{ data: MealConsumption[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('meal_consumption')
        .select('*')
        .eq('user_id', user.id)
        .gte('consumed_at', startOfDay.toISOString())
        .lte('consumed_at', endOfDay.toISOString())
        .order('consumed_at', { ascending: true });

      return { data, error };
    } catch (error) {
      logger.error('Error getting meals by date', error);
      return { data: null, error };
    }
  },

  /**
   * Deletar refeição
   */
  async deleteMeal(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('meal_consumption')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      logger.error('Error deleting meal', error);
      return { error };
    }
  },

  /**
   * Estatísticas do período
   */
  async getPeriodStats(days: number = 7): Promise<{
    totalMeals: number;
    avgCalories: number;
    totalCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
  } | null> {
    try {
      const { data } = await this.getMealHistory(days);

      if (!data || data.length === 0) {
        return null;
      }

      const totalMeals = data.length;
      const totalCalories = data.reduce((sum, meal) => sum + meal.total_calories, 0);
      const totalProtein = data.reduce((sum, meal) => sum + (meal.total_protein || 0), 0);
      const totalCarbs = data.reduce((sum, meal) => sum + (meal.total_carbs || 0), 0);
      const totalFat = data.reduce((sum, meal) => sum + (meal.total_fat || 0), 0);

      return {
        totalMeals,
        totalCalories,
        avgCalories: totalCalories / totalMeals,
        avgProtein: totalProtein / totalMeals,
        avgCarbs: totalCarbs / totalMeals,
        avgFat: totalFat / totalMeals
      };
    } catch (error) {
      logger.error('Error getting period stats', error);
      return null;
    }
  }
};
