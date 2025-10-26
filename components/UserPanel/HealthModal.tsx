import React, { useState, useEffect, useRef } from 'react';
import { profileService } from '../../services/profileService';
import { physicalActivityService } from '../../services/physicalActivityService';
import { weightHistoryService } from '../../services/weightHistoryService';
import { getBMIInfo } from '../../utils/bmiUtils';
import { NutritionChat } from './NutritionChat';
import { searchActivities, calculateCaloriesBurned, getActivityMET } from '../../data/activitiesDatabase';
import { useScrollLock } from '../../hooks/useScrollLock';
import logger from '../../utils/logger';
import type { UserProfile, ActivityIntensity } from '../../types';
import {
    TargetIcon,
    ActivityIcon,
    ScaleIcon,
    BarChartIcon,
    HeartIcon,
    SunriseIcon,
    PlateIcon,
    MoonIcon,
    CookieIcon,
    ChatBubbleIcon,
    SaveIcon,
    LightbulbIcon,
    PlusIcon
} from '../icons';

export const HealthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  // Bloquear scroll quando modal estiver aberto
  useScrollLock(true);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState('3');
  const [breakfastCal, setBreakfastCal] = useState('400');
  const [lunchCal, setLunchCal] = useState('600');
  const [dinnerCal, setDinnerCal] = useState('600');
  const [snackCal, setSnackCal] = useState('200');
  const [snackQuantity, setSnackQuantity] = useState(1);
  const [activityType, setActivityType] = useState('');
  const [duration, setDuration] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [addingActivity, setAddingActivity] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activitySuggestions, setActivitySuggestions] = useState<string[]>([]);
  const [showActivitySuggestions, setShowActivitySuggestions] = useState(false);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(-1);
  const activityInputRef = useRef<HTMLInputElement>(null);
  const activitySuggestionsRef = useRef<HTMLDivElement>(null);

  // Estados para Registro de Pesagem
  const [newWeight, setNewWeight] = useState('');
  const [weightObservation, setWeightObservation] = useState('');
  const [addingWeight, setAddingWeight] = useState(false);
  const [weightAnalysis, setWeightAnalysis] = useState<string | null>(null);
  const [showWeightAnalysis, setShowWeightAnalysis] = useState(false);

  useEffect(() => { loadData(); }, []);

  // Autocomplete de atividades
  useEffect(() => {
    if (activityType.trim().length > 0) {
      const results = searchActivities(activityType, 8);
      setActivitySuggestions(results);
      setShowActivitySuggestions(results.length > 0);
      setSelectedActivityIndex(-1);
    } else {
      setActivitySuggestions([]);
      setShowActivitySuggestions(false);
    }
  }, [activityType]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activitySuggestionsRef.current && !activitySuggestionsRef.current.contains(event.target as Node) &&
          activityInputRef.current && !activityInputRef.current.contains(event.target as Node)) {
        setShowActivitySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular calorias automaticamente
  useEffect(() => {
    if (activityType && duration && weight) {
      const met = getActivityMET(activityType);
      if (met) {
        const calories = calculateCaloriesBurned(met, parseFloat(weight), parseInt(duration));
        setCaloriesBurned(calories.toString());
      }
    }
  }, [activityType, duration, weight]);

  const loadData = async () => {
    setLoading(true);
    const { data } = await profileService.getProfile();
    if (data) {
      setProfile(data);
      setWeight(data.weight?.toString() || '');
      setHeight(data.height?.toString() || '');
      setAge(data.age?.toString() || '');
      setGender(data.gender || '');
      setMealsPerDay(data.meals_per_day?.toString() || '3');
      setBreakfastCal(data.breakfast_calories?.toString() || '400');
      setLunchCal(data.lunch_calories?.toString() || '600');
      setDinnerCal(data.dinner_calories?.toString() || '600');
      setSnackCal(data.snack_calories?.toString() || '200');
      setSnackQuantity(data.snack_quantity || 1);
    }
    setLoading(false);
  };

  const handleSaveAll = async () => {
    setError('');
    setSuccess('');
    const { error: updateError } = await profileService.updateProfile({
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      meals_per_day: parseInt(mealsPerDay),
      breakfast_calories: parseInt(breakfastCal),
      lunch_calories: parseInt(lunchCal),
      dinner_calories: parseInt(dinnerCal),
      snack_calories: parseInt(snackCal),
      snack_quantity: snackQuantity,
    });
    if (updateError) {
      setError('Erro ao salvar dados.');
      return;
    }
    setSuccess('Dados salvos com sucesso!');
    loadData();
  };

  const handleActivitySelect = (activity: string) => {
    setActivityType(activity);
    setShowActivitySuggestions(false);
  };

  const handleActivityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showActivitySuggestions || activitySuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedActivityIndex(prev =>
          prev < activitySuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedActivityIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedActivityIndex >= 0) {
          handleActivitySelect(activitySuggestions[selectedActivityIndex]);
        }
        break;
      case 'Escape':
        setShowActivitySuggestions(false);
        break;
    }
  };

  const handleAddActivity = async () => {
    if (!activityType || !duration) {
      setError('Preencha tipo e duração.');
      return;
    }
    setAddingActivity(true);
    // Usar intensidade padrão 'moderate' já que as atividades já têm a descrição completa
    const { error: addError } = await physicalActivityService.addActivity(
      activityType, parseInt(duration), 'moderate', new Date(),
      caloriesBurned ? parseInt(caloriesBurned) : undefined
    );
    if (addError) {
      setError('Erro ao adicionar atividade.');
    } else {
      setSuccess('Atividade registrada!');
      setActivityType('');
      setDuration('');
      setCaloriesBurned('');
    }
    setAddingActivity(false);
  };

  const handleAddWeight = async () => {
    if (!newWeight) {
      setError('Preencha o peso.');
      return;
    }

    const weightValue = parseFloat(newWeight);
    if (weightValue < 20 || weightValue > 300) {
      setError('Peso deve estar entre 20 e 300 kg.');
      return;
    }

    setAddingWeight(true);
    setError('');
    setSuccess('');

    try {
      // 1. Buscar histórico de peso para análise
      const { data: weightHistory } = await weightHistoryService.getWeightHistory();
      const lastWeight = weightHistory && weightHistory.length > 0 ? weightHistory[0] : null;

      // 2. Buscar refeições e atividades desde a última pesagem
      const lastWeightDate = lastWeight?.created_at ? new Date(lastWeight.created_at) : null;

      // 3. Adicionar peso ao banco
      const { error: addError } = await weightHistoryService.addWeightEntry(
        weightValue,
        height ? parseFloat(height) : null,
        weightObservation || undefined
      );

      if (addError) {
        setError('Erro ao registrar peso.');
        setAddingWeight(false);
        return;
      }

      // 4. Gerar análise com IA
      setSuccess('Peso registrado! Gerando análise...');

      // Importar o serviço de análise
      const { weightAnalysisService } = await import('../../services/weightAnalysisService');

      // Preparar dados para análise
      const currentEntry = {
        weight: weightValue,
        height: height ? parseFloat(height) : null,
        notes: weightObservation || null,
        measured_at: new Date().toISOString(),
        bmi: weight && height ? parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2) : null,
      };

      const previousEntry = lastWeight ? {
        weight: lastWeight.weight,
        height: lastWeight.height || null,
        notes: lastWeight.notes || null,
        measured_at: lastWeight.measured_at,
        bmi: lastWeight.bmi || null,
      } : null;

      const allHistory = (weightHistory || []).map(w => ({
        weight: w.weight,
        height: w.height || null,
        notes: w.notes || null,
        measured_at: w.measured_at,
        bmi: w.bmi || null,
      }));

      const analysis = await weightAnalysisService.generateWeightAnalysis(
        currentEntry,
        previousEntry,
        allHistory,
        {
          full_name: profile?.full_name || null,
          age: profile?.age || null,
          gender: profile?.gender || null,
        }
      );

      // 5. Exibir análise
      setWeightAnalysis(analysis);
      setShowWeightAnalysis(true);
      setSuccess('Peso registrado com sucesso!');
      setNewWeight('');
      setWeightObservation('');

      // Atualizar peso no perfil
      setWeight(weightValue.toString());

    } catch (error) {
      logger.error('Error adding weight', error);
      setError('Erro ao processar registro de peso.');
    } finally {
      setAddingWeight(false);
    }
  };

  const currentBMI = weight && height ? getBMIInfo(parseFloat(weight), parseFloat(height)) : null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-card-bg rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-orange mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-card-bg rounded-xl w-full max-w-5xl my-8 border border-border-color shadow-2xl">
          <div className="bg-gradient-to-r from-green-500 to-teal-500 p-4 rounded-t-xl relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl hover:opacity-80 transition-opacity z-10">&times;</button>
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-2">
                <HeartIcon className="w-8 h-8 text-white" />
                <h2 className="text-xl font-bold text-white">Saúde & Bem-Estar</h2>
              </div>
              <button onClick={() => setShowChat(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2">
                <ChatBubbleIcon className="w-5 h-5 text-white" />
                <span>Assistente de IA</span>
              </button>
            </div>
          </div>

          <div className="p-4 max-h-[75vh] overflow-y-auto">
            {error && <div className="bg-error/10 border border-error text-error px-3 py-2 rounded-lg mb-3 text-sm">{error}</div>}
            {success && <div className="bg-success/10 border border-success text-success px-3 py-2 rounded-lg mb-3 text-sm">{success}</div>}

            {/* Análise da IA - Aparece acima do grid para não deslocar outros cards */}
            {showWeightAnalysis && weightAnalysis && (
              <div className="mb-4">
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🤖</span>
                      <h3 className="text-sm font-bold text-blue-400">Análise Personalizada</h3>
                    </div>
                    <button
                      onClick={() => setShowWeightAnalysis(false)}
                      className="text-text-secondary hover:text-text-bright transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <div className="text-text-primary text-sm whitespace-pre-line leading-relaxed">
                      {weightAnalysis}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border-color">
                    <button
                      onClick={() => setShowChat(true)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>💬</span>
                      Conversar Mais com a IA
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-4">
                {currentBMI && (
                  <div className="p-4 rounded-lg border-2" style={{ borderColor: currentBMI.color, background: `linear-gradient(135deg, ${currentBMI.color}10, ${currentBMI.color}05)` }}>
                    <div className="flex justify-between mb-2">
                      <h3 className="text-sm font-semibold text-text-bright">IMC</h3>
                      <BarChartIcon className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold" style={{ color: currentBMI.color }}>{currentBMI.value.toFixed(1)}</div>
                      <div className="text-sm font-semibold" style={{ color: currentBMI.color }}>{currentBMI.label}</div>
                    </div>
                  </div>
                )}

                <div className="bg-secondary-bg p-4 rounded-lg border border-border-color">
                  <h3 className="text-sm font-semibold text-text-bright mb-3">🏥 Dados Básicos</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">Peso (kg)</label>
                        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color" placeholder="70" step="0.1" />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">Altura (cm)</label>
                        <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color" placeholder="170" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">Idade</label>
                        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color" placeholder="30" />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">Sexo</label>
                        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color">
                          <option value="">-</option>
                          <option value="male">M</option>
                          <option value="female">F</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-secondary-bg p-4 rounded-lg border border-border-color">
                  <h3 className="text-sm font-semibold text-text-bright mb-3 flex items-center gap-2">
                    <TargetIcon className="w-5 h-5 text-green-500" />
                    Metas de Calorias
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Refeições/dia</label>
                      <input type="number" value={mealsPerDay} onChange={(e) => setMealsPerDay(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color" placeholder="3" min="1" max="6" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1 flex items-center gap-1">
                          <SunriseIcon className="w-3 h-3 text-green-500" />
                          Café
                        </label>
                        <input type="number" value={breakfastCal} onChange={(e) => setBreakfastCal(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color" placeholder="400" />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1 flex items-center gap-1">
                          <PlateIcon className="w-3 h-3 text-green-500" />
                          Almoço
                        </label>
                        <input type="number" value={lunchCal} onChange={(e) => setLunchCal(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color" placeholder="600" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1 flex items-center gap-1">
                          <MoonIcon className="w-3 h-3 text-green-500" />
                          Jantar
                        </label>
                        <input type="number" value={dinnerCal} onChange={(e) => setDinnerCal(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color" placeholder="600" />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1 flex items-center gap-1">
                          <CookieIcon className="w-3 h-3 text-green-500" />
                          Lanche
                        </label>
                        <input type="number" value={snackCal} onChange={(e) => setSnackCal(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color focus:border-green-500 focus:outline-none" placeholder="200" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Quantidade de Lanches</label>
                      <input
                        type="number"
                        value={snackQuantity}
                        onChange={(e) => setSnackQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color focus:border-accent-orange focus:outline-none"
                        placeholder="1"
                        min="1"
                      />
                    </div>
                    <div className="text-xs text-text-secondary bg-hover-bg p-2 rounded">
                      Total: {parseInt(breakfastCal || '0') + parseInt(lunchCal || '0') + parseInt(dinnerCal || '0') + (parseInt(snackCal || '0') * snackQuantity)} kcal/dia
                    </div>
                  </div>
                </div>
                <button onClick={handleSaveAll} className="w-full bg-green-500 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-green-600 text-sm flex items-center justify-center gap-2">
                  <SaveIcon className="w-4 h-4" />
                  Salvar Configurações
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-secondary-bg p-4 rounded-lg border border-border-color">
                  <h3 className="text-sm font-semibold text-text-bright mb-3 flex items-center gap-2">
                    <ActivityIcon className="w-5 h-5 text-green-500" />
                    Registrar Atividade
                  </h3>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        ref={activityInputRef}
                        type="text"
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value)}
                        onKeyDown={handleActivityKeyDown}
                        onFocus={() => activityType.trim() && setShowActivitySuggestions(activitySuggestions.length > 0)}
                        className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color focus:border-accent-orange focus:outline-none"
                        placeholder="Ex: Corrida, Caminhada, Natação..."
                        autoComplete="off"
                      />
                      {showActivitySuggestions && activitySuggestions.length > 0 && (
                        <div
                          ref={activitySuggestionsRef}
                          className="absolute z-50 w-full mt-1 bg-hover-bg border-2 border-accent-orange/50 rounded-lg shadow-2xl shadow-accent-orange/20 max-h-48 overflow-y-auto"
                        >
                          {activitySuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              onClick={() => handleActivitySelect(suggestion)}
                              className={`px-3 py-2 cursor-pointer transition-all text-sm ${
                                index === selectedActivityIndex
                                  ? 'bg-green-500 text-white font-semibold'
                                  : 'hover:bg-secondary-bg text-text-primary'
                              } ${index !== activitySuggestions.length - 1 ? 'border-b border-border-color' : ''}`}
                            >
                              <span className="flex items-center gap-2">
                                <ActivityIcon className="w-3 h-3 text-green-500" />
                                {suggestion}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color focus:border-accent-orange focus:outline-none" placeholder="Duração (min)" />
                      <div className="relative">
                        <input
                          type="number"
                          value={caloriesBurned}
                          onChange={(e) => setCaloriesBurned(e.target.value)}
                          className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color focus:border-accent-orange focus:outline-none"
                          placeholder="Calorias"
                        />
                        {caloriesBurned && (
                          <span className="absolute right-2 top-2 text-xs text-success">✓</span>
                        )}
                      </div>
                    </div>
                    {caloriesBurned && (
                      <div className="text-xs text-text-muted italic flex items-center gap-1">
                        <LightbulbIcon className="w-3 h-3 text-green-500" />
                        Calorias calculadas automaticamente
                      </div>
                    )}
                    <button onClick={handleAddActivity} disabled={addingActivity} className="w-full bg-green-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-600 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                      {addingActivity ? 'Adicionando...' : (
                        <>
                          <PlusIcon className="w-4 h-4" />
                          Adicionar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-secondary-bg p-4 rounded-lg border border-border-color">
                  <h3 className="text-sm font-semibold text-text-bright mb-3 flex items-center gap-2">
                    <ScaleIcon className="w-5 h-5 text-green-500" />
                    Registrar Pesagem
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Peso (kg)</label>
                      <input
                        type="number"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color focus:border-blue-500 focus:outline-none"
                        placeholder="Ex: 70.5"
                        step="0.1"
                        min="20"
                        max="300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Observação (opcional)</label>
                      <textarea
                        value={weightObservation}
                        onChange={(e) => setWeightObservation(e.target.value)}
                        className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color focus:border-blue-500 focus:outline-none resize-none"
                        placeholder="Ex: Me senti bem hoje, fiz exercícios..."
                        rows={3}
                        maxLength={200}
                      />
                      <div className="text-xs text-text-muted mt-1 text-right">
                        {weightObservation.length}/200
                      </div>
                    </div>
                    <button
                      onClick={handleAddWeight}
                      disabled={addingWeight}
                      className="w-full bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {addingWeight ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          Processando...
                        </>
                      ) : (
                        <>
                          <ScaleIcon className="w-4 h-4" />
                          Registrar e Analisar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showChat && <NutritionChat context={{ profile: profile || undefined, weightHistory: [], recentMeals: [] }} onClose={() => setShowChat(false)} />}
    </>
  );
};
