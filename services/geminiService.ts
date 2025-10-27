/**
 * Gemini Service - Proxy para Edge Function
 *
 * Este serviço chama a Edge Function `gemini-proxy` hospedada no Supabase.
 * A chave do Gemini permanece no servidor e nunca é exposta ao frontend.
 */

import { MealResult, MealType } from '../types';
import logger from '../utils/logger';
import { supabase } from './supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/gemini-proxy`;

interface GeminiProxyPayload {
  mealType: MealType;
  targetCalories: number;
  foods: string[];
}

export const calculateMealPortions = async (
  foods: string[],
  targetCalories: number,
  mealType: MealType,
): Promise<MealResult> => {
  try {
    logger.info('calculateMealPortions called', {
      mealType,
      targetCalories,
      foodsCount: foods.length,
    });

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      logger.error('User not authenticated for meal calculation', sessionError);
      throw new Error('Você precisa estar logado para calcular refeições.');
    }

    const payload: GeminiProxyPayload = {
      mealType,
      targetCalories,
      foods,
    };

    logger.info('Calling Edge Function gemini-proxy', {
      mealType,
      targetCalories,
      foodsCount: foods.length,
    });

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    logger.debug('Edge Function response received', {
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Edge Function HTTP error', {
        status: response.status,
        error: errorData,
      });

      if (response.status === 429 || errorData?.error?.includes('Rate limit')) {
        throw new Error('Você atingiu o limite de 20 cálculos por hora. Por favor, tente novamente mais tarde.');
      }

      if (response.status === 401) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      throw new Error('Falha ao calcular as porções. Por favor, tente novamente.');
    }

    const data = await response.json();
    logger.debug('Edge Function response parsed', {
      hasPortions: Array.isArray(data?.portions),
      portionsCount: data?.portions?.length ?? 0,
      totalCalories: data?.totalCalories,
    });

    if (!data || !Array.isArray(data.portions) || data.portions.length === 0) {
      logger.error('Invalid response from Edge Function', { dataKeys: data ? Object.keys(data) : [] });
      throw new Error('Resposta inválida da IA. Por favor, tente novamente.');
    }

    return data as MealResult;
  } catch (error) {
    logger.error('Unexpected error in calculateMealPortions', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Erro inesperado ao calcular as porções. Por favor, tente novamente.');
  }
};
