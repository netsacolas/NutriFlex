import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SparklesIcon } from './Layout/Icons';

const AIAssistantFAB: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPulse, setIsPulse] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Pulsar durante os primeiros 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPulse(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Não mostrar o botão se já estiver na página do chat
  if (location.pathname === '/chat') {
    return null;
  }

  const handleClick = () => {
    // Verificar se há histórico de conversa
    const hasHistory = localStorage.getItem('chatHistory');

    if (hasHistory) {
      setShowModal(true);
    } else {
      navigate('/chat');
    }
  };

  const handleNewConversation = () => {
    localStorage.removeItem('chatHistory');
    setShowModal(false);
    navigate('/chat');
  };

  const handleContinueConversation = () => {
    setShowModal(false);
    navigate('/chat');
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={handleClick}
        className={`fixed bottom-24 right-6 z-40 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-purple-500/50 ${
          isPulse ? 'animate-bounce' : ''
        }`}
        aria-label="Abrir Assistente de IA"
      >
        <SparklesIcon className="w-8 h-8 text-white animate-pulse" />
      </button>

      {/* Badge "Novo" opcional */}
      {isPulse && (
        <div className="fixed bottom-[140px] right-4 z-40 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
          IA
        </div>
      )}

      {/* Modal de Escolha */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform animate-slideIn">
            {/* Header */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Assistente de IA
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Como você gostaria de continuar?
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleContinueConversation}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
              >
                💬 Continuar Conversa Anterior
              </button>

              <button
                onClick={handleNewConversation}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                ✨ Iniciar Nova Conversa
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistantFAB;
