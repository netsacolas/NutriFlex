import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { mealHistoryService } from '../services/mealHistoryService';
import { weightHistoryService } from '../services/weightHistoryService';
import { physicalActivityService } from '../services/physicalActivityService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon,
  ArrowRightIcon
} from '../components/Layout/Icons';
import type { UserProfile, MealHistory, WeightHistory } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  // User context
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentMeals, setRecentMeals] = useState<MealHistory[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    setIsLoadingContext(true);

    // Mostrar mensagem de loading
    const loadingMessage: ChatMessage = {
      id: 'loading',
      role: 'assistant',
      content: '⏳ Aguarde enquanto verifico todo seu histórico de refeições, atividades e pesagem além de nossas conversas anteriores...',
      timestamp: new Date()
    };
    setMessages([loadingMessage]);

    // Carregar contexto do usuário
    await loadUserContext();

    // Substituir mensagem de loading pela welcome message
    setIsLoadingContext(false);
    addWelcomeMessage();
  };

  useEffect(() => {
    scrollToBottom();
    // Retornar foco ao input após cada mensagem
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [messages]);

  // Foco inicial ao montar componente
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUserContext = async () => {
    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const userId = session.user.id;
      console.log('🔄 Carregando contexto do usuário...', { userId });

      // Load user profile and comprehensive history
      const [profileResult, mealsResult, weightsResult, activitiesResult] = await Promise.all([
        profileService.getProfile(),
        mealHistoryService.getUserMealHistory(userId),
        weightHistoryService.getUserWeightHistory(userId),
        physicalActivityService.getUserActivities(30) // Last 30 days
      ]);

      console.log('✅ Dados carregados:', {
        profile: !!profileResult.data,
        meals: mealsResult.data?.length || 0,
        weights: weightsResult.data?.length || 0,
        activities: activitiesResult.data?.length || 0
      });

      setProfile(profileResult.data);

      // Refeições da última semana
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekMeals = (mealsResult.data || []).filter(meal =>
        new Date(meal.consumed_at) >= oneWeekAgo
      );
      setRecentMeals(weekMeals);

      // Últimas 20 pesagens
      setWeightHistory((weightsResult.data || []).slice(0, 20));

      // Últimas 30 atividades físicas
      setRecentActivities((activitiesResult.data || []).slice(0, 30));

      console.log('✅ Contexto carregado:', {
        weekMeals: weekMeals.length,
        weights: weightsResult.data?.slice(0, 20).length || 0,
        activities: activitiesResult.data?.slice(0, 30).length || 0
      });
    } catch (error) {
      console.error('❌ Erro ao carregar contexto:', error);
    }
  };

  const loadChatHistory = () => {
    try {
      const saved = localStorage.getItem('chatHistory');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Converter timestamps de string para Date
        const messages = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messages);
        return true;
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
    return false;
  };

  const saveChatHistory = (messages: ChatMessage[]) => {
    try {
      // Salvar apenas últimas 20 mensagens (10 conversas de ida e volta)
      const toSave = messages.slice(-20);
      localStorage.setItem('chatHistory', JSON.stringify(toSave));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const addWelcomeMessage = () => {
    // Tentar carregar histórico primeiro
    const hasHistory = loadChatHistory();

    if (!hasHistory) {
      const welcome: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Olá! 👋 Sou seu consultor nutricional prático! Meu foco é te ajudar a comer bem com o que você JÁ TEM em casa, sem precisar comprar nada especial. Vamos montar suas refeições balanceadas juntos?',
        timestamp: new Date()
      };
      setMessages([welcome]);
      saveChatHistory([welcome]);
    }
  };

  const buildContextPrompt = () => {
    let context = `VOCÊ É UM CONSULTOR NUTRICIONAL PRÁTICO E ACESSÍVEL:

⚠️ RESTRIÇÃO IMPORTANTE - ESCOPO DE ATUAÇÃO:
- Você APENAS responde perguntas sobre SAÚDE, NUTRIÇÃO, ALIMENTAÇÃO, EXERCÍCIOS FÍSICOS e QUALIDADE DE VIDA
- Para perguntas NÃO relacionadas a esses temas, responda educadamente:
  "Desculpe, sou especializado apenas em nutrição, alimentação e saúde. Não fui treinado para responder sobre outros assuntos. Como posso ajudá-lo com suas metas nutricionais ou de saúde?"
- Exemplos do que você PODE responder: alimentação, calorias, macronutrientes, receitas, exercícios, peso, IMC, hidratação, sono, hábitos saudáveis
- Exemplos do que você NÃO PODE responder: política, tecnologia, entretenimento, história, matemática, programação, etc.

🎯 SUA FILOSOFIA:
- NÃO prescreva dietas rígidas ou liste alimentos específicos
- NÃO sugira comprar ingredientes caros ou difíceis de encontrar
- FOQUE em trabalhar com o que o usuário JÁ TEM em casa
- Ensine a DISTRIBUIR corretamente os macronutrientes
- Ajude a BALANCEAR refeições com alimentos comuns

🍽️ SUA ABORDAGEM:
1. Pergunte quais ingredientes/alimentos o usuário tem disponível
2. Sugira QUANTIDADES e PORÇÕES para atingir as metas
3. Ensine a distribuição 40% carboidratos, 30% proteína, 30% gordura
4. Use medidas caseiras brasileiras (colher, xícara, unidade)
5. Seja flexível - se não tem um ingrediente, adapte com outro

💡 EXEMPLOS DO SEU ESTILO:
❌ ERRADO: "Você deve comer 200g de peito de frango, 100g de batata doce..."
✅ CERTO: "Que proteínas você tem em casa? Frango, ovo, carne? Com elas a gente monta seu almoço!"

❌ ERRADO: "Compre quinoa, chia, whey protein..."
✅ CERTO: "Arroz e feijão que você já tem são ótimos! Vamos calcular as porções certas?"

ESTILO DE COMUNICAÇÃO:
- Respostas CURTAS e DIRETAS (máximo 2-3 frases por vez)
- Tom amigável, motivador e próximo (use "você", faça perguntas)
- Evite textos longos - prefira diálogo interativo
- Use emojis ocasionalmente para humanizar
- Seja específico aos dados do usuário
- Pergunte sobre os ingredientes disponíveis antes de sugerir

═══════════════════════════════════════════════════════════

📊 DADOS CORPORAIS E METAS DO CLIENTE:
`;

    // Contexto do perfil completo
    if (profile) {
      const bmi = profile.weight && profile.height
        ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
        : null;

      const getBMICategory = (bmi: number) => {
        if (bmi < 18.5) return 'Abaixo do peso';
        if (bmi < 25) return 'Peso normal';
        if (bmi < 30) return 'Sobrepeso';
        if (bmi < 35) return 'Obesidade grau I';
        if (bmi < 40) return 'Obesidade grau II';
        return 'Obesidade grau III';
      };

      if (profile.full_name) context += `Nome: ${profile.full_name}\n`;
      if (profile.age) context += `Idade: ${profile.age} anos\n`;
      if (profile.gender) context += `Sexo: ${profile.gender === 'male' ? 'Masculino' : 'Feminino'}\n`;
      if (profile.weight) context += `Peso atual: ${profile.weight} kg\n`;
      if (profile.height) context += `Altura: ${profile.height} cm\n`;
      if (bmi) {
        const category = getBMICategory(parseFloat(bmi));
        context += `IMC: ${bmi} (${category})\n`;
      }

      // Metas de calorias detalhadas
      const breakfastCal = profile.breakfast_calories || 0;
      const lunchCal = profile.lunch_calories || 0;
      const dinnerCal = profile.dinner_calories || 0;
      const snackCal = profile.snack_calories || 0;
      const dailyCalories = breakfastCal + lunchCal + dinnerCal + snackCal;

      if (dailyCalories > 0) {
        context += `\nMetas Calóricas Diárias:\n`;
        context += `- Café da manhã: ${breakfastCal} kcal\n`;
        context += `- Almoço: ${lunchCal} kcal\n`;
        context += `- Jantar: ${dinnerCal} kcal\n`;
        context += `- Lanches: ${snackCal} kcal\n`;
        context += `- TOTAL DIÁRIO: ${dailyCalories} kcal\n`;
      }
      context += '\n';
    }

    // Histórico de peso detalhado (últimas 20 pesagens)
    if (weightHistory.length > 0) {
      context += `⚖️ HISTÓRICO DE PESO (últimas ${weightHistory.length} pesagens):\n`;

      const latest = weightHistory[0];
      const oldest = weightHistory[weightHistory.length - 1];
      const totalVariation = latest.weight - oldest.weight;
      const daysSpan = Math.round((new Date(latest.measured_at).getTime() - new Date(oldest.measured_at).getTime()) / (1000 * 60 * 60 * 24));

      context += `Peso atual: ${latest.weight} kg (${new Date(latest.measured_at).toLocaleDateString('pt-BR')})\n`;

      if (weightHistory.length > 1) {
        context += `Variação total: ${totalVariation > 0 ? '+' : ''}${totalVariation.toFixed(1)} kg em ${daysSpan} dias\n`;

        // Últimas 5 pesagens para tendência
        context += `Últimas pesagens:\n`;
        weightHistory.slice(0, 5).forEach((w, idx) => {
          const date = new Date(w.measured_at).toLocaleDateString('pt-BR');
          if (idx > 0) {
            const prev = weightHistory[idx - 1];
            const diff = w.weight - prev.weight;
            context += `  ${date}: ${w.weight} kg (${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg)\n`;
          } else {
            context += `  ${date}: ${w.weight} kg (atual)\n`;
          }
        });
      }
      context += '\n';
    }

    // Atividades físicas recentes (últimas 30)
    if (recentActivities.length > 0) {
      context += `🏃 ATIVIDADES FÍSICAS RECENTES (últimas ${recentActivities.length}):\n`;

      const totalCaloriesBurned = recentActivities.reduce((sum, act) => sum + (act.calories_burned || 0), 0);
      const totalMinutes = recentActivities.reduce((sum, act) => sum + act.duration_minutes, 0);

      context += `Total queimado: ${totalCaloriesBurned.toFixed(0)} kcal em ${totalMinutes} minutos\n`;

      // Agrupar por tipo de atividade
      const activitiesByType: Record<string, number> = {};
      recentActivities.forEach(act => {
        activitiesByType[act.activity_type] = (activitiesByType[act.activity_type] || 0) + 1;
      });

      context += `Atividades mais frequentes:\n`;
      Object.entries(activitiesByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([type, count]) => {
          context += `  - ${type}: ${count}x\n`;
        });

      // Últimas 5 atividades
      context += `Últimas atividades:\n`;
      recentActivities.slice(0, 5).forEach(act => {
        const date = new Date(act.performed_at).toLocaleDateString('pt-BR');
        context += `  ${date}: ${act.activity_type} (${act.duration_minutes}min, -${act.calories_burned}kcal)\n`;
      });
      context += '\n';
    }

    // Refeições da última semana
    if (recentMeals.length > 0) {
      context += `🍽️ REFEIÇÕES DA ÚLTIMA SEMANA (${recentMeals.length} refeições):\n`;

      const totalCaloriesConsumed = recentMeals.reduce((sum, meal) => sum + meal.total_calories, 0);
      const avgCaloriesPerMeal = totalCaloriesConsumed / recentMeals.length;

      context += `Calorias totais consumidas: ${totalCaloriesConsumed.toFixed(0)} kcal\n`;
      context += `Média por refeição: ${avgCaloriesPerMeal.toFixed(0)} kcal\n`;

      // Agrupar por tipo de refeição
      const mealsByType: Record<string, number> = {};
      recentMeals.forEach(meal => {
        mealsByType[meal.meal_type] = (mealsByType[meal.meal_type] || 0) + 1;
      });

      const mealTypeLabels: Record<string, string> = {
        breakfast: 'Café da manhã',
        lunch: 'Almoço',
        dinner: 'Jantar',
        snack: 'Lanche'
      };

      context += `Distribuição:\n`;
      Object.entries(mealsByType).forEach(([type, count]) => {
        context += `  - ${mealTypeLabels[type]}: ${count}x\n`;
      });

      // Últimas 5 refeições com detalhes
      context += `Últimas refeições:\n`;
      recentMeals.slice(0, 5).forEach(meal => {
        const date = new Date(meal.consumed_at).toLocaleDateString('pt-BR');
        const foods = meal.food_items?.slice(0, 3).join(', ') || 'Sem detalhes';
        context += `  ${date} - ${mealTypeLabels[meal.meal_type]}: ${meal.total_calories}kcal\n`;
        context += `    Alimentos: ${foods}\n`;
      });
      context += '\n';
    }

    context += `═══════════════════════════════════════════════════════════\n\n`;

    // Histórico de conversa (últimas 10 mensagens)
    const recentMessages = messages.slice(-10);
    if (recentMessages.length > 1) {
      context += `💬 CONVERSA ANTERIOR:\n`;
      recentMessages.forEach((msg) => {
        if (msg.role === 'user') {
          context += `Cliente: ${msg.content}\n`;
        } else if (msg.content !== 'Olá! 👋 Sou seu consultor nutricional, personal trainer e especialista em vida saudável! Vamos conversar sobre seus objetivos? O que você gostaria de saber?') {
          context += `Você: ${msg.content}\n`;
        }
      });
      context += '\n';
    }

    context += `═══════════════════════════════════════════════════════════

INSTRUÇÕES PARA RESPOSTA:
⛔ PRIMEIRA VERIFICAÇÃO: A pergunta é sobre saúde/nutrição/alimentação/exercícios?
   - Se NÃO: responda "Desculpe, sou especializado apenas em nutrição, alimentação e saúde. Não fui treinado para responder sobre outros assuntos. Como posso ajudá-lo com suas metas nutricionais ou de saúde?"
   - Se SIM: continue com as instruções abaixo
✅ Respostas com 2-3 frases no máximo
✅ Faça UMA pergunta por vez para aprofundar
✅ SEMPRE pergunte quais ingredientes o usuário tem disponível
✅ NÃO sugira comprar alimentos - trabalhe com o que ele já tem
✅ Ensine QUANTIDADES e PORÇÕES (ex: "2 colheres de arroz, 1 filé pequeno")
✅ Explique a distribuição de macros de forma simples
✅ Use os DADOS REAIS do cliente (meta calórica, histórico)
✅ Seja flexível: "Não tem X? Pode usar Y que dá no mesmo!"
✅ Foque em PRATICIDADE e SIMPLICIDADE
`;

    return context;
  };

  const simulateTyping = async (response: string) => {
    setIsTyping(true);
    const words = response.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];

      // Update the last message with current text
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages[newMessages.length - 1].content = currentText;
        }
        return newMessages;
      });

      // Small delay between words for typing effect
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    setIsTyping(false);

    // Retornar foco após terminar de digitar
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userQuestion = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Manter foco no input após enviar
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    try {
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

      if (!API_KEY) {
        throw new Error('API Key não configurada');
      }

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      });

      // Construir contexto do usuário
      const contextPrompt = buildContextPrompt();
      const fullPrompt = `${contextPrompt}\n\nPergunta do usuário: ${userQuestion}`;

      console.log('📤 Enviando para Gemini:', {
        question: userQuestion,
        contextLength: contextPrompt.length,
        hasProfile: !!profile,
        hasMeals: recentMeals.length,
        hasWeights: weightHistory.length,
        hasActivities: recentActivities.length
      });

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const responseText = response.text();

      console.log('Resposta recebida do Gemini');

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
      await simulateTyping(responseText);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date()
      };
      const updatedMessages = [...messages, userMessage, errorMessage];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Shift+Enter permite quebra de linha (comportamento padrão do textarea)
  };

  const quickQuestions = [
    'Como montar um almoço balanceado?',
    'Que quantidade de arroz posso comer?',
    'Como distribuir proteína, carbo e gordura?',
    'Como saber as porções certas?'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 pt-12 pb-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-2">
            <ChatBubbleBottomCenterTextIcon className="w-7 h-7 text-white mr-3" />
            <h1 className="text-white text-2xl font-bold">Assistente Nutricional</h1>
          </div>
          <p className="text-white/80">Seu consultor pessoal de nutrição e treino</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white shadow-md text-gray-800'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center mb-1">
                    <SparklesIcon className="w-4 h-4 text-purple-500 mr-1" />
                    <span className="text-xs font-medium text-purple-600">IA Nutricional</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white shadow-md rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-600 mb-2">Sugestões de perguntas:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputMessage(question);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta... (Enter para enviar, Shift+Enter para nova linha)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                !inputMessage.trim() || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRightIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Powered by Gemini AI • Suas informações são usadas apenas para personalizar as respostas
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;