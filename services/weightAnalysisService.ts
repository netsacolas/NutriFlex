import { GoogleGenAI } from '@google/genai';
import type { WeightEntry } from '../types';
import { getWeightDifference, getDaysBetween, getWeeklyRate, getBMIInfo } from '../utils/bmiUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('⚠️ VITE_GEMINI_API_KEY não configurada');
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

export const weightAnalysisService = {
  /**
   * Gera análise personalizada comparando pesagens usando Gemini AI
   */
  async generateWeightAnalysis(
    currentEntry: WeightEntry,
    previousEntry: WeightEntry | null,
    allHistory: WeightEntry[],
    userProfile?: { full_name?: string | null; age?: number | null; gender?: string | null }
  ): Promise<string> {
    try {
      if (!API_KEY) {
        return `Olá! 👋 Parabéns por registrar sua pesagem!\n\nAtualmente tenho poucas informações registradas sobre seus hábitos alimentares, mas estou aqui para ajudar! Se quiser conversar sobre nutrição, saúde ou tirar dúvidas, clique no botão "Abrir Chat" para conversarmos.`;
      }

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        systemInstruction: `Você é um nutricionista e coach de saúde experiente e motivador.
Analise os dados de pesagem do usuário e forneça feedback personalizado, encorajador e construtivo.
Seja empático, positivo e forneça dicas práticas e realistas.
Use uma linguagem amigável e motivadora em português brasileiro.
Mantenha a análise concisa (máximo 3-4 parágrafos curtos).`
      });

      // Calcular estatísticas
      const currentBMI = currentEntry.bmi
        ? getBMIInfo(currentEntry.weight, currentEntry.height || 0)
        : null;

      let weightDiff = 0;
      let daysBetween = 0;
      let weeklyRate = 0;
      let previousBMI = null;

      if (previousEntry) {
        weightDiff = getWeightDifference(currentEntry.weight, previousEntry.weight);
        daysBetween = getDaysBetween(currentEntry.measured_at, previousEntry.measured_at);
        weeklyRate = getWeeklyRate(weightDiff, daysBetween);

        if (previousEntry.bmi && previousEntry.height) {
          previousBMI = getBMIInfo(previousEntry.weight, previousEntry.height);
        }
      }

      // Calcular tendência geral (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentEntries = allHistory.filter(
        entry => new Date(entry.measured_at) >= thirtyDaysAgo
      );

      let generalTrend = 'sem dados suficientes';
      if (recentEntries.length >= 2) {
        const oldest = recentEntries[recentEntries.length - 1];
        const newest = recentEntries[0];
        const trendDiff = newest.weight - oldest.weight;
        generalTrend = trendDiff > 0 ? 'ganho' : trendDiff < 0 ? 'perda' : 'manutenção';
      }

      // Construir prompt
      const prompt = `
Analise esta pesagem de ${userProfile?.full_name || 'usuário'}:

**Dados Atuais:**
- Peso: ${currentEntry.weight} kg
- Altura: ${currentEntry.height || 'não informada'} cm
${currentBMI ? `- IMC: ${currentBMI.value} (${currentBMI.label})` : ''}
- Data da pesagem: ${new Date(currentEntry.measured_at).toLocaleDateString('pt-BR')}
${currentEntry.notes ? `- Observações do usuário: "${currentEntry.notes}"` : ''}

${previousEntry ? `
**Comparação com Pesagem Anterior:**
- Peso anterior: ${previousEntry.weight} kg
- Diferença: ${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} kg em ${daysBetween} dias
- Taxa semanal: ${weeklyRate > 0 ? '+' : ''}${weeklyRate.toFixed(1)} kg/semana
${previousBMI ? `- IMC anterior: ${previousBMI.value} (${previousBMI.label})` : ''}
` : '**Esta é a primeira pesagem registrada!**'}

**Tendência (últimos 30 dias):** ${generalTrend}
**Total de pesagens registradas:** ${allHistory.length}

**Instruções:**
1. Parabenize ou encoraje baseado nos resultados
2. Comente sobre a tendência e progresso
3. Se houve mudança de categoria de IMC, destaque isso positivamente
4. Dê 1-2 dicas práticas e personalizadas para o contexto do usuário
5. Termine com uma mensagem motivadora

Mantenha o tom positivo mesmo se os resultados não forem ideais. Foque em progresso e próximos passos.
`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          maxOutputTokens: 500
        }
      });

      const analysis = result.response.text();

      // Se a resposta estiver vazia ou muito curta, retornar fallback amigável
      if (!analysis || analysis.trim().length < 20) {
        return `Olá! 👋 Parabéns por registrar sua pesagem!\n\nAtualmente tenho poucas informações registradas sobre seus hábitos alimentares, mas estou aqui para ajudar! Se quiser conversar sobre nutrição, saúde ou tirar dúvidas sobre sua jornada, clique no botão "💬 Abrir Chat" para conversarmos.`;
      }

      return analysis;
    } catch (error) {
      console.error('Error generating weight analysis:', error);
      return `Olá! 👋 Bem-vindo!\n\nPesagem registrada com sucesso! Atualmente tenho poucas informações sobre seus hábitos alimentares e histórico, mas estou aqui para ajudar.\n\nSe quiser conversar sobre nutrição, metas de saúde ou tirar dúvidas, clique no botão "💬 Abrir Chat" abaixo para conversarmos de forma personalizada!`;
    }
  },

  /**
   * Gera análise rápida sem histórico completo
   */
  async generateQuickAnalysis(
    currentWeight: number,
    height: number,
    previousWeight: number | null
  ): Promise<string> {
    try {
      if (!API_KEY) {
        return 'Configure a API Key para análises personalizadas.';
      }

      const bmiInfo = getBMIInfo(currentWeight, height);
      const diff = previousWeight ? getWeightDifference(currentWeight, previousWeight) : null;

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp'
      });

      const prompt = `
Dê um feedback motivador e breve (2-3 frases) para:
- Peso atual: ${currentWeight} kg
- IMC: ${bmiInfo.value} (${bmiInfo.label})
${diff ? `- Mudança desde última pesagem: ${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg` : ''}

Seja positivo e dê uma dica prática rápida.
`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating quick analysis:', error);
      return '';
    }
  }
};
