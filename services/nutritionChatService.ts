import { GoogleGenAI } from '@google/genai';
import type { UserProfile, WeightEntry, MealResult } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('⚠️ VITE_GEMINI_API_KEY não configurada');
}

const ai = new GoogleGenAI({ apiKey: API_KEY || 'YOUR_API_KEY_HERE' });

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UserContext {
  profile: UserProfile | null;
  weightHistory: WeightEntry[];
  recentMeals: MealResult[];
}

export const nutritionChatService = {
  /**
   * Cria o contexto do usuário para a IA
   */
  buildUserContext(context: UserContext): string {
    const { profile, weightHistory, recentMeals } = context;

    let contextText = '**Informações do Usuário:**\n\n';

    if (profile) {
      contextText += `- Nome: ${profile.full_name || 'Não informado'}\n`;
      contextText += `- Idade: ${profile.age || 'Não informada'}\n`;
      contextText += `- Peso atual: ${profile.weight || 'Não informado'} kg\n`;
      contextText += `- Altura: ${profile.height || 'Não informada'} cm\n`;

      if (profile.health_goals && profile.health_goals.length > 0) {
        contextText += `- Objetivos de saúde: ${profile.health_goals.join(', ')}\n`;
      }

      if (profile.dietary_preferences && profile.dietary_preferences.length > 0) {
        contextText += `- Preferências alimentares: ${profile.dietary_preferences.join(', ')}\n`;
      }

      if (profile.allergies && profile.allergies.length > 0) {
        contextText += `- Alergias/Restrições: ${profile.allergies.join(', ')}\n`;
      }
    }

    if (weightHistory && weightHistory.length > 0) {
      contextText += `\n**Histórico de Pesagens (últimas ${Math.min(5, weightHistory.length)}):**\n`;
      weightHistory.slice(0, 5).forEach((entry, index) => {
        const date = new Date(entry.measured_at).toLocaleDateString('pt-BR');
        contextText += `${index + 1}. ${date}: ${entry.weight} kg`;
        if (entry.bmi) contextText += ` (IMC: ${entry.bmi})`;
        if (entry.notes) contextText += ` - Nota: "${entry.notes}"`;
        contextText += '\n';
      });

      // Calcular tendência
      if (weightHistory.length >= 2) {
        const latest = weightHistory[0].weight;
        const oldest = weightHistory[weightHistory.length - 1].weight;
        const diff = latest - oldest;
        contextText += `\nTendência geral: ${diff > 0 ? 'Ganho' : diff < 0 ? 'Perda' : 'Manutenção'} de ${Math.abs(diff).toFixed(1)} kg\n`;
      }
    }

    if (recentMeals && recentMeals.length > 0) {
      contextText += `\n**Refeições Recentes Planejadas:**\n`;
      recentMeals.slice(0, 3).forEach((meal, index) => {
        contextText += `${index + 1}. ${meal.totalCalories} kcal - Alimentos: ${meal.portions.map(p => p.foodName).join(', ')}\n`;
      });
    }

    if (!profile && (!weightHistory || weightHistory.length === 0)) {
      contextText += '\nAinda não tenho muitas informações sobre você. Me conte mais sobre seus objetivos e hábitos!\n';
    }

    return contextText;
  },

  /**
   * Envia mensagem ao chat e recebe resposta da IA
   */
  async sendMessage(
    message: string,
    context: UserContext,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      console.log('📨 Chat - Mensagem recebida:', message);
      console.log('🔑 API Key configurada:', !!API_KEY);
      console.log('👤 Contexto do usuário:', context.profile?.full_name);

      if (!API_KEY) {
        console.error('❌ API Key não configurada!');
        return 'Desculpe, o serviço de chat está indisponível no momento. Configure a API Key do Gemini.';
      }

      // Verificar se a mensagem é sobre nutrição/saúde
      console.log('🔍 Verificando se mensagem é sobre nutrição...');
      const isOffTopic = await this.checkIfOffTopic(message);
      console.log('✅ Resultado off-topic:', isOffTopic);
      if (isOffTopic) {
        return `Olá! Eu sou um assistente especializado em nutrição e saúde.

Posso ajudar você com:
- Dicas de alimentação saudável
- Análise de hábitos alimentares
- Sugestões de refeições balanceadas
- Orientações sobre metas de peso
- Informações nutricionais
- Motivação e acompanhamento

Por favor, faça perguntas relacionadas a nutrição, saúde ou seus objetivos de bem-estar. Como posso ajudar você hoje?`;
      }

      // Montar contexto do usuário
      const userContextText = this.buildUserContext(context);

      // Construir prompt completo com histórico
      let fullPrompt = userContextText + '\n\n---\n\n**Conversa:**\n\n';

      conversationHistory.forEach(msg => {
        fullPrompt += `${msg.role === 'user' ? 'Usuário' : 'NutriBot'}: ${msg.content}\n\n`;
      });

      fullPrompt += `Usuário: ${message}\n\nNutriBot:`;

      console.log('🤖 Enviando mensagem para Gemini...');
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: fullPrompt,
        config: {
          systemInstruction: `Você é NutriBot, um assistente nutricional especializado e amigável.

**Regras Fundamentais:**
1. APENAS responda perguntas sobre nutrição, saúde, alimentação e bem-estar
2. Se o usuário perguntar sobre outros assuntos, educadamente redirecione para temas de nutrição
3. Use linguagem acessível e motivadora em português brasileiro
4. Seja empático e personalizado baseado no histórico do usuário
5. Forneça informações baseadas em evidências científicas
6. Incentive hábitos saudáveis sem ser extremista
7. Nunca dê diagnósticos médicos - sempre sugira consultar profissionais quando necessário

**Seu Propósito:**
- Educar sobre nutrição e alimentação saudável
- Motivar o usuário em sua jornada de saúde
- Analisar padrões alimentares e oferecer insights
- Sugerir melhorias graduais e sustentáveis
- Celebrar conquistas e encorajar em desafios

**Tom:**
- Amigável e acolhedor
- Motivador e positivo
- Profissional mas acessível
- Empático e compreensivo

Lembre-se: Você está aqui para ajudar o usuário a ter uma relação mais saudável com a alimentação!`,
          temperature: 0.9,
          topP: 0.95,
          maxOutputTokens: 800
        }
      });

      console.log('✅ Resposta recebida da Gemini');
      const response = result.text.trim();
      console.log('📝 Texto da resposta:', response.substring(0, 100) + '...');

      return response;
    } catch (error: any) {
      console.error('Error in nutrition chat:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response?.data
      });

      // Mensagem de erro mais específica
      if (error?.message?.includes('API key')) {
        return 'Erro: API Key do Gemini não configurada. Verifique as variáveis de ambiente.';
      }

      if (error?.message?.includes('quota')) {
        return 'Erro: Limite de uso da API excedido. Tente novamente mais tarde.';
      }

      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        return 'Erro de conexão. Verifique sua internet e tente novamente.';
      }

      return `Desculpe, ocorreu um erro ao processar sua mensagem: ${error?.message || 'Erro desconhecido'}. Por favor, tente novamente.`;
    }
  },

  /**
   * Verifica se a mensagem é sobre assuntos não relacionados a nutrição/saúde
   */
  async checkIfOffTopic(message: string): Promise<boolean> {
    // Lista de palavras-chave que indicam tópicos relacionados
    const nutritionKeywords = [
      'comida', 'alimento', 'nutrição', 'dieta', 'peso', 'kg', 'calorias',
      'kcal', 'proteína', 'carboidrato', 'gordura', 'fibra', 'vitamina',
      'mineral', 'saúde', 'emagrecer', 'engordar', 'imc', 'refeição',
      'café', 'almoço', 'jantar', 'lanche', 'comer', 'alimentação',
      'saudável', 'balanceado', 'meta', 'objetivo', 'exercício', 'treino',
      'fitness', 'bem-estar', 'energia', 'cansaço', 'disposição',
      'receita', 'prato', 'ingrediente', 'porção', 'quantidade'
    ];

    const lowerMessage = message.toLowerCase();

    // Se contém alguma palavra-chave de nutrição, não está off-topic
    if (nutritionKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return false;
    }

    // Verificar se são perguntas muito genéricas que podem ser respondidas no contexto nutricional
    const genericQuestions = ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'como vai', 'ajuda', 'help'];
    if (genericQuestions.some(q => lowerMessage === q || lowerMessage.startsWith(q))) {
      return false; // Permitir saudações
    }

    // Se a mensagem é muito curta (< 15 caracteres), provavelmente não é off-topic
    if (message.length < 15) {
      return false;
    }

    // Verificar tópicos claramente off-topic
    const offTopicKeywords = [
      'futebol', 'política', 'filme', 'série', 'jogo', 'música',
      'tempo', 'clima', 'notícia', 'economia', 'bolsa', 'ação',
      'carro', 'moto', 'viagem', 'hotel', 'programação', 'código'
    ];

    return offTopicKeywords.some(keyword => lowerMessage.includes(keyword));
  },

  /**
   * Gera sugestões de perguntas iniciais personalizadas
   */
  getSuggestedQuestions(context: UserContext): string[] {
    const suggestions: string[] = [];

    if (context.weightHistory && context.weightHistory.length > 1) {
      suggestions.push('Como está meu progresso de peso?');
      suggestions.push('O que posso fazer para melhorar meus resultados?');
    }

    if (context.recentMeals && context.recentMeals.length > 0) {
      suggestions.push('Minhas refeições estão balanceadas?');
      suggestions.push('Como posso melhorar minha alimentação?');
    }

    if (context.profile?.weight && context.profile?.height) {
      suggestions.push('Qual é meu peso ideal?');
      suggestions.push('Quantas calorias devo consumir por dia?');
    }

    // Sugestões genéricas
    if (suggestions.length < 3) {
      const generic = [
        'Quais alimentos são bons para perder peso?',
        'Como montar um prato saudável?',
        'Dicas para manter a dieta no final de semana',
        'Qual a importância de beber água?',
        'Como aumentar o consumo de proteínas?'
      ];
      suggestions.push(...generic.slice(0, 5 - suggestions.length));
    }

    return suggestions.slice(0, 5);
  }
};
