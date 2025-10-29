import { supabase } from './supabaseClient';
import type { MealHistory, Portion } from '../types';
import logger from '../utils/logger';

const isE2EMock = import.meta.env.VITE_E2E_MOCK === 'true';

const mockMeals: MealHistory[] = [];

const buildMockMeal = (payload: {
  user_id: string;
  meal_type: string;
  total_calories: number;
  total_macros: { protein: number; carbs: number; fat: number; fiber?: number };
  portions: Portion[];
  consumed_at: string;
  glycemic_index?: number;
  glycemic_load?: number;
}): MealHistory => {
  const now = new Date().toISOString();
  return {
    id: `mock-meal-${Date.now()}`,
    user_id: payload.user_id,
    meal_type: payload.meal_type as any,
    consumed_at: payload.consumed_at,
    total_calories: payload.total_calories,
    total_protein: payload.total_macros.protein,
    total_carbs: payload.total_macros.carbs,
    total_fat: payload.total_macros.fat,
    total_fiber: payload.total_macros.fiber ?? null,
    glycemic_index: payload.glycemic_index ?? null,
    glycemic_load: payload.glycemic_load ?? null,
    portions: payload.portions,
    notes: null,
    created_at: now,
  };
};

export const mealHistoryService = {
  // Salvar histórico de refeição
  async saveMealHistory(data: {
    user_id: string;
    meal_type: string;
    total_calories: number;
    total_macros: {
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
    };
    food_items: string[];
    portions: Portion[];
    consumed_at: string;
    glycemic_index?: number;
    glycemic_load?: number;
  }): Promise<MealHistory | null> {
    if (isE2EMock) {
      const meal = buildMockMeal(data);
      mockMeals.unshift(meal);
      return meal;
    }

    try {
      const { data: meal, error } = await supabase
        .from('meal_consumption')
        .insert({
          user_id: data.user_id,
          meal_type: data.meal_type,
          total_calories: data.total_calories,
          total_protein: data.total_macros.protein,
          total_carbs: data.total_macros.carbs,
          total_fat: data.total_macros.fat,
          total_fiber: data.total_macros.fiber,
          glycemic_index: data.glycemic_index,
          glycemic_load: data.glycemic_load,
          portions: data.portions,
          consumed_at: data.consumed_at,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving meal history:', error);
        return null;
      }

      return meal;
    } catch (error) {
      console.error('Error in saveMealHistory:', error);
      return null;
    }
  },

  // Buscar histórico de refeições do usuário
  async getUserMealHistory(userId: string): Promise<{ data: MealHistory[] | null; error: any }> {
    if (isE2EMock) {
      return { data: mockMeals.filter((meal) => meal.user_id === userId), error: null };
    }

    try {
      const { data, error } = await supabase
        .from('meal_consumption')
        .select('*')
        .eq('user_id', userId)
        .order('consumed_at', { ascending: false });

      if (error) {
        console.error('Error fetching meal history:', error);
      }

      return { data, error };
    } catch (error) {
      console.error('Error in getUserMealHistory:', error);
      return { data: null, error };
    }
  },

  // Buscar refeições por período
  async getMealHistoryByPeriod(userId: string, startDate: Date, endDate: Date): Promise<MealHistory[]> {
    if (isE2EMock) {
      return mockMeals.filter((meal) => {
        return (
          meal.user_id === userId &&
          new Date(meal.consumed_at) >= startDate &&
          new Date(meal.consumed_at) <= endDate
        );
      });
    }

    try {
      const { data, error } = await supabase
        .from('meal_consumption')
        .select('*')
        .eq('user_id', userId)
        .gte('consumed_at', startDate.toISOString())
        .lte('consumed_at', endDate.toISOString())
        .order('consumed_at', { ascending: false });

      if (error) {
        console.error('Error fetching meal history by period:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMealHistoryByPeriod:', error);
      return [];
    }
  },

  // Deletar refeição do histórico
  async deleteMealHistory(mealId: string): Promise<boolean> {
    if (isE2EMock) {
      const index = mockMeals.findIndex((meal) => meal.id === mealId);
      if (index >= 0) {
        mockMeals.splice(index, 1);
        return true;
      }
      return false;
    }

    try {
      const { error } = await supabase
        .from('meal_consumption')
        .delete()
        .eq('id', mealId);

      if (error) {
        console.error('Error deleting meal history:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteMealHistory:', error);
      return false;
    }
  },

  // Atualizar refeição do histórico
  async updateMealHistory(mealId: string, updates: Partial<MealHistory>): Promise<MealHistory | null> {
    if (isE2EMock) {
      const index = mockMeals.findIndex((meal) => meal.id === mealId);
      if (index === -1) {
        return null;
      }
      mockMeals[index] = {
        ...mockMeals[index],
        ...updates,
      };
      return mockMeals[index];
    }

    try {
      const { data, error } = await supabase
        .from('meal_consumption')
        .update(updates)
        .eq('id', mealId)
        .select()
        .single();

      if (error) {
        console.error('Error updating meal history:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateMealHistory:', error);
      return null;
    }
  },

  // Obter estatísticas de refeições
  async getMealStatistics(userId: string, days: number = 30): Promise<{
    totalMeals: number;
    totalCalories: number;
    averageCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const meals = await this.getMealHistoryByPeriod(userId, startDate, new Date());

      const stats = meals.reduce(
        (acc, meal) => {
          acc.totalMeals += 1;
          acc.totalCalories += meal.total_calories;
          acc.totalProtein += meal.total_protein || 0;
          acc.totalCarbs += meal.total_carbs || 0;
          acc.totalFat += meal.total_fat || 0;
          return acc;
        },
        {
          totalMeals: 0,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
        },
      );

      return {
        ...stats,
        averageCalories: stats.totalMeals > 0 ? Math.round(stats.totalCalories / stats.totalMeals) : 0,
      };
    } catch (error) {
      logger.error('Error in getMealStatistics:', error);
      return {
        totalMeals: 0,
        totalCalories: 0,
        averageCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      };
    }
  },
};
