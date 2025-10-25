import React, { useState, useEffect, useRef } from 'react';
import { profileService } from '../../services/profileService';
import { physicalActivityService } from '../../services/physicalActivityService';
import { getBMIInfo } from '../../utils/bmiUtils';
import { ActivityHistory } from './ActivityHistory';
import { NutritionChat } from './NutritionChat';
import { searchActivities, calculateCaloriesBurned, getActivityMET } from '../../data/activitiesDatabase';
import type { UserProfile, ActivityIntensity } from '../../types';

export const HealthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
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
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [activitySuggestions, setActivitySuggestions] = useState<string[]>([]);
  const [showActivitySuggestions, setShowActivitySuggestions] = useState(false);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(-1);
  const activityInputRef = useRef<HTMLInputElement>(null);
  const activitySuggestionsRef = useRef<HTMLDivElement>(null);

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
      setShowActivityHistory(true);
    }
    setAddingActivity(false);
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
                <span className="text-3xl">💪</span>
                <h2 className="text-xl font-bold text-white">Saúde & Bem-Estar</h2>
              </div>
              <button onClick={() => setShowChat(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span>Assistente de IA</span>
              </button>
            </div>
          </div>

          <div className="p-4 max-h-[75vh] overflow-y-auto">
            {error && <div className="bg-error/10 border border-error text-error px-3 py-2 rounded-lg mb-3 text-sm">{error}</div>}
            {success && <div className="bg-success/10 border border-success text-success px-3 py-2 rounded-lg mb-3 text-sm">{success}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-4">
                {currentBMI && (
                  <div className="p-4 rounded-lg border-2" style={{ borderColor: currentBMI.color, background: `linear-gradient(135deg, ${currentBMI.color}10, ${currentBMI.color}05)` }}>
                    <div className="flex justify-between mb-2">
                      <h3 className="text-sm font-semibold text-text-bright">IMC</h3>
                      <span className="text-xl">📊</span>
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
                  <h3 className="text-sm font-semibold text-text-bright mb-3">🎯 Metas de Calorias</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Refeições/dia</label>
                      <input type="number" value={mealsPerDay} onChange={(e) => setMealsPerDay(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color" placeholder="3" min="1" max="6" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">☀️ Café</label>
                        <input type="number" value={breakfastCal} onChange={(e) => setBreakfastCal(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color" placeholder="400" />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">🍽️ Almoço</label>
                        <input type="number" value={lunchCal} onChange={(e) => setLunchCal(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color" placeholder="600" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">🌙 Jantar</label>
                        <input type="number" value={dinnerCal} onChange={(e) => setDinnerCal(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color" placeholder="600" />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">🍪 Lanche</label>
                        <input type="number" value={snackCal} onChange={(e) => setSnackCal(e.target.value)} className="w-full bg-hover-bg text-text-bright p-2 rounded text-sm border border-border-color focus:border-accent-orange focus:outline-none" placeholder="200" />
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
                <button onClick={handleSaveAll} className="w-full bg-green-500 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-green-600 text-sm">💾 Salvar Configurações</button>
              </div>

              <div className="space-y-4">
                <div className="bg-secondary-bg p-4 rounded-lg border border-border-color">
                  <h3 className="text-sm font-semibold text-text-bright mb-3">🏃 Registrar Atividade</h3>
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
                                  ? 'bg-accent-orange text-white font-semibold'
                                  : 'hover:bg-secondary-bg text-text-primary'
                              } ${index !== activitySuggestions.length - 1 ? 'border-b border-border-color' : ''}`}
                            >
                              🏃 {suggestion}
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
                      <div className="text-xs text-text-muted italic">💡 Calorias calculadas automaticamente</div>
                    )}
                    <button onClick={handleAddActivity} disabled={addingActivity} className="w-full bg-accent-orange text-white font-semibold px-4 py-2 rounded-lg hover:bg-accent-coral text-sm disabled:opacity-50">{addingActivity ? 'Adicionando...' : '➕ Adicionar'}</button>
                  </div>
                </div>
                <button onClick={() => setShowActivityHistory(!showActivityHistory)} className="w-full bg-secondary-bg text-text-primary font-semibold px-4 py-2 rounded-lg border border-border-color hover:bg-hover-bg text-sm">{showActivityHistory ? '▼' : '▶'} Histórico</button>
                {showActivityHistory && (
                  <div className="bg-secondary-bg p-3 rounded-lg border border-border-color">
                    <ActivityHistory />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showChat && <NutritionChat context={{ profile: profile || undefined, weightHistory: [], recentMeals: [] }} onClose={() => setShowChat(false)} />}
    </>
  );
};
