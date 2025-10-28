import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { mealHistoryService } from '../services/mealHistoryService';
import { physicalActivityService } from '../services/physicalActivityService';
import { getTipOfTheDay } from '../data/dailyTips';
import {
  SparklesIcon,
  FireIcon,
  ChartBarIcon,
  PlusCircleIcon,
  ArrowRightIcon
} from '../components/Layout/Icons';
import type { UserProfile, MealHistory, PhysicalActivity } from '../types';

interface DailySummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealsCount: number;
  activitiesCount: number;
  caloriesBurned: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentMeals, setRecentMeals] = useState<MealHistory[]>([]);
  const [todaysSummary, setTodaysSummary] = useState<DailySummary>({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealsCount: 0,
    activitiesCount: 0,
    caloriesBurned: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dailyTip, setDailyTip] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
    // Carregar dica do dia
    const tip = getTipOfTheDay();
    setDailyTip(tip);
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Load profile
      const { data: userProfile } = await profileService.getProfile();
      setProfile(userProfile);

      // IMPORTANTE: Verificar sempre se dados obrigatórios estão preenchidos
      // Se não estiver, redirecionar para onboarding independente do localStorage
      if (userProfile) {
        const hasRequiredData = userProfile.weight && userProfile.height && userProfile.age && userProfile.gender;

        if (!hasRequiredData) {
          // Dados obrigatórios não preenchidos - redirecionar para onboarding
          navigate('/onboarding');
          return;
        }
      }

      // Load today's meals
      const today = new Date().toISOString().split('T')[0];
      const mealsResult = await mealHistoryService.getUserMealHistory(session.user.id);
      const meals = mealsResult.data || [];
      const todaysMeals = meals.filter(meal =>
        meal.consumed_at.startsWith(today)
      );

      // Load recent meals (last 3)
      const recent = meals.slice(0, 3);
      setRecentMeals(recent);

      // Load today's activities
      const { data: activities } = await physicalActivityService.getUserActivities(30);
      const todaysActivities = (activities || []).filter(activity =>
        activity.performed_at?.startsWith(today)
      );

      // Calculate summary
      const summary: DailySummary = {
        totalCalories: todaysMeals.reduce((sum, meal) => sum + meal.total_calories, 0),
        totalProtein: todaysMeals.reduce((sum, meal) => sum + (meal.total_protein || 0), 0),
        totalCarbs: todaysMeals.reduce((sum, meal) => sum + (meal.total_carbs || 0), 0),
        totalFat: todaysMeals.reduce((sum, meal) => sum + (meal.total_fat || 0), 0),
        mealsCount: todaysMeals.length,
        activitiesCount: todaysActivities.length,
        caloriesBurned: todaysActivities.reduce((sum, activity) => sum + (activity.calories_burned || 0), 0)
      };

      setTodaysSummary(summary);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getDailyCalorieGoal = () => {
    if (!profile) return 2000;
    const {
      breakfast_calories = 0,
      lunch_calories = 0,
      dinner_calories = 0,
      snack_calories = 0,
      snack_quantity = 1
    } = profile;
    return breakfast_calories + lunch_calories + dinner_calories + (snack_calories * snack_quantity);
  };

  const getCalorieProgress = () => {
    const goal = getDailyCalorieGoal();
    const consumed = todaysSummary.totalCalories;
    const percentage = Math.min((consumed / goal) * 100, 100);
    return { consumed, goal, percentage };
  };

  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breakfast: '☀️ Café da manhã',
      lunch: '🍽️ Almoço',
      dinner: '🌙 Jantar',
      snack: '🍪 Lanche'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const calorieProgress = getCalorieProgress();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 pt-12 pb-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-bold mb-2">
                {getGreeting()}, {profile?.full_name || 'Usuário'}!
              </h1>
              <p className="text-white/80">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Main Stats Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900 font-semibold">Resumo de Hoje</h2>
            <FireIcon className="w-6 h-6 text-orange-500" />
          </div>

          {/* Calorie Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Calorias Consumidas</span>
              <span className="font-semibold text-gray-900">
                {calorieProgress.consumed} / {calorieProgress.goal} kcal
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${calorieProgress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {calorieProgress.percentage.toFixed(0)}% da meta diária
            </p>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600">Proteína</p>
              <p className="text-lg font-bold text-blue-600">{todaysSummary.totalProtein.toFixed(0)}g</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600">Carboidratos</p>
              <p className="text-lg font-bold text-orange-600">{todaysSummary.totalCarbs.toFixed(0)}g</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600">Gorduras</p>
              <p className="text-lg font-bold text-yellow-600">{todaysSummary.totalFat.toFixed(0)}g</p>
            </div>
          </div>
        </div>
        {/* Quick Actions */}
        <div className="mb-8">
          <Link
            to="/plan"
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl p-4 flex items-center justify-between shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
          >
            <div className="flex items-center">
              <PlusCircleIcon className="w-8 h-8 mr-3" />
              <div>
                <p className="font-semibold text-lg">Planejar Nova Refeição</p>
                <p className="text-white/80 text-sm">Calcule as porções ideais com IA</p>
              </div>
            </div>
            <ArrowRightIcon className="w-6 h-6" />
          </Link>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Refeições</p>
                <p className="text-2xl font-bold text-gray-900">{todaysSummary.mealsCount}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🍽️</span>
              </div>
            </div>
          </div>

          <Link to="/health" className="block">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 hover:shadow-2xl hover:border-orange-300 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Atividades</p>
                  <p className="text-2xl font-bold text-gray-900">{todaysSummary.activitiesCount}</p>
                  <p className="text-xs text-orange-600">-{todaysSummary.caloriesBurned} kcal</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🏃</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Meals */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Últimas Refeições</h2>
            <Link to="/history" className="text-sm text-emerald-600 hover:text-emerald-700">
              Ver todas →
            </Link>
          </div>

          {recentMeals.length > 0 ? (
            <div className="space-y-3">
              {recentMeals.map((meal) => (
                <div key={meal.id} className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 hover:shadow-2xl transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {getMealTypeLabel(meal.meal_type)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(meal.consumed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-emerald-600">
                        {meal.total_calories} kcal
                      </p>
                      <p className="text-xs text-gray-500">
                        P: {meal.total_protein?.toFixed(0) || 0}g • C: {meal.total_carbs?.toFixed(0) || 0}g • G: {meal.total_fat?.toFixed(0) || 0}g
                      </p>
                    </div>
                  </div>

                  {/* Alimentos detalhados */}
                  {meal.portions && meal.portions.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2">Alimentos:</p>
                      <div className="space-y-1">
                        {meal.portions.map((portion, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">
                              • {portion.foodName}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {portion.grams}g ({portion.calories} kcal)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma refeição registrada ainda</p>
              <Link
                to="/plan"
                className="inline-flex items-center mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Planejar primeira refeição
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Daily Tip */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-2xl">
          <div className="flex items-start">
            <SparklesIcon className="w-8 h-8 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg mb-2">💡 Dica do Dia</h3>
              <p className="text-white/90 leading-relaxed">
                {dailyTip || 'Carregando dica...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;