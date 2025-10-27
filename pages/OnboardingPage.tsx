import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { calorieGoalService } from '../services/calorieGoalService';
import { profileService } from '../services/profileService';
import { weightHistoryService } from '../services/weightHistoryService';
import { CheckCircleIcon, SparklesIcon } from '../components/Layout/Icons';
import { getBMIInfo } from '../utils/bmiUtils';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedGoals, setCalculatedGoals] = useState<any>(null);
  const [error, setError] = useState('');
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [editedGoals, setEditedGoals] = useState<any>(null);

  // Dados do formulário
  const [formData, setFormData] = useState({
    weight: 0,
    height: 0,
    age: 0,
    gender: 'male' as 'male' | 'female',
    goal: 'maintain' as 'lose' | 'maintain' | 'gain',
    activityLevel: 'moderately_active' as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active'
  });

  const totalSteps = 5; // Welcome + 4 steps

  // Calcular IMC em tempo real
  const bmiInfo = useMemo(() => {
    if (formData.weight > 0 && formData.height > 0) {
      return getBMIInfo(formData.weight, formData.height);
    }
    return null;
  }, [formData.weight, formData.height]);

  const handleNext = async () => {
    setError('');

    if (step === 1) {
      // Validar dados corporais
      if (!formData.weight || formData.weight < 30 || formData.weight > 300) {
        setError('Por favor, insira um peso válido (30-300 kg)');
        return;
      }
      if (!formData.height || formData.height < 100 || formData.height > 250) {
        setError('Por favor, insira uma altura válida (100-250 cm)');
        return;
      }
      if (!formData.age || formData.age < 13 || formData.age > 120) {
        setError('Por favor, insira uma idade válida (13-120 anos)');
        return;
      }
    }

    if (step === 3) {
      // Calcular metas calóricas com IA
      setIsCalculating(true);
      try {
        const goals = await calorieGoalService.calculateCalorieGoals(formData);
        setCalculatedGoals(goals);
        setEditedGoals(goals); // Inicializar editedGoals com os valores calculados
        setStep(step + 1);
      } catch (err: any) {
        setError(err.message || 'Erro ao calcular metas. Tente novamente.');
      } finally {
        setIsCalculating(false);
      }
      return;
    }

    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleEditGoal = (field: string, value: number) => {
    const updated = { ...editedGoals, [field]: value };

    // Recalcular total diário
    const totalDaily = updated.breakfast + updated.lunch + updated.dinner + (updated.snack * updated.snackQuantity);
    updated.totalDaily = totalDaily;

    setEditedGoals(updated);
  };

  const handleToggleEdit = () => {
    if (isEditingGoals) {
      // Salvando edições
      setCalculatedGoals(editedGoals);
    }
    setIsEditingGoals(!isEditingGoals);
  };

  const handleResetToAI = () => {
    // Resetar para os valores originais da IA
    setEditedGoals({ ...calculatedGoals });
  };

  const getCurrentGoals = () => {
    return editedGoals || calculatedGoals;
  };

  const handleComplete = async () => {
    const goals = getCurrentGoals();
    if (goals) {
      try {
        // Salvar no perfil (usando valores editados se houver)
        await profileService.updateProfile({
          weight: formData.weight,
          height: formData.height,
          age: formData.age,
          gender: formData.gender,
          breakfast_calories: goals.breakfast,
          lunch_calories: goals.lunch,
          dinner_calories: goals.dinner,
          snack_calories: goals.snack,
          snack_quantity: goals.snackQuantity
        });

        // Registrar peso inicial
        await weightHistoryService.addWeightEntry(formData.weight, formData.height);

        // Marcar onboarding como completo no localStorage
        localStorage.setItem('onboarding_completed', 'true');

        // Navegar para home
        navigate('/home');
      } catch (error) {
        console.error('Error saving onboarding data:', error);
        setError('Erro ao salvar configuração. Tente novamente.');
      }
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.weight > 0 && formData.height > 0 && formData.age > 0;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
      </div>

      {/* Progress Indicator */}
      {step > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-50">
          <div
            className="h-full bg-white transition-all duration-500 ease-out"
            style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">

          {/* Step 0: Welcome Screen */}
          {step === 0 && (
            <div className="text-center animate-fade-in">
              <div className="mb-8 inline-block">
                <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                  <span className="text-6xl">🎯</span>
                </div>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                Bem-vindo ao<br />
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  NutriMais AI
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
                Vamos criar suas metas nutricionais personalizadas usando inteligência artificial
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="text-4xl mb-3">🤖</div>
                  <h3 className="text-white font-semibold mb-2">IA Personalizada</h3>
                  <p className="text-white/80 text-sm">Cálculos precisos baseados em seus dados</p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="text-white font-semibold mb-2">Metas Inteligentes</h3>
                  <p className="text-white/80 text-sm">Distribuição ideal de calorias</p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="text-4xl mb-3">⚡</div>
                  <h3 className="text-white font-semibold mb-2">Rápido e Fácil</h3>
                  <p className="text-white/80 text-sm">Apenas 2 minutos para configurar</p>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="group bg-white text-emerald-600 px-12 py-4 rounded-full text-lg font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-3"
              >
                Começar Agora
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <p className="text-white/60 text-sm mt-6">Leva apenas 2 minutos</p>
            </div>
          )}

          {/* Step 1: Dados Corporais */}
          {step === 1 && (
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl mx-auto animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📊</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Seus Dados
                </h2>
                <p className="text-gray-600">
                  Precisamos conhecer um pouco sobre você
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      ⚖️ Peso (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.weight || ''}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                      className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-lg"
                      placeholder="70.0"
                      step="0.1"
                      min="30"
                      max="300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      📏 Altura (cm)
                    </label>
                    <input
                      type="number"
                      value={formData.height || ''}
                      onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                      className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-lg"
                      placeholder="170"
                      min="100"
                      max="250"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      🎂 Idade
                    </label>
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                      className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-lg"
                      placeholder="30"
                      min="13"
                      max="120"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      👤 Sexo
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                      className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-lg"
                    >
                      <option value="male">Masculino</option>
                      <option value="female">Feminino</option>
                    </select>
                  </div>
                </div>

                {/* Exibição do IMC em tempo real */}
                {bmiInfo && (
                  <div
                    className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-2 rounded-xl p-6 animate-fade-in"
                    style={{ borderColor: bmiInfo.color }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Seu IMC</p>
                        <p className="text-3xl font-bold" style={{ color: bmiInfo.color }}>
                          {bmiInfo.value}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-lg font-bold mb-1"
                          style={{ color: bmiInfo.color }}
                        >
                          {bmiInfo.label}
                        </p>
                        <p className="text-sm text-gray-600">
                          {bmiInfo.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-shake">
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Objetivo */}
          {step === 2 && (
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl mx-auto animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎯</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Seu Objetivo
                </h2>
                <p className="text-gray-600">
                  O que você quer alcançar?
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    value: 'lose',
                    label: 'Perder Peso',
                    icon: '🔥',
                    desc: 'Reduzir gordura corporal de forma saudável',
                    color: 'from-orange-500 to-red-500'
                  },
                  {
                    value: 'maintain',
                    label: 'Manter Peso',
                    icon: '⚖️',
                    desc: 'Manter peso atual e ter uma dieta balanceada',
                    color: 'from-emerald-500 to-cyan-500'
                  },
                  {
                    value: 'gain',
                    label: 'Ganhar Peso',
                    icon: '💪',
                    desc: 'Aumentar massa muscular de forma saudável',
                    color: 'from-blue-500 to-purple-500'
                  }
                ].map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => setFormData({ ...formData, goal: goal.value as any })}
                    className={`w-full p-6 rounded-2xl border-2 text-left transition-all transform hover:scale-105 ${
                      formData.goal === goal.value
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                        : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${goal.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                        {goal.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-lg">{goal.label}</div>
                        <div className="text-sm text-gray-600">{goal.desc}</div>
                      </div>
                      {formData.goal === goal.value && (
                        <CheckCircleIcon className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Nível de Atividade */}
          {step === 3 && !isCalculating && (
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl mx-auto animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏃</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Nível de Atividade
                </h2>
                <p className="text-gray-600">
                  Quanto você se exercita por semana?
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { value: 'sedentary', label: 'Sedentário', icon: '🛋️', desc: 'Pouco ou nenhum exercício' },
                  { value: 'lightly_active', label: 'Levemente Ativo', icon: '🚶', desc: 'Exercício 1-3 dias/semana' },
                  { value: 'moderately_active', label: 'Moderadamente Ativo', icon: '🏃', desc: 'Exercício 3-5 dias/semana' },
                  { value: 'very_active', label: 'Muito Ativo', icon: '💪', desc: 'Exercício 6-7 dias/semana' },
                  { value: 'extra_active', label: 'Extremamente Ativo', icon: '🔥', desc: 'Exercício 2x/dia ou trabalho físico' }
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setFormData({ ...formData, activityLevel: level.value as any })}
                    className={`w-full p-5 rounded-xl border-2 text-left transition-all transform hover:scale-102 ${
                      formData.activityLevel === level.value
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                        : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{level.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{level.label}</div>
                        <div className="text-sm text-gray-600">{level.desc}</div>
                      </div>
                      {formData.activityLevel === level.value && (
                        <CheckCircleIcon className="w-7 h-7 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isCalculating && (
            <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl mx-auto text-center animate-slide-up">
              <div className="relative mb-8">
                <div className="w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-12 h-12 text-white animate-pulse" />
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Calculando suas metas...
              </h3>
              <p className="text-gray-600 mb-6">
                Nossa IA está analisando seus dados para criar o plano perfeito
              </p>

              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {/* Step 4: Resultado */}
          {step === 4 && calculatedGoals && (
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-3xl mx-auto animate-slide-up">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✨</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Suas Metas Personalizadas
                </h2>
                <p className="text-gray-600 max-w-xl mx-auto mb-4">
                  {calculatedGoals.explanation}
                </p>

                {/* Botões de Edição */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleToggleEdit}
                    className={`px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                      isEditingGoals
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isEditingGoals ? '✓ Salvar Edições' : '✏️ Editar Metas'}
                  </button>

                  {isEditingGoals && (
                    <button
                      onClick={handleResetToAI}
                      className="px-6 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-all"
                    >
                      🔄 Restaurar IA
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl p-8 mb-6 text-center shadow-xl">
                <p className="text-white/90 text-sm font-semibold mb-2 uppercase tracking-wide">
                  Meta Diária Total
                </p>
                <p className="text-6xl font-bold text-white mb-2">
                  {getCurrentGoals().totalDaily}
                </p>
                <p className="text-white/90 text-lg">
                  calorias por dia
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Café da Manhã */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-orange-200">
                  <div className="text-3xl mb-2">☀️</div>
                  <div className="text-sm text-gray-600 font-medium mb-2">Café da Manhã</div>
                  {isEditingGoals ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editedGoals?.breakfast || 0}
                        onChange={(e) => handleEditGoal('breakfast', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg text-lg font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        step="50"
                        min="100"
                      />
                      <span className="text-sm text-gray-600 whitespace-nowrap">kcal</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">{getCurrentGoals().breakfast} kcal</div>
                  )}
                </div>

                {/* Almoço */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
                  <div className="text-3xl mb-2">🍽️</div>
                  <div className="text-sm text-gray-600 font-medium mb-2">Almoço</div>
                  {isEditingGoals ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editedGoals?.lunch || 0}
                        onChange={(e) => handleEditGoal('lunch', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg text-lg font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        step="50"
                        min="100"
                      />
                      <span className="text-sm text-gray-600 whitespace-nowrap">kcal</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">{getCurrentGoals().lunch} kcal</div>
                  )}
                </div>

                {/* Jantar */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="text-3xl mb-2">🌙</div>
                  <div className="text-sm text-gray-600 font-medium mb-2">Jantar</div>
                  {isEditingGoals ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editedGoals?.dinner || 0}
                        onChange={(e) => handleEditGoal('dinner', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-lg font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        step="50"
                        min="100"
                      />
                      <span className="text-sm text-gray-600 whitespace-nowrap">kcal</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">{getCurrentGoals().dinner} kcal</div>
                  )}
                </div>

                {/* Lanches */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <div className="text-3xl mb-2">🍪</div>
                  <div className="text-sm text-gray-600 font-medium mb-2">Lanches</div>
                  {isEditingGoals ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editedGoals?.snack || 0}
                          onChange={(e) => handleEditGoal('snack', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg text-lg font-bold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          step="50"
                          min="50"
                        />
                        <span className="text-sm text-gray-600 whitespace-nowrap">kcal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editedGoals?.snackQuantity || 1}
                          onChange={(e) => handleEditGoal('snackQuantity', parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-2 border-2 border-purple-300 rounded-lg text-center font-bold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          min="0"
                          max="5"
                        />
                        <span className="text-sm text-gray-600">lanches/dia</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{getCurrentGoals().snack} kcal</div>
                      <div className="text-sm text-gray-600 mt-1">{getCurrentGoals().snackQuantity}x por dia</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  💡 <strong>Dica:</strong> {isEditingGoals ? 'Ajuste as metas conforme preferir e clique em "Salvar Edições".' : 'Você pode recalcular essas metas a qualquer momento na página de Saúde!'}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step > 0 && !isCalculating && (
            <div className="flex items-center justify-center gap-4 mt-8 animate-fade-in">
              {step < 4 && (
                <button
                  onClick={handleBack}
                  className="px-8 py-3 bg-white/20 backdrop-blur-lg border-2 border-white/30 rounded-full text-white font-semibold hover:bg-white/30 transition-all"
                >
                  ← Voltar
                </button>
              )}

              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${
                    canProceed()
                      ? 'bg-white text-emerald-600 shadow-xl hover:shadow-2xl'
                      : 'bg-white/30 text-white/50 cursor-not-allowed'
                  }`}
                >
                  Continuar →
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-12 py-4 bg-white text-emerald-600 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  Finalizar Configuração 🎉
                </button>
              )}
            </div>
          )}

          {/* Step Indicator */}
          {step > 0 && step < 4 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step ? 'w-8 bg-white' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default OnboardingPage;
