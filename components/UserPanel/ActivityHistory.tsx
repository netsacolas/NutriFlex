import React, { useState, useEffect } from 'react';
import { physicalActivityService } from '../../services/physicalActivityService';
import type { PhysicalActivity } from '../../types';

export const ActivityHistory: React.FC = () => {
  const [activities, setActivities] = useState<PhysicalActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const intensityColors = {
    low: 'bg-blue-500/20 border-blue-500 text-blue-300',
    moderate: 'bg-yellow-500/20 border-yellow-500 text-yellow-300',
    high: 'bg-red-500/20 border-red-500 text-red-300',
  };

  const intensityLabels = {
    low: 'Leve',
    moderate: 'Moderado',
    high: 'Intenso',
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    const { data } = await physicalActivityService.getActivities(7);
    setActivities(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar esta atividade?')) return;
    await physicalActivityService.deleteActivity(id);
    loadActivities();
  };

  if (loading) {
    return <div className="text-center py-4 text-text-secondary">Carregando...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-text-secondary text-sm">
        <div className="text-4xl mb-2">🏃</div>
        <p>Nenhuma atividade registrada nos últimos 7 dias</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className={`p-3 rounded-lg border ${intensityColors[activity.intensity]}`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-text-bright">{activity.activity_type}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-bg text-text-secondary">
                  {intensityLabels[activity.intensity]}
                </span>
              </div>
              <div className="text-xs text-text-secondary">
                {activity.duration_minutes} min
                {activity.calories_burned && ` • ${activity.calories_burned} kcal`}
                {' • '}
                {new Date(activity.performed_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <button
              onClick={() => handleDelete(activity.id)}
              className="text-error hover:text-red-700 ml-2"
              title="Deletar"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
