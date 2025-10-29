import React, { useState, useRef, useEffect } from 'react';
import { nutritionChatService, ChatMessage, UserContext } from '../../services/nutritionChatService';
import { useScrollLock } from '../../hooks/useScrollLock';
import logger from '../../utils/logger';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface Props {
  context: UserContext;
  onClose: () => void;
}

export const NutritionChat: React.FC<Props> = ({ context, onClose }) => {
  // Bloquear scroll quando modal estiver aberto
  useScrollLock(true);

  // Obter saudação baseada no horário
  const timeInfo = nutritionChatService.getTimeOfDayInfo();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `${timeInfo.greeting}! 👋 Sou seu assistente nutricional personalizado!\n\n${timeInfo.mealContext}\n\nPosso ajudar você com dicas de alimentação, análise de hábitos, sugestões de refeições e muito mais.\n\nComo posso ajudar você hoje?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [suggestions] = useState<string[]>(nutritionChatService.getSuggestedQuestions(context));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await nutritionChatService.sendMessage(messageText, context, messages);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      logger.error('Chat error', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  if (!aiChatEnabled) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl border border-emerald-100 space-y-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-emerald-500 text-2xl">✨</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Assistente Premium</h3>
          <p className="text-gray-600 text-sm">
            O chat nutricional esta disponivel apenas no plano Premium. Assine para receber orientacoes personalizadas e analises completas do seu historico.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                onClose();
                window.location.href = '/assinatura';
              }}
              className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Conhecer planos Premium
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              Agora nao
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card-bg rounded-xl w-full max-w-2xl h-[80vh] flex flex-col border border-border-color shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-primary p-4 rounded-t-xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="text-white font-bold text-lg">Assistente Nutricional</h3>
              <p className="text-white/80 text-xs">Especializado em saúde e alimentação</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary-bg">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-primary text-white'
                    : 'bg-hover-bg text-text-bright border border-border-color'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-hover-bg px-4 py-3 rounded-lg border border-border-color">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-accent-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-accent-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-accent-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sugestões */}
        {messages.length <=  1 && (
          <div className="p-3 bg-primary-bg border-t border-border-color">
            <p className="text-xs text-text-secondary mb-2">Sugestões:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(suggestion)}
                  className="text-xs px-3 py-1.5 bg-secondary-bg text-text-primary rounded-full border border-border-color hover:bg-hover-bg hover:border-accent-orange transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-primary-bg border-t border-border-color rounded-b-xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta sobre nutrição..."
              disabled={loading}
              className="flex-1 bg-secondary-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="bg-gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar
            </button>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            💡 Dica: Pergunte sobre nutrição, alimentação saudável, metas de peso e hábitos!
          </p>
        </div>
      </div>
    </div>
  );
};



