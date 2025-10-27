import type { UserProfile, WeightEntry, MealResult } from '../types';
import logger from '../utils/logger';
import { supabase } from './supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
   * Obtém o período do dia e saudação apropriada
   */
  getTimeOfDayInfo(): { period: string; greeting: string; mealContext: string } {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return {
        period: 'manhã',
        greeting: 'Bom dia',
        mealContext: 'É manhã, momento ideal para um café da manhã nutritivo que dará energia para o dia.'
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        period: 'tarde',
        greeting: 'Boa tarde',
        mealContext: 'É tarde, hora de pensar em almoço ou lanches que mantenham sua energia até o jantar.'
      };
    } else {
      return {
        period: 'noite',
        greeting: 'Boa noite',
        mealContext: 'É noite, momento de considerar um jantar leve e nutritivo para uma boa noite de sono.'
      };
    }
  },

  /**
   * Cria o contexto do usuário para a IA
   */
  buildUserContext(context: UserContext): string {
    const { profile, weightHistory, recentMeals } = context;
    const timeInfo = this.getTimeOfDayInfo();

    let contextText = `**Horário Atual:**\n- Período: ${timeInfo.period}\n- ${timeInfo.mealContext}\n\n`;
    contextText += '**Informações do Usuário:**\n\n';

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
      logger.debug('Chat message received');

      // Verificar autenticação
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        logger.error('User not authenticated for chat');
        return 'Você precisa estar logado para usar o chat.';
      }

      // Verificar se a mensagem é sobre nutrição/saúde
      logger.debug('Checking if message is off-topic');
      const isOffTopic = await this.checkIfOffTopic(message);
      logger.debug('Off-topic result: ' + isOffTopic);
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

      // Obter informação de horário
      const timeInfo = this.getTimeOfDayInfo();

      // Montar contexto do usuário
      const userContextText = this.buildUserContext(context);

      // Construir prompt completo com histórico
      let fullPrompt = userContextText + '\n\n---\n\n**Conversa:**\n\n';

      conversationHistory.forEach(msg => {
        fullPrompt += `${msg.role === 'user' ? 'Usuário' : 'NutriBot'}: ${msg.content}\n\n`;
      });

      fullPrompt += `Usuário: ${message}\n\n⏰ LEMBRETE: Agora é ${timeInfo.period} (${timeInfo.greeting.toLowerCase()}). ${timeInfo.mealContext}\n\nNutriBot:`;

      const systemInstruction = `Você é NutriBot, um assistente nutricional especializado e amigável.

🕐 **CONTEXTO TEMPORAL CRÍTICO - LEIA COM ATENÇÃO:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ HORÁRIO ATUAL: ${timeInfo.period.toUpperCase()} (${timeInfo.greeting})
📝 CONTEXTO DA REFEIÇÃO: ${timeInfo.mealContext}

⚠️ REGRAS OBRIGATÓRIAS SOBRE HORÁRIO:
1. NUNCA sugira café da manhã se for tarde ou noite
2. NUNCA sugira jantar se for manhã
3. NUNCA sugira almoço se for noite
4. SEMPRE adapte suas sugestões ao período atual
5. Se o usuário perguntar "o que comer?", responda baseado no horário atual
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Formato de Resposta:**
- SEMPRE inicie suas respostas considerando o horário atual
- Se for pergunta sobre alimentação, mencione explicitamente o período do dia
- Exemplo manhã: "Como é manhã, sugiro um café da manhã com..."
- Exemplo tarde: "Para esta hora da tarde, recomendo..."
- Exemplo noite: "Já que é noite, o ideal seria um jantar leve..."

**Regras Fundamentais:**
1. APENAS responda perguntas sobre nutrição, saúde, alimentação e bem-estar
2. Se o usuário perguntar sobre outros assuntos, educadamente redirecione para temas de nutrição
3. Use linguagem acessível e motivadora em português brasileiro
4. Seja empático e personalizado baseado no histórico do usuário
5. Forneça informações baseadas em evidências científicas
6. Incentive hábitos saudáveis sem ser extremista
7. Nunca dê diagnósticos médicos - sempre sugira consultar profissionais quando necessário
8. **CRUCIAL**: Sempre leve em conta o horário atual ao fazer sugestões de refeições ou dicas
9. **OBRIGATÓRIO**: Mencione o período do dia nas suas respostas quando relevante

**Seu Propósito:**
- Educar sobre nutrição e alimentação saudável
- Motivar o usuário em sua jornada de saúde
- Analisar padrões alimentares e oferecer insights
- Sugerir melhorias graduais e sustentáveis
- Celebrar conquistas e encorajar em desafios
- Dar orientações contextualizadas ao momento do dia

**Tom:**
- Amigável e acolhedor
- Motivador e positivo
- Profissional mas acessível
- Empático e compreensivo

Lembre-se: Você está aqui para ajudar o usuário a ter uma relação mais saudável com a alimentação, sempre considerando o contexto temporal!`;

      // Tentar primeiro a Edge Function se o URL do Supabase estiver configurado
      if (SUPABASE_URL && SUPABASE_URL !== 'your_supabase_url') {
        try {
          logger.debug('Tentando Edge Function do Supabase');
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
              type: 'nutrition-chat',
              prompt: fullPrompt,
              systemInstruction,
              temperature: 0.9,
              topP: 0.95,
              maxOutputTokens: 800,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            logger.warn('Edge Function falhou', {
              status: response.status,
              error: errorData,
            });

            if (response.status === 429 || errorData?.error?.includes('Rate limit')) {
              return 'Você atingiu o limite de uso do assistente. Tente novamente em instantes.';
            }

            if (response.status === 401) {
              return 'Sua sessão expirou. Faça login novamente para continuar.';
            }

            throw new Error(errorData?.error || 'Falha ao se comunicar com a Edge Function.');
          }

          const data = await response.json();
          logger.debug('Resposta recebida da Edge Function');
          return data.response?.trim() || 'Desculpe, não consegui gerar uma resposta.';
        } catch (edgeError) {
          logger.warn('Erro ao chamar Edge Function', edgeError);
        }
      }

      throw new Error('Não foi possível obter resposta da IA. Tente novamente em instantes.');
    } catch (error: any) {
      logger.error('Error in nutrition chat', error);

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
