import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateMealPortions } from '../services/geminiService';
import { mealHistoryService } from '../services/mealHistoryService';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { searchFoods } from '../data/foodDatabase';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  SparklesIcon,
  StarIcon,
  TrashIcon,
  PlusCircleIcon,
  FireIcon,
  CheckCircleIcon
} from '../components/Layout/Icons';
import Toast from '../components/Toast';
import type { MealResult, MealType, UserProfile } from '../types';

const PlanMealPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [targetCalories, setTargetCalories] = useState<number>(600);
  const [currentFood, setCurrentFood] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Result State
  const [mealResult, setMealResult] = useState<MealResult | null>(null);
  const [editedResult, setEditedResult] = useState<MealResult | null>(null);
  const [inputValues, setInputValues] = useState<Map<string, string>>(new Map());

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { limits } = useSubscription();
  const [todayMealsCount, setTodayMealsCount] = useState(0);
  const [showUpgradeNotice, setShowUpgradeNotice] = useState(false);

  useEffect(() => {
    loadUserData();
    loadFavorites();
  }, []);

  const loadTodayMealCount = async (userId: string) => {
    try {
      const { data } = await mealHistoryService.getUserMealHistory(userId);
      const today = new Date().toISOString().split('T')[0];
      const count = (data || []).filter(meal => meal.consumed_at.startsWith(today)).length;
      setTodayMealsCount(count);
    } catch (error) {
      console.error('Error counting today meals:', error);
    }
  };

  useEffect(() => {
    if (limits.maxMealsPerDay === null) {
      setShowUpgradeNotice(false);
    }
  }, [limits.maxMealsPerDay]);

  const loadUserData = async () => {
    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setCurrentUserId(session.user.id);
      await loadTodayMealCount(session.user.id);

      const { data: userProfile } = await profileService.getProfile();

      if (userProfile) {
        // Verificar se dados obrigatórios estão preenchidos
        const hasRequiredData = userProfile.weight && userProfile.height && userProfile.age && userProfile.gender;

        if (!hasRequiredData) {
          // Redirecionar para onboarding
          navigate('/onboarding');
          return;
        }

        setProfile(userProfile);
        // Set default calories based on meal type
        setTargetCaloriesFromProfile(mealType, userProfile);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const setTargetCaloriesFromProfile = (type: MealType, prof: UserProfile) => {
    const caloriesMap: Record<MealType, keyof UserProfile> = {
      breakfast: 'breakfast_calories',
      lunch: 'lunch_calories',
      dinner: 'dinner_calories',
      snack: 'snack_calories'
    };

    const field = caloriesMap[type];
    const calories = prof[field] as number | undefined;
    if (calories) {
      setTargetCalories(calories);
    }
  };

  const loadFavorites = () => {
    const stored = localStorage.getItem('favoriteFoods');
    if (stored) {
      try {
        setFavoriteFoods(JSON.parse(stored));
      } catch {
        setFavoriteFoods([]);
      }
    }
  };

  const saveFavorites = (foods: string[]) => {
    setFavoriteFoods(foods);
    localStorage.setItem('favoriteFoods', JSON.stringify(foods));
  };

  // Autocomplete: atualizar sugestões quando o usuário digita
  useEffect(() => {
    if (currentFood.trim().length > 0) {
      const results = searchFoods(currentFood, 8);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [currentFood]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddFood = (foodToAdd?: string) => {
    const trimmedFood = (foodToAdd || currentFood).trim();
    if (!trimmedFood) return;

    const normalizedFood = trimmedFood.toLowerCase();
    const isDuplicate = selectedFoods.some(
      food => food.toLowerCase() === normalizedFood
    );

    if (isDuplicate) {
      setError('Este alimento já foi adicionado');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSelectedFoods([...selectedFoods, trimmedFood]);
    setCurrentFood('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddFood();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleAddFood(suggestions[selectedSuggestionIndex]);
        } else {
          handleAddFood();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleRemoveFood = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };

  const toggleFavorite = (food: string) => {
    const newFavorites = favoriteFoods.includes(food)
      ? favoriteFoods.filter(f => f !== food)
      : [...favoriteFoods, food];
    saveFavorites(newFavorites);
  };

  const handleAddFavoriteToMeal = (food: string) => {
    const normalizedFood = food.toLowerCase();
    const isDuplicate = selectedFoods.some(
      f => f.toLowerCase() === normalizedFood
    );

    if (!isDuplicate) {
      setSelectedFoods([...selectedFoods, food]);
    }
  };

  const handleCalculate = async () => {
    if (selectedFoods.length === 0) return;

    setIsLoading(true);
    setError('');
    setShowResult(false);

    try {
      const result = await calculateMealPortions(
        selectedFoods,
        targetCalories,
        mealType
      );

      // Validar ranges flexíveis e saudáveis
      const sumProtein = result.portions.reduce((sum, p) => sum + p.macros.protein, 0);
      const sumCarbs = result.portions.reduce((sum, p) => sum + p.macros.carbs, 0);
      const sumFat = result.portions.reduce((sum, p) => sum + p.macros.fat, 0);
      const sumFiber = result.portions.reduce((sum, p) => sum + (p.macros.fiber || 0), 0);

      // Ranges flexíveis (25-35% proteína, 35-50% carbs, 25-35% gordura)
      const proteinMin = (targetCalories * 0.25) / 4;
      const proteinMax = (targetCalories * 0.35) / 4;
      const carbsMin = (targetCalories * 0.35) / 4;
      const carbsMax = (targetCalories * 0.50) / 4;
      const fatMin = (targetCalories * 0.25) / 9;
      const fatMax = (targetCalories * 0.35) / 9;

      console.log('🔍 VALIDAÇÃO DE QUALIDADE NUTRICIONAL:');
      console.log(`Proteína: ${sumProtein.toFixed(1)}g (range: ${proteinMin.toFixed(1)}-${proteinMax.toFixed(1)}g) ${sumProtein >= proteinMin && sumProtein <= proteinMax ? '✅' : '⚠️'}`);
      console.log(`Carboidratos: ${sumCarbs.toFixed(1)}g (range: ${carbsMin.toFixed(1)}-${carbsMax.toFixed(1)}g) ${sumCarbs >= carbsMin && sumCarbs <= carbsMax ? '✅' : '⚠️'}`);
      console.log(`Gordura: ${sumFat.toFixed(1)}g (range: ${fatMin.toFixed(1)}-${fatMax.toFixed(1)}g) ${sumFat >= fatMin && sumFat <= fatMax ? '✅' : '⚠️'}`);
      console.log(`Fibras: ${sumFiber.toFixed(1)}g (meta: ≥8g) ${sumFiber >= 8 ? '✅' : '⚠️'}`);

      // Recalcular e validar IG e CG
      if (sumCarbs > 0) {
        let weightedGI = 0;
        let hasGlycemicData = false;

        for (const portion of result.portions) {
          if (portion.glycemicIndex && portion.glycemicIndex > 0 && portion.macros.carbs > 0) {
            weightedGI += portion.glycemicIndex * portion.macros.carbs;
            hasGlycemicData = true;
          }
        }

        if (hasGlycemicData) {
          const calculatedIG = Math.round(weightedGI / sumCarbs);
          const calculatedCG = parseFloat(((calculatedIG * sumCarbs) / 100).toFixed(1));

          console.log('🔢 RECÁLCULO DE IG/CG:');
          console.log(`IG calculado pelo frontend: ${calculatedIG}`);
          console.log(`IG retornado pela IA: ${result.glycemicData?.index || 'N/A'}`);
          console.log(`CG calculada pelo frontend: ${calculatedCG}`);
          console.log(`CG retornada pela IA: ${result.glycemicData?.load || 'N/A'}`);

          // Se houver discrepância significativa, usar valores calculados
          if (result.glycemicData) {
            const igDiff = Math.abs(calculatedIG - result.glycemicData.index);
            const cgDiff = Math.abs(calculatedCG - result.glycemicData.load);

            if (igDiff > 5 || cgDiff > 2) {
              console.warn('⚠️ DISCREPÂNCIA DETECTADA! Corrigindo valores...');
              result.glycemicData.index = calculatedIG;
              result.glycemicData.load = calculatedCG;
            }
          } else {
            // Se IA não retornou glycemicData, criar
            result.glycemicData = {
              index: calculatedIG,
              load: calculatedCG
            };
          }

          const igStatus = calculatedIG < 55 ? '✅ BAIXO' : calculatedIG < 70 ? '⚠️ MODERADO' : '❌ ALTO';
          const cgStatus = calculatedCG < 10 ? '✅ BAIXA' : calculatedCG < 20 ? '⚠️ MODERADA' : '❌ ALTA';
          console.log(`IG médio FINAL: ${calculatedIG} ${igStatus}`);
          console.log(`Carga Glicêmica FINAL: ${calculatedCG} ${cgStatus}`);
        }
      }

      // Validar se está dentro dos ranges
      const proteinOk = sumProtein >= proteinMin && sumProtein <= proteinMax;
      const carbsOk = sumCarbs >= carbsMin && sumCarbs <= carbsMax;
      const fatOk = sumFat >= fatMin && sumFat <= fatMax;
      const fiberOk = sumFiber >= 8;

      if (!proteinOk || !carbsOk || !fatOk || !fiberOk) {
        console.warn('⚠️ ATENÇÃO: Alguns valores nutricionais estão fora do ideal!');
        const warnings = [];
        if (!proteinOk) warnings.push('proteína');
        if (!carbsOk) warnings.push('carboidratos');
        if (!fatOk) warnings.push('gordura');
        if (!fiberOk) warnings.push('fibras');

        setToast({
          message: `Aviso: ${warnings.join(', ')} fora do range ideal. Valores aproximados.`,
          type: 'error'
        });
      } else {
        console.log('✅ Todos os valores nutricionais dentro dos ranges saudáveis!');
      }

      setMealResult(result);
      setEditedResult(result);

      // Initialize input values
      const newInputValues = new Map<string, string>();
      result.portions.forEach(portion => {
        newInputValues.set(portion.foodName, portion.grams.toString());
      });
      setInputValues(newInputValues);

      setShowResult(true);

      // Scroll to results
      setTimeout(() => {
        document.getElementById('meal-results')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Erro ao calcular refeição');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortionChange = (foodName: string, newValue: string) => {
    const newInputValues = new Map(inputValues);
    newInputValues.set(foodName, newValue);
    setInputValues(newInputValues);

    const parsedValue = parseFloat(newValue);
    if (isNaN(parsedValue) || parsedValue < 0) return;

    if (!mealResult) return;

    const originalPortion = mealResult.portions.find(p => p.foodName === foodName);
    if (!originalPortion) return;

    const ratio = parsedValue / originalPortion.grams;

    const updatedPortions = editedResult!.portions.map(portion => {
      if (portion.foodName === foodName) {
        return {
          ...portion,
          grams: parsedValue,
          calories: Math.round(originalPortion.calories * ratio),
          macros: {
            protein: originalPortion.macros.protein * ratio,
            carbs: originalPortion.macros.carbs * ratio,
            fat: originalPortion.macros.fat * ratio,
            fiber: originalPortion.macros.fiber ? originalPortion.macros.fiber * ratio : 0
          }
        };
      }
      return portion;
    });

    const newTotalMacros = updatedPortions.reduce((acc, portion) => ({
      protein: acc.protein + portion.macros.protein,
      carbs: acc.carbs + portion.macros.carbs,
      fat: acc.fat + portion.macros.fat,
      fiber: acc.fiber + (portion.macros.fiber || 0)
    }), { protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const newTotalCalories = updatedPortions.reduce((sum, p) => sum + p.calories, 0);

    // Recalcular IG e CG com as novas porções
    let newGlycemicData = editedResult!.glycemicData;
    if (newTotalMacros.carbs > 0) {
      let weightedGI = 0;
      let hasGlycemicData = false;

      for (const portion of updatedPortions) {
        if (portion.glycemicIndex && portion.glycemicIndex > 0 && portion.macros.carbs > 0) {
          weightedGI += portion.glycemicIndex * portion.macros.carbs;
          hasGlycemicData = true;
        }
      }

      if (hasGlycemicData) {
        const calculatedIG = Math.round(weightedGI / newTotalMacros.carbs);
        const calculatedCG = parseFloat(((calculatedIG * newTotalMacros.carbs) / 100).toFixed(1));
        newGlycemicData = {
          index: calculatedIG,
          load: calculatedCG
        };
      }
    }

    setEditedResult({
      ...editedResult!,
      portions: updatedPortions,
      totalCalories: newTotalCalories,
      totalMacros: newTotalMacros,
      glycemicData: newGlycemicData
    });
  };

  const handleSaveMeal = async () => {
    if (!editedResult) return;

    if (limits.maxMealsPerDay !== null && todayMealsCount >= limits.maxMealsPerDay) {
      setShowUpgradeNotice(true);
      setToast({
        message: 'Plano gratuito permite registrar apenas 2 refeicoes por dia. Assine o Premium para liberar ilimitado.',
        type: 'error'
      });
      return;
    }

    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        navigate('/login');
        return;
      }

      await mealHistoryService.saveMealHistory({
        user_id: session.user.id,
        meal_type: mealType,
        total_calories: editedResult.totalCalories,
        total_macros: editedResult.totalMacros,
        food_items: editedResult.portions.map(p => p.foodName),
        portions: editedResult.portions,
        consumed_at: new Date().toISOString()
      });

      await loadTodayMealCount(session.user.id);
      setShowUpgradeNotice(false);
      setToast({ message: 'Refeicao salva com sucesso!', type: 'success' });
      setTimeout(() => {
        navigate('/home');
      }, 1500);
    } catch (error) {
      setToast({ message: 'Erro ao salvar refeição', type: 'error' });
    }
  };

  const mealTypeOptions = [
    { value: 'breakfast', label: '☀️ Café da manhã', color: 'from-yellow-400 to-orange-400' },
    { value: 'lunch', label: '🍽️ Almoço', color: 'from-blue-400 to-cyan-400' },
    { value: 'dinner', label: '🌙 Jantar', color: 'from-purple-400 to-pink-400' },
    { value: 'snack', label: '🍪 Lanche', color: 'from-green-400 to-emerald-400' }
  ];

  const getMacroColor = (macro: string) => {
    const colors: Record<string, string> = {
      protein: 'bg-blue-500',
      carbs: 'bg-orange-500',
      fat: 'bg-yellow-500'
    };
    return colors[macro] || 'bg-gray-500';
  };

  const calculateMacroPercentages = () => {
    if (!editedResult) return { protein: 0, carbs: 0, fat: 0 };

    const { protein, carbs, fat } = editedResult.totalMacros;
    const proteinCal = protein * 4;
    const carbsCal = carbs * 4;
    const fatCal = fat * 9;
    const totalCal = proteinCal + carbsCal + fatCal;

    if (totalCal === 0) return { protein: 0, carbs: 0, fat: 0 };

    return {
      protein: Math.round((proteinCal / totalCal) * 100),
      carbs: Math.round((carbsCal / totalCal) * 100),
      fat: Math.round((fatCal / totalCal) * 100)
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 pt-12 pb-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white text-2xl font-bold mb-2">Planejar Refeição</h1>
          <p className="text-white/80">Calcule as porções ideais com nossa IA</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {limits.maxMealsPerDay !== null && (
          <div className="mb-6 space-y-3">
            <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-semibold">Plano Grátis ativo</p>
                <p className="text-gray-800 font-medium">
                  Refeições registradas hoje: {todayMealsCount}/{limits.maxMealsPerDay}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  O plano Premium libera registros ilimitados, histórico completo e o assistente de IA.
                </p>
              </div>
              <button
                onClick={() => navigate('/assinatura')}
                className="self-start md:self-auto px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Conhecer plano Premium
              </button>
            </div>

            {showUpgradeNotice && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-orange-700 text-sm font-medium">
                  Você atingiu o limite diário do Plano Grátis. Para continuar registrando refeições e liberar todos os recursos profissionais, faça o upgrade para o Premium.
                </p>
                <button
                  onClick={() => navigate('/assinatura')}
                  className="mt-3 inline-flex items-center px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Ver opções de assinatura
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-700">{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Meal Type Selection */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Tipo de Refeição
          </label>
          <div className="grid grid-cols-2 gap-3">
            {mealTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setMealType(option.value as MealType);
                  if (profile) {
                    setTargetCaloriesFromProfile(option.value as MealType, profile);
                  }
                }}
                className={`p-3 rounded-lg font-medium transition-all duration-200 ${
                  mealType === option.value
                    ? `bg-gradient-to-r ${option.color} text-white shadow-lg transform scale-105`
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calorie Target */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Meta de Calorias
          </label>
          <div className="relative">
            <input
              type="number"
              value={targetCalories}
              onChange={(e) => setTargetCalories(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 pr-16 text-2xl font-bold text-gray-900 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors"
              min="100"
              max="2000"
              step="50"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              kcal
            </span>
          </div>
        </div>

        {/* Add Foods */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Adicionar Alimentos
          </label>
          <div className="relative">
            <div className="flex gap-2 mb-4">
              <input
                ref={inputRef}
                type="text"
                value={currentFood}
                onChange={(e) => setCurrentFood(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="Ex: Arroz integral, Frango grelhado..."
                autoComplete="off"
              />
              <button
                onClick={() => handleAddFood()}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <PlusCircleIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full bg-white border-2 border-emerald-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                style={{ top: '100%', marginTop: '-1rem' }}
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddFood(suggestion)}
                    className={`w-full text-left px-4 py-2 hover:bg-emerald-50 transition-colors ${
                      index === selectedSuggestionIndex ? 'bg-emerald-100' : ''
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Foods */}
          {selectedFoods.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedFoods.map((food, index) => (
                <div
                  key={index}
                  className="inline-flex items-center bg-emerald-50 text-emerald-700 px-3 py-2 rounded-full animate-fadeIn"
                >
                  <span className="mr-2">{food}</span>
                  <button
                    onClick={() => toggleFavorite(food)}
                    className="mr-1 hover:scale-110 transition-transform"
                  >
                    <StarIcon className={`w-4 h-4 ${
                      favoriteFoods.includes(food) ? 'text-yellow-500' : 'text-gray-400'
                    }`} />
                  </button>
                  <button
                    onClick={() => handleRemoveFood(index)}
                    className="text-emerald-600 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Favorites */}
          {favoriteFoods.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">⭐ Favoritos</p>
              <div className="flex flex-wrap gap-2">
                {favoriteFoods.map((food, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddFavoriteToMeal(food)}
                    className="inline-flex items-center bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-sm hover:bg-yellow-100 transition-colors"
                  >
                    <span className="mr-1">+</span>
                    {food}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={isLoading || selectedFoods.length === 0}
          className={`w-full py-4 font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center ${
            isLoading || selectedFoods.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-xl transform hover:scale-[1.02]'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculando com IA...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Calcular Porções Ideais
            </>
          )}
        </button>

        {/* Results Section */}
        {showResult && editedResult && (
          <div id="meal-results" className="mt-8 space-y-6 animate-fadeIn">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl p-6 text-white shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Resultado do Cálculo</h2>
                <FireIcon className="w-8 h-8" />
              </div>

              <div className="text-center mb-4">
                <p className="text-4xl font-bold">{editedResult.totalCalories}</p>
                <p className="text-white/80">calorias totais</p>
              </div>

              {/* Macro Bars */}
              <div className="space-y-3">
                {Object.entries(calculateMacroPercentages()).map(([macro, percentage]) => {
                  const macroName = macro === 'carbs' ? 'Carboidratos' : macro === 'protein' ? 'Proteína' : 'Gordura';
                  const macroGrams = macro === 'carbs' ? editedResult.totalMacros.carbs :
                                    macro === 'protein' ? editedResult.totalMacros.protein :
                                    editedResult.totalMacros.fat;

                  return (
                    <div key={macro}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{macroName}</span>
                        <span className="font-semibold">{macroGrams.toFixed(1)}g ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                          className={`h-full rounded-full ${getMacroColor(macro)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Glycemic Index & Load */}
              {editedResult.glycemicData && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <p className="text-xs text-white/70 mb-1">Índice Glicêmico</p>
                      <p className="text-2xl font-bold">{editedResult.glycemicData.index.toFixed(0)}</p>
                      <p className="text-xs text-white/70">
                        {editedResult.glycemicData.index < 55 ? '✅ Baixo' :
                         editedResult.glycemicData.index < 70 ? '⚠️ Moderado' : '❌ Alto'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/70 mb-1">Carga Glicêmica</p>
                      <p className="text-2xl font-bold">{editedResult.glycemicData.load.toFixed(1)}</p>
                      <p className="text-xs text-white/70">
                        {editedResult.glycemicData.load < 10 ? '✅ Baixa' :
                         editedResult.glycemicData.load < 20 ? '⚠️ Moderada' : '❌ Alta'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Portions List */}
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Porções Calculadas</h3>
              <div className="space-y-4">
                {editedResult.portions.map((portion, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{portion.foodName}</h4>
                        <p className="text-sm text-gray-500">{portion.homeMeasure}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={inputValues.get(portion.foodName) || ''}
                          onChange={(e) => handlePortionChange(portion.foodName, e.target.value)}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="text-sm text-gray-500">g</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>{portion.calories} kcal</span>
                      <span>P: {portion.macros.protein.toFixed(1)}g</span>
                      <span>C: {portion.macros.carbs.toFixed(1)}g</span>
                      <span>G: {portion.macros.fat.toFixed(1)}g</span>
                    </div>

                    {/* Glycemic Data per Food */}
                    {portion.glycemicIndex !== undefined && portion.glycemicIndex > 0 && (
                      <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">IG:</span>
                          <span className={`font-semibold ${
                            portion.glycemicIndex < 55 ? 'text-green-600' :
                            portion.glycemicIndex < 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {portion.glycemicIndex.toFixed(0)}
                          </span>
                          <span className="text-gray-400">
                            {portion.glycemicIndex < 55 ? '(Baixo)' :
                             portion.glycemicIndex < 70 ? '(Moderado)' : '(Alto)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">CG:</span>
                          <span className={`font-semibold ${
                            (() => {
                              const cg = (portion.glycemicIndex * portion.macros.carbs) / 100;
                              return cg < 10 ? 'text-green-600' :
                                     cg < 20 ? 'text-yellow-600' : 'text-red-600';
                            })()
                          }`}>
                            {((portion.glycemicIndex * portion.macros.carbs) / 100).toFixed(1)}
                          </span>
                          <span className="text-gray-400">
                            {(() => {
                              const cg = (portion.glycemicIndex * portion.macros.carbs) / 100;
                              return cg < 10 ? '(Baixa)' :
                                     cg < 20 ? '(Moderada)' : '(Alta)';
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Suggestions */}
            {mealResult?.suggestions && mealResult.suggestions.length > 0 && (
              <div className="bg-purple-50 rounded-xl shadow-xl border border-purple-100 p-6">
                <div className="flex items-start mb-3">
                  <SparklesIcon className="w-6 h-6 text-purple-600 mr-2 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-purple-900">Sugestões da IA</h3>
                </div>
                <ul className="space-y-2">
                  {mealResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start text-purple-700">
                      <CheckCircleIcon className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveMeal}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              >
                Salvar Refeição
              </button>
              <button
                onClick={() => {
                  setShowResult(false);
                  setMealResult(null);
                  setEditedResult(null);
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Calcular Novamente
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PlanMealPage;






