// Serviço direto para o Gemini AI (alternativa à Edge Function)
import { GoogleGenerativeAI } from '@google/generativeai';
import logger from '../utils/logger';

// Tente primeiro a chave do environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

export const geminiDirectService = {
  /**
   * Verifica se o serviço direto está disponível
   */
  isAvailable(): boolean {
    return genAI !== null;
  },

  /**
   * Envia mensagem diretamente para o Gemini AI
   */
  async sendMessage(
    prompt: string,
    systemInstruction: string,
    temperature: number = 0.9,
    maxOutputTokens: number = 800
  ): Promise<string> {
    if (!genAI) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        systemInstruction,
        generationConfig: {
          temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens,
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      logger.error('Gemini Direct API error', error);

      if (error?.message?.includes('API_KEY_INVALID')) {
        throw new Error('API Key inválida. Verifique a configuração.');
      }

      if (error?.message?.includes('RATE_LIMIT_EXCEEDED')) {
        throw new Error('Limite de requisições excedido. Tente novamente mais tarde.');
      }

      throw error;
    }
  }
};