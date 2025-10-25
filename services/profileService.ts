import { supabase } from './supabaseClient';
import type { UserProfile } from '../types';

export const profileService = {
  // Obter perfil do usuário atual
  async getProfile(): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error getting profile:', error);
      return { data: null, error };
    }
  },

  // Atualizar perfil
  async updateProfile(updates: Partial<UserProfile>): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  },

  // Atualizar telefone
  async updatePhone(phone: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: { message: 'Usuário não autenticado' } };
      }

      const { error } = await supabase
        .from('profiles')
        .update({ phone })
        .eq('id', user.id);

      return { error };
    } catch (error) {
      console.error('Error updating phone:', error);
      return { error };
    }
  },

  // Atualizar nome completo
  async updateFullName(full_name: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: { message: 'Usuário não autenticado' } };
      }

      const { error } = await supabase
        .from('profiles')
        .update({ full_name })
        .eq('id', user.id);

      return { error };
    } catch (error) {
      console.error('Error updating full name:', error);
      return { error };
    }
  },

  // Calcular IMC (Índice de Massa Corporal)
  calculateBMI(weight: number, height: number): number {
    // IMC = peso (kg) / altura² (m)
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  },

  // Calcular TMB (Taxa Metabólica Basal) usando fórmula de Harris-Benedict
  calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
    if (gender === 'male') {
      return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
  },

  // Calcular TDEE (Total Daily Energy Expenditure)
  calculateTDEE(bmr: number, activityLevel: string): number {
    const multipliers: Record<string, number> = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'extra_active': 1.9
    };

    return bmr * (multipliers[activityLevel] || 1.2);
  }
};
