import { supabase } from './supabaseClient';
import type { WeightEntry, Goal, Achievement } from '../types';
import { calculateBMI, getBMICategory } from '../utils/bmiUtils';

export const weightHistoryService = {
  /**
   * Adicionar nova pesagem ao histórico
   */
  async addWeightEntry(
    weight: number,
    height: number | null,
    notes?: string
  ): Promise<{ data: WeightEntry | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      // Calcular IMC se houver altura
      let bmi = null;
      let bmi_category = null;
      if (height) {
        bmi = calculateBMI(weight, height);
        bmi_category = getBMICategory(bmi);
      }

      const { data, error } = await supabase
        .from('weight_history')
        .insert({
          user_id: user.id,
          weight,
          height,
          bmi,
          bmi_category,
          notes,
          measured_at: new Date().toISOString()
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error adding weight entry:', error);
      return { data: null, error };
    }
  },

  /**
   * Obter histórico completo de pesagens
   */
  async getWeightHistory(): Promise<{ data: WeightEntry[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      const { data, error } = await supabase
        .from('weight_history')
        .select('*')
        .eq('user_id', user.id)
        .order('measured_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error getting weight history:', error);
      return { data: null, error };
    }
  },

  /**
   * Obter última pesagem
   */
  async getLatestWeight(): Promise<{ data: WeightEntry | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      const { data, error } = await supabase
        .from('weight_history')
        .select('*')
        .eq('user_id', user.id)
        .order('measured_at', { ascending: false })
        .limit(1)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error getting latest weight:', error);
      return { data: null, error };
    }
  },

  /**
   * Atualizar análise de IA em uma pesagem
   */
  async updateAIAnalysis(
    entryId: string,
    aiAnalysis: string
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('weight_history')
        .update({ ai_analysis: aiAnalysis })
        .eq('id', entryId);

      return { error };
    } catch (error) {
      console.error('Error updating AI analysis:', error);
      return { error };
    }
  },

  /**
   * Deletar pesagem
   */
  async deleteWeightEntry(entryId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('weight_history')
        .delete()
        .eq('id', entryId);

      return { error };
    } catch (error) {
      console.error('Error deleting weight entry:', error);
      return { error };
    }
  },

  // === GOALS ===

  /**
   * Criar nova meta
   */
  async createGoal(goal: Partial<Goal>): Promise<{ data: Goal | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goal,
          user_id: user.id
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating goal:', error);
      return { data: null, error };
    }
  },

  /**
   * Obter metas ativas
   */
  async getActiveGoals(): Promise<{ data: Goal[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error getting active goals:', error);
      return { data: null, error };
    }
  },

  /**
   * Marcar meta como completada
   */
  async completeGoal(goalId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('goals')
        .update({
          is_active: false,
          completed_at: new Date().toISOString()
        })
        .eq('id', goalId);

      return { error };
    } catch (error) {
      console.error('Error completing goal:', error);
      return { error };
    }
  },

  // === ACHIEVEMENTS ===

  /**
   * Adicionar conquista
   */
  async addAchievement(
    achievement: Partial<Achievement>
  ): Promise<{ data: Achievement | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      const { data, error } = await supabase
        .from('achievements')
        .insert({
          ...achievement,
          user_id: user.id
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error adding achievement:', error);
      return { data: null, error };
    }
  },

  /**
   * Obter conquistas do usuário
   */
  async getAchievements(): Promise<{ data: Achievement[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error getting achievements:', error);
      return { data: null, error };
    }
  }
};
