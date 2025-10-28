import React, { useState, useEffect } from 'react';
import type { WeightEntry } from '../../types';
import { weightHistoryService } from '../../services/weightHistoryService';
import { getBMIInfo, getWeightDifference, getDaysBetween, formatWeightDifference } from '../../utils/bmiUtils';
import Pagination from '../Pagination';
import { usePagination } from '../../hooks/usePagination';

export const WeightHistory: React.FC = () => {
  const [history, setHistory] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const { data, error } = await weightHistoryService.getWeightHistory();
    if (data) {
      setHistory(data);
    } else if (error) {
      setError('Erro ao carregar histórico');
    }
    setLoading(false);
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-orange"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-error text-center py-4">{error}</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p>Nenhuma pesagem registrada ainda.</p>
        <p className="text-sm mt-2">Adicione sua primeira pesagem para começar a acompanhar seu progresso!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total de registros */}
      <div className="text-sm text-gray-600">
        Total de {totalItems} pesagem{totalItems !== 1 ? 'ns' : ''} registrada{totalItems !== 1 ? 's' : ''}
      </div>

      {paginatedItems.map((entry, index) => {
        const previousEntry = paginatedItems[index + 1] || null;
        const bmiInfo = entry.bmi && entry.height ? getBMIInfo(entry.weight, entry.height) : null;
        const weightDiff = previousEntry ? getWeightDifference(entry.weight, previousEntry.weight) : null;
        const daysSince = previousEntry ? getDaysBetween(entry.measured_at, previousEntry.measured_at) : null;

        return (
          <div
            key={entry.id}
            className="bg-secondary-bg rounded-lg p-4 border-l-4 hover:bg-hover-bg transition-colors"
            style={{ borderLeftColor: bmiInfo?.color || '#6b6b6b' }}
          >
            {/* Header com data e peso */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-text-bright font-semibold text-lg">
                  {entry.weight} kg
                </div>
                <div className="text-text-secondary text-sm">
                  {new Date(entry.measured_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>

              {/* IMC Badge */}
              {bmiInfo && (
                <div
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: bmiInfo.color }}
                >
                  IMC {bmiInfo.value}
                </div>
              )}
            </div>

            {/* Categoria IMC */}
            {bmiInfo && (
              <div className="text-sm text-text-primary mb-2">
                {bmiInfo.label}
              </div>
            )}

            {/* Comparação com pesagem anterior */}
            {weightDiff !== null && daysSince !== null && (
              <div className="flex items-center gap-2 text-sm mb-2">
                <span
                  className={`font-semibold ${
                    weightDiff > 0
                      ? 'text-warning'
                      : weightDiff < 0
                      ? 'text-success'
                      : 'text-text-secondary'
                  }`}
                >
                  {weightDiff > 0 && '↑'}{weightDiff < 0 && '↓'}
                  {formatWeightDifference(weightDiff)}
                </span>
                <span className="text-text-secondary">
                  em {daysSince} {daysSince === 1 ? 'dia' : 'dias'}
                </span>
              </div>
            )}

            {/* Notas do usuário */}
            {entry.notes && (
              <div className="bg-primary-bg rounded p-2 text-sm text-text-primary mb-2">
                <span className="text-text-secondary">Nota: </span>
                {entry.notes}
              </div>
            )}

            {/* Análise da IA */}
            {entry.ai_analysis && (
              <div className="bg-gradient-to-r from-accent-orange/10 to-accent-coral/10 rounded-lg p-3 text-sm text-text-primary border border-accent-orange/20">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🤖</span>
                  <div className="flex-1">
                    <div className="font-semibold text-accent-orange mb-1">Análise do Assistente:</div>
                    <div className="whitespace-pre-line">{entry.ai_analysis}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Paginação */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        itemsPerPage={50}
        totalItems={totalItems}
      />
    </div>
  );
};
