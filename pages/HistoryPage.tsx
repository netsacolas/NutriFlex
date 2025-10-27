import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { mealHistoryService } from '../services/mealHistoryService';
import { physicalActivityService } from '../services/physicalActivityService';
import { weightHistoryService } from '../services/weightHistoryService';
import {
  CalendarDaysIcon,
  FireIcon,
  ChartBarIcon,
  ScaleIcon,
  TrashIcon,
  WaterDropIcon
} from '../components/Layout/Icons';
import { HydrationHistory } from '../components/HydrationHistory';
import type { MealHistory, PhysicalActivity, WeightHistory } from '../types';

type TabType = 'meals' | 'activities' | 'weight' | 'hydration';
type FilterType = 'today' | 'week' | 'month' | 'all';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('meals');
  const [filter, setFilter] = useState<FilterType>('today');

  // Data states
  const [meals, setMeals] = useState<MealHistory[]>([]);
  const [activities, setActivities] = useState<PhysicalActivity[]>([]);
  const [weights, setWeights] = useState<WeightHistory[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    type: 'meal' | 'activity' | 'weight' | null;
    id: string | null;
    name: string;
  }>({
    show: false,
    type: null,
    id: null,
    name: ''
  });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Verificar se dados obrigatórios estão preenchidos
      const { data: userProfile } = await profileService.getProfile();
      if (userProfile) {
        const hasRequiredData = userProfile.weight && userProfile.height && userProfile.age && userProfile.gender;

        if (!hasRequiredData) {
          // Redirecionar para onboarding
          navigate('/onboarding');
          return;
        }
      }

      const userId = session.user.id;

      // Load all data
      const [mealsResult, activitiesResult, weightsResult] = await Promise.all([
        mealHistoryService.getUserMealHistory(userId),
        physicalActivityService.getUserActivities(365),
        weightHistoryService.getUserWeightHistory(userId)
      ]);

      const mealsData = mealsResult.data || [];
      const activitiesData = activitiesResult.data || [];
      const weightsData = weightsResult.data || [];

      // Apply filter
      const filteredMeals = filterByDate(mealsData, filter, 'consumed_at');
      const filteredActivities = filterByDate(activitiesData, filter, 'performed_at');
      const filteredWeights = filterByDate(weightsData, filter, 'measured_at');

      setMeals(filteredMeals);
      setActivities(filteredActivities);
      setWeights(filteredWeights);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterByDate = <T extends { [key: string]: any }>(
    items: T[],
    filterType: FilterType,
    dateField: string
  ): T[] => {
    if (filterType === 'all') return items;

    const now = new Date();
    const cutoffDate = new Date();

    if (filterType === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return items.filter(item => item[dateField].startsWith(today));
    } else if (filterType === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (filterType === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    }

    return items.filter(item => new Date(item[dateField]) >= cutoffDate);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateStats = () => {
    return {
      meals: {
        total: meals.length,
        totalCalories: meals.reduce((sum, m) => sum + m.total_calories, 0),
        avgCalories: meals.length > 0 ? Math.round(meals.reduce((sum, m) => sum + m.total_calories, 0) / meals.length) : 0
      },
      activities: {
        total: activities.length,
        totalBurned: activities.reduce((sum, a) => sum + (a.calories_burned || 0), 0),
        totalMinutes: activities.reduce((sum, a) => sum + a.duration_minutes, 0)
      },
      weight: {
        current: weights[0]?.weight || 0,
        initial: weights[weights.length - 1]?.weight || 0,
        change: weights.length > 1 ? (weights[0]?.weight - weights[weights.length - 1]?.weight) : 0
      }
    };
  };

  const handleDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return;

    try {
      if (deleteModal.type === 'meal') {
        await mealHistoryService.deleteMealHistory(deleteModal.id);
        setMeals(meals.filter(m => m.id !== deleteModal.id));
      } else if (deleteModal.type === 'activity') {
        await physicalActivityService.deleteActivity(deleteModal.id);
        setActivities(activities.filter(a => a.id !== deleteModal.id));
      } else if (deleteModal.type === 'weight') {
        await weightHistoryService.deleteWeightEntry(deleteModal.id);
        setWeights(weights.filter(w => w.id !== deleteModal.id));
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setDeleteModal({ show: false, type: null, id: null, name: '' });
    }
  };

  const stats = calculateStats();

  const tabs = [
    { id: 'meals' as TabType, label: 'Refeições', icon: '🍽️', count: meals.length },
    { id: 'activities' as TabType, label: 'Atividades', icon: '🏃', count: activities.length },
    { id: 'hydration' as TabType, label: 'Hidratação', icon: '💧', count: 0 },
    { id: 'weight' as TabType, label: 'Peso', icon: '⚖️', count: weights.length }
  ];

  const filters = [
    { id: 'today' as FilterType, label: 'Hoje' },
    { id: 'week' as FilterType, label: 'Última Semana' },
    { id: 'month' as FilterType, label: 'Último Mês' },
    { id: 'all' as FilterType, label: 'Tudo' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 pt-12 pb-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-2">
            <CalendarDaysIcon className="w-7 h-7 text-white mr-3" />
            <h1 className="text-white text-2xl font-bold">Histórico</h1>
          </div>
          <p className="text-white/80">Acompanhe sua evolução ao longo do tempo</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-2 text-center transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? 'text-emerald-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === f.id
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4">
        {/* Meals Tab */}
        {activeTab === 'meals' && (
          <div>
            {/* Stats Card */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white mb-6 shadow-xl">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold">{stats.meals.total}</p>
                  <p className="text-white/80 text-sm">Refeições</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.meals.totalCalories.toLocaleString()}</p>
                  <p className="text-white/80 text-sm">Total kcal</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.meals.avgCalories}</p>
                  <p className="text-white/80 text-sm">Média kcal</p>
                </div>
              </div>
            </div>

            {/* Meals List */}
            {meals.length > 0 ? (
              <div className="space-y-3">
                {meals.map(meal => (
                  <div key={meal.id} className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 hover:shadow-2xl transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {getMealTypeLabel(meal.meal_type)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {meal.portions?.map((p: any) => p.foodName).join(', ') || 'Sem detalhes'}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>P: {meal.total_protein?.toFixed(0) || 0}g</span>
                          <span>C: {meal.total_carbs?.toFixed(0) || 0}g</span>
                          <span>G: {meal.total_fat?.toFixed(0) || 0}g</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-emerald-600">
                          {meal.total_calories} kcal
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(meal.consumed_at)}
                        </p>
                        <button
                          onClick={() => setDeleteModal({
                            show: true,
                            type: 'meal',
                            id: meal.id,
                            name: getMealTypeLabel(meal.meal_type)
                          })}
                          className="mt-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-12 text-center">
                <FireIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma refeição registrada neste período</p>
              </div>
            )}
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div>
            {/* Stats Card */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white mb-6 shadow-xl">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold">{stats.activities.total}</p>
                  <p className="text-white/80 text-sm">Atividades</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.activities.totalBurned.toLocaleString()}</p>
                  <p className="text-white/80 text-sm">kcal Queimadas</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.activities.totalMinutes}</p>
                  <p className="text-white/80 text-sm">Minutos</p>
                </div>
              </div>
            </div>

            {/* Activities List */}
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map(activity => (
                  <div key={activity.id} className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 hover:shadow-2xl transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {activity.activity_type}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Duração: {activity.duration_minutes} minutos
                        </p>
                        {activity.notes && (
                          <p className="text-xs text-gray-500 mt-1">{activity.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-orange-600">
                          -{activity.calories_burned} kcal
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(activity.performed_at)}
                        </p>
                        <button
                          onClick={() => setDeleteModal({
                            show: true,
                            type: 'activity',
                            id: activity.id,
                            name: activity.activity_type
                          })}
                          className="mt-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-12 text-center">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma atividade registrada neste período</p>
              </div>
            )}
          </div>
        )}

        {/* Hydration Tab */}
        {activeTab === 'hydration' && (
          <HydrationHistory filter={filter} onDelete={loadData} />
        )}

        {/* Weight Tab */}
        {activeTab === 'weight' && (
          <div>
            {/* Stats Card */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white mb-6 shadow-xl">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold">{stats.weight.current.toFixed(1)}</p>
                  <p className="text-white/80 text-sm">Peso Atual (kg)</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {stats.weight.change > 0 ? '+' : ''}{stats.weight.change.toFixed(1)}
                  </p>
                  <p className="text-white/80 text-sm">Variação (kg)</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{weights.length}</p>
                  <p className="text-white/80 text-sm">Registros</p>
                </div>
              </div>
            </div>

            {/* Weight List */}
            {weights.length > 0 ? (
              <div className="space-y-3">
                {weights.map((weight, index) => {
                  const previousWeight = weights[index + 1]?.weight;
                  const change = previousWeight ? weight.weight - previousWeight : 0;

                  return (
                    <div key={weight.id} className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 hover:shadow-2xl transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <ScaleIcon className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-bold text-xl text-gray-900">
                              {weight.weight} kg
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(weight.measured_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {change !== 0 && (
                            <span className={`text-sm font-medium ${
                              change > 0 ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {change > 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)} kg
                            </span>
                          )}
                          <button
                            onClick={() => setDeleteModal({
                              show: true,
                              type: 'weight',
                              id: weight.id,
                              name: `${weight.weight} kg`
                            })}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-12 text-center">
                <ScaleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma pesagem registrada neste período</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Deseja realmente excluir "{deleteModal.name}"? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, type: null, id: null, name: '' })}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;