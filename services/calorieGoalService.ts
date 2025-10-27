import { supabase } from './supabaseClient';
import logger from '../utils/logger';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface CalorieGoalRequest {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  goal: 'lose' | 'maintain' | 'gain';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
}

interface CalorieGoalResponse {
  totalDaily: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
  snackQuantity: number;
  explanation: string;
}

export const calorieGoalService = {
  /**
   * Calcula as metas calóricas usando IA (Gemini)
   */
  async calculateCalorieGoals(params: CalorieGoalRequest): Promise<CalorieGoalResponse> {
    try {
      logger.debug('Calculating calorie goals with AI');

      // Verificar autenticação
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Usuário não autenticado');
      }

      // Construir prompt para a IA
      const prompt = `Você é um nutricionista especializado. Com base nos seguintes dados do usuário, calcule as metas calóricas diárias e a distribuição entre as refeições:

**Dados do Usuário:**
- Peso: ${params.weight} kg
- Altura: ${params.height} cm
- Idade: ${params.age} anos
- Sexo: ${params.gender === 'male' ? 'Masculino' : 'Feminino'}
- Objetivo: ${params.goal === 'lose' ? 'Perder peso' : params.goal === 'gain' ? 'Ganhar peso' : 'Manter peso'}
- Nível de Atividade: ${this.getActivityLevelText(params.activityLevel)}

**Tarefa:**
1. Calcule a Taxa Metabólica Basal (TMB) usando a fórmula de Mifflin-St Jeor
2. Ajuste para o nível de atividade física
3. Aplique o déficit/superávit calórico apropriado para o objetivo:
   - Perder peso: déficit de 500 kcal/dia
   - Ganhar peso: superávit de 300-500 kcal/dia
   - Manter peso: manutenção
4. Distribua as calorias entre as refeições seguindo esta estrutura:
   - Café da Manhã: 25-30% do total
   - Almoço: 35-40% do total
   - Jantar: 25-30% do total
   - Lanches (2-3 por dia): 10-15% do total dividido entre os lanches

**IMPORTANTE:**
- Arredonde os valores para múltiplos de 50 kcal
- Garanta que a soma das refeições seja igual ao total diário
- Calcule quantos lanches são recomendados (geralmente 2-3)
- Forneça uma breve explicação (1-2 frases) sobre a meta calórica sugerida

**Formato de Resposta (JSON):**
\`\`\`json
{
  "totalDaily": número_inteiro,
  "breakfast": número_inteiro,
  "lunch": número_inteiro,
  "dinner": número_inteiro,
  "snack": número_inteiro (valor por lanche),
  "snackQuantity": número_inteiro (quantidade de lanches recomendados, geralmente 2-3),
  "explanation": "string explicando brevemente a recomendação"
}
\`\`\`

Responda APENAS com o JSON, sem texto adicional.`;

      const systemInstruction = `Você é um nutricionista especializado em calcular metas calóricas personalizadas.
Seus cálculos devem ser precisos e baseados em fórmulas científicas reconhecidas.
Sempre responda em formato JSON válido conforme solicitado.`;

      // Tentar Edge Function
      if (SUPABASE_URL && SUPABASE_URL !== 'your_supabase_url') {
        try {
          logger.debug('Calling Gemini via Edge Function');
          const token = session.access_token;
          const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

          const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-generic`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'calorie-calculation',
              prompt,
              systemInstruction,
              temperature: 0.3,
              topP: 0.8,
              maxOutputTokens: 500,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            logger.warn('Edge Function failed', { status: response.status, error: errorData });

            if (response.status === 429 || errorData?.error?.includes('Rate limit')) {
              throw new Error('Limite de uso atingido. Tente novamente em instantes.');
            }

            if (response.status === 401) {
              throw new Error('Sessão expirada. Faça login novamente.');
            }

            throw new Error(errorData?.error || 'Falha ao calcular metas calóricas.');
          }

          const data = await response.json();
          logger.debug('Response received from Edge Function');

          // Tentar extrair JSON da resposta
          let result = data.response?.trim() || '';

          // Remover markdown code blocks se presente
          result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

          const parsed = JSON.parse(result);

          // Validar estrutura da resposta
          if (!parsed.totalDaily || !parsed.breakfast || !parsed.lunch || !parsed.dinner || !parsed.snack) {
            throw new Error('Resposta da IA incompleta');
          }

          return parsed as CalorieGoalResponse;
        } catch (edgeError) {
          logger.error('Error calling Edge Function', edgeError);
          throw edgeError;
        }
      }

      throw new Error('Configuração do Supabase não encontrada');
    } catch (error: any) {
      logger.error('Error calculating calorie goals', error);

      // Fallback: cálculo manual simples
      logger.info('Using fallback calorie calculation');
      return this.calculateFallback(params);
    }
  },

  /**
   * Cálculo fallback manual (sem IA)
   */
  calculateFallback(params: CalorieGoalRequest): CalorieGoalResponse {
    // Fórmula de Mifflin-St Jeor
    let tmb: number;
    if (params.gender === 'male') {
      tmb = (10 * params.weight) + (6.25 * params.height) - (5 * params.age) + 5;
    } else {
      tmb = (10 * params.weight) + (6.25 * params.height) - (5 * params.age) - 161;
    }

    // Ajustar para nível de atividade
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9
    };

    let totalDaily = Math.round(tmb * activityMultipliers[params.activityLevel]);

    // Ajustar para objetivo
    if (params.goal === 'lose') {
      totalDaily -= 500;
    } else if (params.goal === 'gain') {
      totalDaily += 400;
    }

    // Arredondar para múltiplo de 50
    totalDaily = Math.round(totalDaily / 50) * 50;

    // Distribuir entre refeições
    const breakfast = Math.round((totalDaily * 0.27) / 50) * 50;
    const lunch = Math.round((totalDaily * 0.37) / 50) * 50;
    const dinner = Math.round((totalDaily * 0.27) / 50) * 50;

    // Calcular lanches (restante dividido por 2 lanches)
    const snackQuantity = 2;
    const remainingCalories = totalDaily - (breakfast + lunch + dinner);
    const snack = Math.round((remainingCalories / snackQuantity) / 50) * 50;

    const goalText = params.goal === 'lose' ? 'perder peso' : params.goal === 'gain' ? 'ganhar peso' : 'manter seu peso';
    const explanation = `Para ${goalText}, recomendamos ${totalDaily} kcal/dia, distribuídas em 3 refeições principais e ${snackQuantity} lanches.`;

    return {
      totalDaily,
      breakfast,
      lunch,
      dinner,
      snack,
      snackQuantity,
      explanation
    };
  },

  /**
   * Converte nível de atividade para texto descritivo
   */
  getActivityLevelText(level: string): string {
    const texts: { [key: string]: string } = {
      sedentary: 'Sedentário (pouco ou nenhum exercício)',
      lightly_active: 'Levemente ativo (exercício 1-3 dias/semana)',
      moderately_active: 'Moderadamente ativo (exercício 3-5 dias/semana)',
      very_active: 'Muito ativo (exercício 6-7 dias/semana)',
      extra_active: 'Extremamente ativo (exercício 2x/dia ou trabalho físico intenso)'
    };
    return texts[level] || 'Não informado';
  }
};
