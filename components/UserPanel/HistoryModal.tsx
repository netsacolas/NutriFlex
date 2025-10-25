import React, { useState } from 'react';
import { MealHistory } from './MealHistory';
import { WeightHistory } from './WeightHistory';
import { PhysicalActivityHistory } from './PhysicalActivityHistory';
import { NutritionChat } from './NutritionChat';

type HistoryTab = 'meals' | 'weight' | 'activities';

export const HistoryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('meals');
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-card-bg rounded-xl w-full max-w-6xl my-8 border border-border-color shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-t-xl relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white text-2xl hover:opacity-80 transition-opacity z-10"
            >
              &times;
            </button>

            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-3">
                <div className="text-4xl">📊</div>
                <div>
                  <h2 className="text-xl font-bold text-white">Histórico Completo</h2>
                  <p className="text-white/80 text-sm">Acompanhe sua evolução ao longo do tempo</p>
                </div>
              </div>

              <button
                onClick={() => setShowChat(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
              >
                <span className="text-lg">🤖</span>
                <span>Assistente de IA</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border-color bg-secondary-bg">
            <button
              onClick={() => setActiveTab('meals')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'meals'
                  ? 'text-accent-orange border-b-2 border-accent-orange bg-hover-bg'
                  : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🍽️</span>
                <span>Refeições</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('activities')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'activities'
                  ? 'text-accent-orange border-b-2 border-accent-orange bg-hover-bg'
                  : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🏃</span>
                <span>Atividades</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('weight')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'weight'
                  ? 'text-accent-orange border-b-2 border-accent-orange bg-hover-bg'
                  : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">⚖️</span>
                <span>Pesagens</span>
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {activeTab === 'meals' && (
              <div>
                <div className="mb-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg p-4">
                  <p className="text-text-secondary text-sm">
                    <span className="font-semibold text-accent-orange">💡 Dica:</span> Todos os dados de suas refeições são
                    usados pelo assistente nutricional para fornecer recomendações personalizadas!
                  </p>
                </div>
                <MealHistory />
              </div>
            )}

            {activeTab === 'activities' && (
              <div>
                <div className="mb-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-text-secondary text-sm">
                    <span className="font-semibold text-purple-500">💡 Dica:</span> Registre todas suas atividades físicas
                    para ter um controle completo do seu gasto calórico!
                  </p>
                </div>
                <PhysicalActivityHistory />
              </div>
            )}

            {activeTab === 'weight' && (
              <div>
                <div className="mb-4 bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-text-secondary text-sm">
                    <span className="font-semibold text-green-500">💡 Dica:</span> Acompanhe seu progresso ao longo do tempo
                    e receba análises personalizadas da IA sobre sua evolução!
                  </p>
                </div>
                <WeightHistory />
              </div>
            )}
          </div>

          {/* Footer with Quick Stats */}
          <div className="bg-secondary-bg p-4 rounded-b-xl border-t border-border-color">
            <div className="flex items-center justify-center gap-8 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <span>Continue registrando para melhores análises</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📈</span>
                <span>Seus dados ajudam a IA a te ajudar melhor</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <NutritionChat
          context={{
            profile: undefined,
            weightHistory: [],
            recentMeals: [],
          }}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
};
