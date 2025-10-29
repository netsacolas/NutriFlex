import { supabase } from './supabaseClient';
import type { UserProfile } from '../types';
import logger from '../utils/logger';

const isE2EMock = import.meta.env.VITE_E2E_MOCK === 'true';

const buildDefaultProfile = (): UserProfile => {
  const timestamp = new Date().toISOString();
  return {
    id: 'mock-user',
    full_name: 'Usuário Demo',
    phone: '11900000000',
    avatar_url: null,
    date_of_birth: null,
    age: 30,
    birth_date: null,
    gender: 'male',
    weight: 72,
    height: 175,
    activity_level: 'moderately_active',
    dietary_preferences: [],
    allergies: [],
    health_goals: ['melhorar alimentação'],
    meals_per_day: 4,
    breakfast_calories: 350,
    lunch_calories: 600,
    dinner_calories: 550,
    snack_calories: 200,
    snack_quantity: 2,
    created_at: timestamp,
    updated_at: timestamp,
  };
};

const mockProfileState: { profile: UserProfile } = {
  profile: buildDefaultProfile(),
};

const updateMockProfile = (updates: Partial<UserProfile>) => {
  mockProfileState.profile = {
    ...mockProfileState.profile,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return mockProfileState.profile;
};

export const profileService = {
  // Obter perfil do usuário atual
  async getProfile(): Promise<{ data: UserProfile | null; error: any }> {
    if (isE2EMock) {
      return { data: mockProfileState.profile, error: null };
    }

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

      if (error) {
        logger.error('Error getting profile', error);
        // Se a tabela não existe, retornar mensagem específica
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          return {
            data: null,
            error: {
              message: 'Tabela de perfis não encontrada. Execute a migration SQL no Supabase.',
              code: 'TABLE_NOT_FOUND',
            },
          };
        }
      }

      return { data, error };
    } catch (error) {
      logger.error('Error getting profile', error);
      return { data: null, error };
    }
  },

  // Atualizar perfil
  async updateProfile(updates: Partial<UserProfile>): Promise<{ data: UserProfile | null; error: any }> {
    if (isE2EMock) {
      return { data: updateMockProfile(updates), error: null };
    }

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
      logger.error('Error updating profile', error);
      return { data: null, error };
    }
  },

  // Atualizar telefone
  async updatePhone(phone: string): Promise<{ error: any }> {
    if (isE2EMock) {
      updateMockProfile({ phone });
      return { error: null };
    }

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
      logger.error('Error updating phone', error);
      return { error };
    }
  },

  // Atualizar nome completo
  async updateFullName(full_name: string): Promise<{ error: any }> {
    if (isE2EMock) {
      updateMockProfile({ full_name });
      return { error: null };
    }

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
      logger.error('Error updating full name', error);
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
    }
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  },

  // Calcular TDEE (Total Daily Energy Expenditure)
  calculateTDEE(bmr: number, activityLevel: string): number {
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    };

    return bmr * (multipliers[activityLevel] || 1.2);
  },
};
