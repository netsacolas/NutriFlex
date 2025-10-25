import React, { useState } from 'react';
import { mealConsumptionService } from '../services/mealConsumptionService';
import type { MealResult, MealType } from '../types';

interface Props {
  mealResult: MealResult;
  mealType: MealType;
  onClose: () => void;
  onSuccess: () => void;
}

export const SaveMealModal: React.FC<Props> = ({ mealResult, mealType, onClose, onSuccess }) => {
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [time, setTime] = useState(now.toTimeString().slice(0, 5));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const mealTypeLabels: Record<MealType, string> = {
    breakfast: 'Café da Manhã',
    lunch: 'Almoço',
    dinner: 'Jantar',
    snack: 'Lanche'
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const consumedAt = new Date(`${date}T${time}`);
      const { error: saveError } = await mealConsumptionService.saveMealConsumption(
        mealResult,
        mealType,
        consumedAt,
        notes || undefined
      );

      if (saveError) {
        setError('Erro ao salvar refeição. Tente novamente.');
        setSaving(false);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError('Erro ao salvar refeição.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card-bg rounded-xl p-6 w-full max-w-md border border-border-color shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-text-bright">💾 Salvar Refeição</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-bright text-2xl"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-text-primary font-medium mb-2">Tipo de Refeição</label>
            <div className="bg-secondary-bg px-4 py-2 rounded-lg border border-border-color text-text-bright">
              {mealTypeLabels[mealType]}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-primary font-medium mb-2">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-secondary-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-text-primary font-medium mb-2">Hora</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-secondary-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-text-primary font-medium mb-2">Observações (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Como você se sentiu? Teve alguma reação? Estava com fome?"
              className="w-full bg-secondary-bg text-text-bright px-4 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-accent-orange focus:outline-none resize-none"
            />
          </div>

          <div className="bg-secondary-bg rounded-lg p-4 border border-border-color">
            <div className="text-sm text-text-secondary mb-2">Resumo:</div>
            <div className="flex justify-between text-text-primary">
              <span>Calorias:</span>
              <span className="font-semibold">{mealResult.totalCalories.toFixed(0)} kcal</span>
            </div>
            <div className="flex justify-between text-text-secondary text-sm mt-1">
              <span>Proteína: {mealResult.totalMacros.protein.toFixed(1)}g</span>
              <span>Carbs: {mealResult.totalMacros.carbs.toFixed(1)}g</span>
              <span>Gordura: {mealResult.totalMacros.fat.toFixed(1)}g</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-primary text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Salvando...' : '💾 Salvar'}
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              className="bg-secondary-bg text-text-primary font-semibold px-6 py-3 rounded-lg border border-border-color hover:bg-hover-bg transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
