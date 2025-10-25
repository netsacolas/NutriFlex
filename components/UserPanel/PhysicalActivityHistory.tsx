import React, { useState, useEffect } from 'react';
import { physicalActivityService } from '../../services/physicalActivityService';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import type { PhysicalActivity } from '../../types';

export const PhysicalActivityHistory: React.FC = () => {
  const [activities, setActivities] = useState<PhysicalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('week');

  useEffect(() => {
    loadActivities();
  }, [filter]);

  const loadActivities = async () => {
    setLoading(true);
    setError('');

    const days = filter === 'week' ? 7 : filter === 'month' ? 30 : 365;
    const { data, error: fetchError } = await physicalActivityService.getActivities(days);

    if (fetchError) {
      setError('Erro ao carregar atividades');
    } else {
      setActivities(data || []);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    const { error: deleteError } = await physicalActivityService.deleteActivity(deleteId);

    if (deleteError) {
      setError('Erro ao excluir atividade');
    } else {
      setActivities(activities.filter(a => a.id !== deleteId));
      setDeleteId(null);
    }

    setIsDeleting(false);
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-text-secondary';
    }
  };

  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'Leve';
      case 'moderate': return 'Moderado';
      case 'high': return 'Intenso';
      default: return intensity;
    }
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

  const totalCalories = activities.reduce((sum, a) => sum + (a.calories_burned || 0), 0);
  const totalMinutes = activities.reduce((sum, a) => sum + a.duration_minutes, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-orange"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('week')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'week'
                ? 'bg-accent-orange text-white'
                : 'bg-secondary-bg text-text-secondary hover:bg-hover-bg'
            }`}
          >
            Última Semana
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'month'
                ? 'bg-accent-orange text-white'
                : 'bg-secondary-bg text-text-secondary hover:bg-hover-bg'
            }`}
          >
            Último Mês
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'all'
                ? 'bg-accent-orange text-white'
                : 'bg-secondary-bg text-text-secondary hover:bg-hover-bg'
            }`}
          >
            Tudo
          </button>
        </div>

        {activities.length > 0 && (
          <div className="flex gap-4 text-sm">
            <div className="bg-secondary-bg px-4 py-2 rounded-lg">
              <span className="text-text-secondary">Total: </span>
              <span className="text-text-bright font-bold">{activities.length}</span>
              <span className="text-text-secondary"> atividades</span>
            </div>
            <div className="bg-secondary-bg px-4 py-2 rounded-lg">
              <span className="text-text-secondary">🔥 </span>
              <span className="text-text-bright font-bold">{totalCalories}</span>
              <span className="text-text-secondary"> kcal</span>
            </div>
            <div className="bg-secondary-bg px-4 py-2 rounded-lg">
              <span className="text-text-secondary">⏱️ </span>
              <span className="text-text-bright font-bold">{totalMinutes}</span>
              <span className="text-text-secondary"> min</span>
            </div>
          </div>
        )}
      </div>

      {/* Activities List */}
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏃</div>
          <p className="text-text-secondary text-lg mb-2">Nenhuma atividade registrada</p>
          <p className="text-text-muted text-sm">
            Registre suas atividades físicas em "Saúde & Bem-Estar"
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-secondary-bg border border-border-color rounded-lg p-4 hover:bg-hover-bg transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🏃</span>
                    <div>
                      <h3 className="text-text-bright font-semibold text-lg">
                        {activity.activity_type}
                      </h3>
                      <p className="text-text-muted text-sm">
                        {formatDate(activity.performed_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 ml-11">
                    <div className="flex items-center gap-2 bg-hover-bg px-3 py-1.5 rounded-lg">
                      <span className="text-text-secondary text-sm">⏱️</span>
                      <span className="text-text-bright font-semibold text-sm">
                        {activity.duration_minutes} min
                      </span>
                    </div>

                    {activity.calories_burned && (
                      <div className="flex items-center gap-2 bg-hover-bg px-3 py-1.5 rounded-lg">
                        <span className="text-text-secondary text-sm">🔥</span>
                        <span className="text-text-bright font-semibold text-sm">
                          {activity.calories_burned} kcal
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 bg-hover-bg px-3 py-1.5 rounded-lg">
                      <span className="text-text-secondary text-sm">💪</span>
                      <span className={`${getIntensityColor(activity.intensity)} font-semibold text-sm`}>
                        {getIntensityLabel(activity.intensity)}
                      </span>
                    </div>
                  </div>

                  {activity.notes && (
                    <div className="mt-3 ml-11 text-sm text-text-secondary italic bg-hover-bg px-3 py-2 rounded">
                      "{activity.notes}"
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setDeleteId(activity.id)}
                  className="text-text-muted hover:text-error transition-colors ml-4"
                  title="Excluir atividade"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <ConfirmDeleteModal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Excluir Atividade"
          message="Tem certeza que deseja excluir esta atividade do histórico?"
          itemName={activities.find(a => a.id === deleteId)?.activity_type}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};
