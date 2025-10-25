import { supabase } from './supabaseClient';
import type { PhysicalActivity, ActivityIntensity } from '../types';

export const physicalActivityService = {
  async addActivity(
    activityType: string,
    durationMinutes: number,
    intensity: ActivityIntensity,
    performedAt: Date,
    caloriesBurned?: number,
    notes?: string
  ): Promise<{ data: PhysicalActivity | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('physical_activities')
      .insert({
        user_id: user.id,
        activity_type: activityType,
        duration_minutes: durationMinutes,
        intensity,
        calories_burned: caloriesBurned || null,
        performed_at: performedAt.toISOString(),
        notes: notes || null,
      })
      .select()
      .single();

    return { data, error };
  },

  async getActivities(days: number = 30): Promise<{ data: PhysicalActivity[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('physical_activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('performed_at', startDate.toISOString())
      .order('performed_at', { ascending: false });

    return { data, error };
  },

  async getLatestActivity(): Promise<{ data: PhysicalActivity | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('physical_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('performed_at', { ascending: false })
      .limit(1)
      .single();

    return { data, error };
  },

  async deleteActivity(id: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('physical_activities')
      .delete()
      .eq('id', id);

    return { error };
  },

  async getActivitiesByDate(date: Date): Promise<{ data: PhysicalActivity[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('physical_activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('performed_at', startOfDay.toISOString())
      .lte('performed_at', endOfDay.toISOString())
      .order('performed_at', { ascending: false });

    return { data, error };
  },

  async getPeriodStats(days: number = 7): Promise<{
    totalActivities: number;
    totalMinutes: number;
    totalCalories: number;
    avgDuration: number;
  } | null> {
    const { data: activities } = await this.getActivities(days);

    if (!activities || activities.length === 0) {
      return null;
    }

    const totalMinutes = activities.reduce((sum, a) => sum + a.duration_minutes, 0);
    const totalCalories = activities.reduce((sum, a) => sum + (a.calories_burned || 0), 0);

    return {
      totalActivities: activities.length,
      totalMinutes,
      totalCalories,
      avgDuration: Math.round(totalMinutes / activities.length),
    };
  },
};
