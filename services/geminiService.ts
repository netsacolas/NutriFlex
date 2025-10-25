/**
 * Gemini Service - Proxy para Edge Function
 *
 * SEGURANÇA: Este serviço agora chama uma Edge Function no Supabase
 * ao invés de chamar a API do Gemini diretamente.
 *
 * Benefícios:
 * - API Key do Gemini fica no servidor (nunca exposta ao cliente)
 * - Rate limiting implementado por usuário (20 req/hora)
 * - Validação de inputs no backend
 * - Logs centralizados de uso da API
 */

import { MealResult, MealType } from '../types';
import logger from '../utils/logger';
import { supabase } from './supabaseClient';

/**
 * URL da Edge Function no Supabase
 * Esta função funciona como proxy seguro para a API do Gemini
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/gemini-proxy`;


/**
 * Calcula porções ideais de alimentos usando IA (via Edge Function)
 *
 * @param foods - Lista de alimentos selecionados
 * @param targetCalories - Meta de calorias para a refeição
 * @param mealType - Tipo de refeição (breakfast, lunch, dinner, snack)
 * @returns Resultado com porções calculadas, macros e sugestões nutricionais
 *
 * @throws Error se usuário não estiver autenticado
 * @throws Error se rate limit for excedido (20 req/hora)
 * @throws Error se a API falhar
 */
export const calculateMealPortions = async (
    foods: string[],
    targetCalories: number,
    mealType: MealType
): Promise<MealResult> => {
    try {
        // 1. Verificar autenticação
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            logger.error('User not authenticated', sessionError);
            throw new Error('Você precisa estar logado para calcular refeições.');
        }

        // 2. Preparar payload para Edge Function
        const payload = {
            mealType,
            targetCalories,
            foods,
        };

        logger.info('Calling Edge Function gemini-proxy', {
            mealType,
            targetCalories,
            foodsCount: foods.length
        });

        // 3. Chamar Edge Function (proxy seguro) usando fetch diretamente
        // IMPORTANTE: Passar o token no header Authorization
        const token = session.access_token;
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

        logger.debug('Calling Edge Function with token', {
            tokenPresent: !!token,
            url: `${SUPABASE_URL}/functions/v1/gemini-proxy`
        });

        const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-proxy`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            logger.error('Edge Function HTTP error', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });

            // Rate limit excedido
            if (response.status === 429 || errorData.error?.includes('Rate limit')) {
                throw new Error(
                    'Você atingiu o limite de 20 cálculos por hora. ' +
                    'Por favor, tente novamente mais tarde.'
                );
            }

            // Erro de autenticação
            if (response.status === 401) {
                throw new Error(
                    'Sessão expirada. Por favor, faça login novamente.'
                );
            }

            throw new Error('Falha ao calcular as porções. Por favor, tente novamente.');
        }

        const data = await response.json();

        // 4. Validar resposta
        if (!data || !data.portions || data.portions.length === 0) {
            logger.error('Invalid response from Edge Function', data);
            throw new Error(
                'Resposta inválida da IA. Por favor, tente novamente.'
            );
        }

        logger.info('Successfully calculated meal portions', {
            totalCalories: data.totalCalories,
            portionsCount: data.portions.length,
        });

        return data as MealResult;

    } catch (error) {
        // Se já for um erro tratado (com mensagem user-friendly), repassa
        if (error instanceof Error && error.message.includes('limite')) {
            throw error;
        }
        if (error instanceof Error && error.message.includes('logado')) {
            throw error;
        }
        if (error instanceof Error && error.message.includes('Sessão')) {
            throw error;
        }

        // Erro desconhecido
        logger.error('Unexpected error in calculateMealPortions', error);
        throw new Error(
            'Erro inesperado ao calcular as porções. ' +
            'Por favor, tente novamente ou entre em contato com o suporte.'
        );
    }
};
