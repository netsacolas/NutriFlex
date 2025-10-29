import React, { useState, useEffect } from 'react';
import { mealConsumptionService } from '../../services/mealConsumptionService';
import type { MealConsumption, MealType } from '../../types';
import {
    SunriseIcon,
    PlateIcon,
    MoonIcon,
    CookieIcon,
    BarChartIcon
} from '../icons';
import Pagination from '../Pagination';
import { usePagination } from '../../hooks/usePagination';
import { useSubscription } from '../../contexts/SubscriptionContext';

export const MealHistory: React.FC = () => {
  const [history, setHistory] = useState<MealConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealConsumption | null>(null);
  const [filterDays, setFilterDays] = useState(30);
  const { limits } = useSubscription();
  const historyLimit = limits.historyItems;

  const mealTypeLabels: Record<MealType, string> = {
    breakfast: 'Café da Manhã',
    lunch: 'Almoço',
    dinner: 'Jantar',
    snack: 'Lanche'
  };

  const mealTypeIcons: Record<MealType, React.ReactNode> = {
    breakfast: <SunriseIcon className="w-5 h-5 text-green-500" />,
    lunch: <PlateIcon className="w-5 h-5 text-green-500" />,
    dinner: <MoonIcon className="w-5 h-5 text-green-500" />,
    snack: <CookieIcon className="w-5 h-5 text-green-500" />
  };

  const mealTypeColors: Record<MealType, string> = {
    breakfast: 'bg-green-500/20 border-green-500',
    lunch: 'bg-emerald-500/20 border-emerald-500',
    dinner: 'bg-teal-500/20 border-teal-500',
    snack: 'bg-lime-500/20 border-lime-500'
  };

  useEffect(() => {
    loadHistory();
  }, [filterDays]);

  const loadHistory = async () => {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await mealConsumptionService.getMealHistory(filterDays);

    if (fetchError) {
      setError('Erro ao carregar histórico de consumo.');
      setLoading(false);
      return;
    }

    const list = data || [];
    const limitedList = historyLimit !== null ? list.slice(0, historyLimit) : list;
    setHistory(limitedList);
    setLoading(false);
  };

  const historyLimited = historyLimit !== null;

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta refeição?')) return;

    const { error: deleteError } = await mealConsumptionService.deleteMeal(id);

    if (deleteError) {
      setError('Erro ao deletar refeição.');
      return;
    }

    setHistory(prev => prev.filter(m => m.id !== id));
    setSelectedMeal(null);
  };

  // Paginação
  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    totalItems,
  } = usePagination({
    items: history,
    itemsPerPage: 50,
  });

  // Group meals by date (usando items paginados)
  const groupedMeals = paginatedItems.reduce((groups, meal) => {
    const date = new Date(meal.consumed_at).toLocaleDateString('pt-BR');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meal);
    return groups;
  }, {} as Record<string, MealConsumption[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <PlateIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">Nenhuma refeição registrada</h3>
        <p className="text-text-secondary">
          Comece a salvar suas refeições para acompanhar seu histórico nutricional!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-text-bright flex items-center gap-2">
          <BarChartIcon className="w-6 h-6 text-green-500" />
          Histórico de Consumo
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterDays(7)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterDays === 7
                ? 'bg-green-500 text-white'
                : 'bg-secondary-bg text-text-primary hover:bg-hover-bg'
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setFilterDays(30)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterDays === 30
                ? 'bg-green-500 text-white'
                : 'bg-secondary-bg text-text-primary hover:bg-hover-bg'
            }`}
          >
            30 dias
          </button>
          <button
            onClick={() => setFilterDays(90)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterDays === 90
                ? 'bg-green-500 text-white'
                : 'bg-secondary-bg text-text-primary hover:bg-hover-bg'
            }`}
          >
            90 dias
          </button>
      </div>
    </div>
    {historyLimited && (
      <div className="bg-white border border-emerald-100 rounded-lg p-4 text-sm text-gray-700">
        Plano Gratuito mostra apenas os ultimos {historyLimit ?? 0} registros. Assine o Premium para liberar o historico completo.
      </div>
    )}

      {/* Total de registros */}
      <div className="text-sm text-gray-600">
        Total de {totalItems} refeição{totalItems !== 1 ? 'ões' : ''} registrada{totalItems !== 1 ? 's' : ''}
      </div>

      {/* Meal History Timeline */}
      <div className="space-y-4">
        {Object.entries(groupedMeals).map(([date, meals]) => (
          <div key={date} className="bg-secondary-bg rounded-lg p-4 border border-border-color">
            <h4 className="text-lg font-semibold text-text-bright mb-3">{date}</h4>
            <div className="space-y-2">
              {meals.map(meal => (
                <div
                  key={meal.id}
                  className={`p-3 rounded-lg border-l-4 ${mealTypeColors[meal.meal_type]} cursor-pointer hover:bg-hover-bg transition-colors`}
                  onClick={() => setSelectedMeal(meal)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{mealTypeIcons[meal.meal_type]}</span>
                        <span className="font-semibold text-text-bright">
                          {mealTypeLabels[meal.meal_type]}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {new Date(meal.consumed_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary">
                        {meal.total_calories.toFixed(0)} kcal •
                        P: {meal.total_protein?.toFixed(0) || 0}g •
                        C: {meal.total_carbs?.toFixed(0) || 0}g •
                        G: {meal.total_fat?.toFixed(0) || 0}g
                      </div>
                      {meal.notes && (
                        <div className="text-xs text-text-secondary mt-1 italic">
                          "{meal.notes}"
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(meal.id);
                      }}
                      className="text-error hover:text-red-700 ml-2"
                      title="Deletar refeição"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        itemsPerPage={50}
        totalItems={totalItems}
      />

      {/* Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card-bg rounded-xl p-6 w-full max-w-lg border border-border-color shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{mealTypeIcons[selectedMeal.meal_type]}</span>
                <h3 className="text-xl font-bold text-text-bright">
                  {mealTypeLabels[selectedMeal.meal_type]}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMeal(null)}
                className="text-text-secondary hover:text-text-bright text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-secondary-bg p-3 rounded-lg border border-border-color">
                <p className="text-xs text-text-secondary mb-1">Data e Hora</p>
                <p className="text-text-bright font-medium">
                  {new Date(selectedMeal.consumed_at).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary-bg p-3 rounded-lg border border-border-color">
                  <p className="text-xs text-text-secondary mb-1">Calorias</p>
                  <p className="text-xl font-bold text-accent-orange">
                    {selectedMeal.total_calories.toFixed(0)} kcal
                  </p>
                </div>
                <div className="bg-secondary-bg p-3 rounded-lg border border-border-color">
                  <p className="text-xs text-text-secondary mb-1">Proteína</p>
                  <p className="text-xl font-bold text-success">
                    {selectedMeal.total_protein?.toFixed(1) || 0}g
                  </p>
                </div>
                <div className="bg-secondary-bg p-3 rounded-lg border border-border-color">
                  <p className="text-xs text-text-secondary mb-1">Carboidratos</p>
                  <p className="text-xl font-bold text-warning">
                    {selectedMeal.total_carbs?.toFixed(1) || 0}g
                  </p>
                </div>
                <div className="bg-secondary-bg p-3 rounded-lg border border-border-color">
                  <p className="text-xs text-text-secondary mb-1">Gordura</p>
                  <p className="text-xl font-bold text-info">
                    {selectedMeal.total_fat?.toFixed(1) || 0}g
                  </p>
                </div>
              </div>

              {selectedMeal.total_fiber !== null && selectedMeal.total_fiber > 0 && (
                <div className="bg-secondary-bg p-3 rounded-lg border border-border-color">
                  <p className="text-xs text-text-secondary mb-1">Fibras</p>
                  <p className="text-lg font-semibold text-text-bright">
                    {selectedMeal.total_fiber.toFixed(1)}g
                  </p>
                </div>
              )}

              {(selectedMeal.glycemic_index || selectedMeal.glycemic_load) && (
                <div className="grid grid-cols-2 gap-3">
                  {selectedMeal.glycemic_index && (
                    <div className="bg-secondary-bg p-3 rounded-lg border border-border-color">
                      <p className="text-xs text-text-secondary mb-1">Índice Glicêmico</p>
                      <p className="text-lg font-semibold text-text-bright">
                        {selectedMeal.glycemic_index.toFixed(0)}
                      </p>
                    </div>
                  )}
                  {selectedMeal.glycemic_load && (
                    <div className="bg-secondary-bg p-3 rounded-lg border border-border-color">
                      <p className="text-xs text-text-secondary mb-1">Carga Glicêmica</p>
                      <p className="text-lg font-semibold text-text-bright">
                        {selectedMeal.glycemic_load.toFixed(1)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedMeal.portions && selectedMeal.portions.length > 0 && (
                <div className="bg-secondary-bg p-3 rounded-lg border border-border-color">
                  <p className="text-xs text-text-secondary mb-2">Alimentos Consumidos:</p>
                  <div className="space-y-1">
                    {selectedMeal.portions.map((portion, index) => (
                      <div key={index} className="text-sm text-text-primary">
                        • {portion.foodName}: {portion.grams}g ({portion.calories} kcal)
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMeal.notes && (
                <div className="bg-secondary-bg p-3 rounded-lg border border-border-color">
                  <p className="text-xs text-text-secondary mb-1">Observações</p>
                  <p className="text-text-primary">{selectedMeal.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedMeal(null)}
              className="w-full mt-4 bg-secondary-bg text-text-primary font-semibold px-6 py-3 rounded-lg border border-border-color hover:bg-hover-bg transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};




