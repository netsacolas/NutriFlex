import React, { useState, useEffect } from 'react';
import { hydrationService } from '../services/hydrationService';
import type { HydrationIntake } from '../types';
import { TrashIcon } from './Layout/Icons';
import Pagination from './Pagination';
import { usePagination } from '../hooks/usePagination';

type FilterType = 'today' | 'week' | 'month' | 'all';

interface HydrationHistoryProps {
  filter: FilterType;
  onDelete?: () => void;
}

export const HydrationHistory: React.FC<HydrationHistoryProps> = ({ filter, onDelete }) => {
  const [intakes, setIntakes] = useState<HydrationIntake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    id: string | null;
    amount: number;
  }>({
    show: false,
    id: null,
    amount: 0,
  });

  useEffect(() => {
    loadIntakes();
  }, [filter]);

  const loadIntakes = async () => {
    setIsLoading(true);
    try {
      const { data } = await hydrationService.getIntakeHistory(getDaysToLoad());
      setIntakes(data || []);
    } catch (error) {
      console.error('Error loading hydration history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysToLoad = () => {
    switch (filter) {
      case 'today':
        return 1;
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'all':
        return 365;
      default:
        return 7;
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    try {
      await hydrationService.deleteIntake(deleteModal.id);
      setDeleteModal({ show: false, id: null, amount: 0 });
      loadIntakes();
      onDelete?.();
    } catch (error) {
      console.error('Error deleting intake:', error);
      alert('Erro ao excluir ingestão');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Paginação
  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    totalItems,
  } = usePagination({
    items: intakes,
    itemsPerPage: 50,
  });

  const getTotalConsumed = () => {
    return intakes.reduce((sum, intake) => sum + (intake.completed ? intake.amount_ml : 0), 0);
  };

  const getCompletedCount = () => {
    return intakes.filter((i) => i.completed).length;
  };

  const getFilterLabel = () => {
    switch (filter) {
      case 'today':
        return 'Hoje';
      case 'week':
        return 'Última Semana';
      case 'month':
        return 'Último Mês';
      case 'all':
        return 'Tudo';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Total Consumido</p>
            <p className="text-2xl font-bold text-cyan-600">{getTotalConsumed()}ml</p>
            <p className="text-xs text-gray-500">{getFilterLabel()}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Ingestões</p>
            <p className="text-2xl font-bold text-blue-600">{getCompletedCount()}</p>
            <p className="text-xs text-gray-500">Completadas</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Média por Ingestão</p>
            <p className="text-2xl font-bold text-emerald-600">
              {getCompletedCount() > 0 ? Math.round(getTotalConsumed() / getCompletedCount()) : 0}ml
            </p>
            <p className="text-xs text-gray-500">Por vez</p>
          </div>
        </div>

        {/* Intakes List */}
        {intakes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💧</div>
            <p className="text-gray-500 text-lg">Nenhuma ingestão registrada</p>
            <p className="text-gray-400 text-sm mt-2">
              Comece a registrar sua hidratação para acompanhar seu progresso
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Total de registros */}
            <div className="text-sm text-gray-600">
              Total de {totalItems} ingestão{totalItems !== 1 ? 'ões' : ''} registrada{totalItems !== 1 ? 's' : ''}
            </div>

            {paginatedItems.map((intake) => (
              <div
                key={intake.id}
                className={`bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all ${
                  intake.completed ? 'border-l-4 border-cyan-500' : 'border-l-4 border-gray-300 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-4xl">💧</div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800 text-lg">{intake.amount_ml}ml</p>
                        {intake.completed ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            Completado
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                            Não completado
                          </span>
                        )}
                        {intake.snoozed && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                            Adiado {intake.snooze_count}x
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <span>📅</span>
                          <span>{formatDate(intake.date)}</span>
                        </div>

                        {intake.completed && intake.actual_time && (
                          <div className="flex items-center gap-1">
                            <span>🕐</span>
                            <span>{formatTime(intake.actual_time)}</span>
                          </div>
                        )}

                        {!intake.completed && (
                          <div className="flex items-center gap-1">
                            <span>⏰</span>
                            <span>Programado: {formatTime(intake.scheduled_time)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setDeleteModal({
                        show: true,
                        id: intake.id,
                        amount: intake.amount_ml,
                      })
                    }
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Paginação */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              itemsPerPage={50}
              totalItems={totalItems}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Excluir Ingestão?</h3>
              <p className="text-gray-600">
                Tem certeza que deseja excluir a ingestão de {deleteModal.amount}ml?
              </p>
              <p className="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, id: null, amount: 0 })}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
