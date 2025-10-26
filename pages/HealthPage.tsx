import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { physicalActivityService } from '../services/physicalActivityService';
import { weightHistoryService } from '../services/weightHistoryService';
import { searchActivities, getActivityMET, calculateCaloriesBurned } from '../data/activitiesDatabase';
import { getBMIInfo } from '../utils/bmiUtils';
import {
  HeartIcon,
  FireIcon,
  ScaleIcon,
  PlusCircleIcon,
  CheckCircleIcon
} from '../components/Layout/Icons';
import Toast from '../components/Toast';
import type { UserProfile } from '../types';

const HealthPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    weight: 0,
    height: 0,
    age: 0,
    gender: 'male' as 'male' | 'female',
    breakfast_calories: 400,
    lunch_calories: 600,
    dinner_calories: 600,
    snack_calories: 200,
    snack_quantity: 1
  });

  // Weight tracking
  const [newWeight, setNewWeight] = useState('');
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0]);

  // Activity tracking
  const [activityType, setActivityType] = useState('');
  const [activityDuration, setActivityDuration] = useState('');
  const [activitySuggestions, setActivitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [calculatedCalories, setCalculatedCalories] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: userProfile } = await profileService.getProfile();
      setProfile(userProfile);

      if (userProfile) {
        setFormData({
          weight: userProfile.weight || 0,
          height: userProfile.height || 0,
          age: userProfile.age || 0,
          gender: userProfile.gender || 'male',
          breakfast_calories: userProfile.breakfast_calories || 400,
          lunch_calories: userProfile.lunch_calories || 600,
          dinner_calories: userProfile.dinner_calories || 600,
          snack_calories: userProfile.snack_calories || 200,
          snack_quantity: userProfile.snack_quantity || 1
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGoals = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      await profileService.updateProfile({
        weight: formData.weight,
        height: formData.height,
        age: formData.age,
        gender: formData.gender,
        breakfast_calories: formData.breakfast_calories,
        lunch_calories: formData.lunch_calories,
        dinner_calories: formData.dinner_calories,
        snack_calories: formData.snack_calories,
        snack_quantity: formData.snack_quantity
      });

      setToast({ message: 'Metas salvas com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Error saving goals:', error);
      setToast({ message: 'Erro ao salvar metas', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWeight = async () => {
    if (!newWeight || !profile) return;

    setIsSavingWeight(true);
    try {
      const weight = parseFloat(newWeight);
      const height = formData.height || null;

      await weightHistoryService.addWeightEntry(weight, height);

      // Update profile weight
      await profileService.updateProfile({
        weight: weight
      });

      setNewWeight('');
      setToast({ message: 'Peso registrado com sucesso!', type: 'success' });

      // Reload profile
      loadProfile();
    } catch (error) {
      console.error('Error saving weight:', error);
      setToast({ message: 'Erro ao registrar peso', type: 'error' });
    } finally {
      setIsSavingWeight(false);
    }
  };

  const handleActivitySearch = (query: string) => {
    setActivityType(query);
    if (query.length > 2) {
      const suggestions = searchActivities(query, 5);
      setActivitySuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }

    // Calculate calories if activity is selected and duration is set
    if (activityDuration && formData.weight) {
      const met = getActivityMET(query);
      if (met) {
        const calories = calculateCaloriesBurned(met, formData.weight, parseFloat(activityDuration));
        setCalculatedCalories(Math.round(calories));
      }
    }
  };

  const handleSaveActivity = async () => {
    if (!activityType || !activityDuration || !profile) return;

    setIsSavingActivity(true);
    try {
      const met = getActivityMET(activityType);
      const calories = met
        ? calculateCaloriesBurned(met, formData.weight, parseFloat(activityDuration))
        : 0;

      await physicalActivityService.addActivity(
        activityType,
        parseFloat(activityDuration),
        'moderate' as 'low' | 'moderate' | 'high',
        new Date(),
        Math.round(calories)
      );

      setActivityType('');
      setActivityDuration('');
      setCalculatedCalories(0);
      setToast({ message: 'Atividade registrada com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Error saving activity:', error);
      setToast({ message: 'Erro ao registrar atividade', type: 'error' });
    } finally {
      setIsSavingActivity(false);
    }
  };

  const getBMI = () => {
    if (formData.weight && formData.height) {
      return getBMIInfo(formData.weight, formData.height);
    }
    return null;
  };

  const getTotalDailyCalories = () => {
    return formData.breakfast_calories +
           formData.lunch_calories +
           formData.dinner_calories +
           (formData.snack_calories * formData.snack_quantity);
  };

  const bmi = getBMI();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

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
          <div className="flex items-center mb-2">
            <HeartIcon className="w-7 h-7 text-white mr-3" />
            <h1 className="text-white text-2xl font-bold">Saúde e Metas</h1>
          </div>
          <p className="text-white/80">Configure suas metas e acompanhe sua saúde</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Body Data Section */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ScaleIcon className="w-5 h-5 mr-2 text-emerald-600" />
            Dados Corporais
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso (kg)
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                step="0.1"
                min="30"
                max="300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Altura (cm)
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                min="100"
                max="250"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idade
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                min="13"
                max="120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sexo
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
              </select>
            </div>
          </div>

          {/* BMI Display */}
          {bmi && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">IMC (Índice de Massa Corporal)</p>
                  <p className="text-2xl font-bold" style={{ color: bmi.color }}>
                    {bmi.value.toFixed(1)}
                  </p>
                  <p className="text-sm font-medium" style={{ color: bmi.color }}>
                    {bmi.label}
                  </p>
                </div>
                <div className="text-4xl">
                  {bmi.value < 18.5 ? '😟' :
                   bmi.value < 25 ? '😊' :
                   bmi.value < 30 ? '😐' : '😟'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Daily Calorie Goals */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FireIcon className="w-5 h-5 mr-2 text-orange-500" />
            Metas de Calorias Diárias
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ☀️ Café da Manhã (kcal)
              </label>
              <input
                type="number"
                value={formData.breakfast_calories}
                onChange={(e) => setFormData({ ...formData, breakfast_calories: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                step="50"
                min="100"
                max="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🍽️ Almoço (kcal)
              </label>
              <input
                type="number"
                value={formData.lunch_calories}
                onChange={(e) => setFormData({ ...formData, lunch_calories: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                step="50"
                min="100"
                max="1500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🌙 Jantar (kcal)
              </label>
              <input
                type="number"
                value={formData.dinner_calories}
                onChange={(e) => setFormData({ ...formData, dinner_calories: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                step="50"
                min="100"
                max="1500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🍪 Lanche (kcal)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.snack_calories}
                  onChange={(e) => setFormData({ ...formData, snack_calories: parseInt(e.target.value) || 0 })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  step="50"
                  min="50"
                  max="500"
                />
                <input
                  type="number"
                  value={formData.snack_quantity}
                  onChange={(e) => setFormData({ ...formData, snack_quantity: parseInt(e.target.value) || 1 })}
                  className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
                  min="0"
                  max="5"
                  title="Quantidade de lanches"
                />
                <span className="flex items-center text-gray-500">x</span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-emerald-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Diário</span>
              <span className="text-2xl font-bold text-emerald-600">
                {getTotalDailyCalories()} kcal
              </span>
            </div>
          </div>

          <button
            onClick={handleSaveGoals}
            disabled={isSaving}
            className={`w-full mt-4 py-3 font-semibold rounded-lg shadow-md transition-all duration-200 ${
              isSaving
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg transform hover:scale-[1.02]'
            }`}
          >
            {isSaving ? 'Salvando...' : 'Salvar Metas'}
          </button>
        </div>

        {/* Register Weight */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ScaleIcon className="w-5 h-5 mr-2 text-purple-600" />
            Registrar Peso
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Novo Peso (kg)
              </label>
              <input
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                step="0.1"
                placeholder="Ex: 70.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <input
                type="date"
                value={weightDate}
                onChange={(e) => setWeightDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSaveWeight}
                disabled={!newWeight || isSavingWeight}
                className={`w-full py-2 font-medium rounded-lg transition-all duration-200 ${
                  !newWeight || isSavingWeight
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-500 text-white hover:bg-purple-600 shadow-md hover:shadow-lg'
                }`}
              >
                {isSavingWeight ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Registrando...
                  </>
                ) : (
                  <>
                    <PlusCircleIcon className="w-5 h-5 inline mr-1" />
                    Registrar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Register Activity */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FireIcon className="w-5 h-5 mr-2 text-orange-500" />
            Registrar Atividade Física
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Atividade
              </label>
              <input
                type="text"
                value={activityType}
                onChange={(e) => handleActivitySearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Ex: Caminhada"
              />
              {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {activitySuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setActivityType(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duração (minutos)
              </label>
              <input
                type="number"
                value={activityDuration}
                onChange={(e) => {
                  setActivityDuration(e.target.value);
                  if (activityType && formData.weight) {
                    const met = getActivityMET(activityType);
                    if (met) {
                      const calories = calculateCaloriesBurned(met, formData.weight, parseFloat(e.target.value));
                      setCalculatedCalories(Math.round(calories));
                    }
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                min="1"
                placeholder="Ex: 30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calorias Queimadas
              </label>
              <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                {calculatedCalories > 0 ? `${calculatedCalories} kcal` : '---'}
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveActivity}
            disabled={!activityType || !activityDuration || isSavingActivity}
            className={`w-full mt-4 py-3 font-medium rounded-lg transition-all duration-200 ${
              !activityType || !activityDuration || isSavingActivity
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg'
            }`}
          >
            {isSavingActivity ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Registrando...
              </>
            ) : (
              <>
                <PlusCircleIcon className="w-5 h-5 inline mr-1" />
                Registrar Atividade
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthPage;