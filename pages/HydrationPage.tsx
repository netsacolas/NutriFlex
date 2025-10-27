import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hydrationService, calculateDailyWaterGoal, generateReminders } from '../services/hydrationService';
import { profileService } from '../services/profileService';
import type { HydrationSettings, HydrationProgress, UserProfile } from '../types';
import logger from '../utils/logger';

const HydrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<HydrationSettings | null>(null);
  const [progress, setProgress] = useState<HydrationProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [dailyGoalMl, setDailyGoalMl] = useState(2000);
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [intakeSizeMl, setIntakeSizeMl] = useState(250);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [unit, setUnit] = useState<'ml' | 'liters'>('ml');

  useEffect(() => {
    loadData();
    requestNotificationPermission();
  }, []);

  // Recalcula progresso quando meta ou tamanho de ingestão mudar
  useEffect(() => {
    if (progress && dailyGoalMl) {
      // Atualiza percentual em tempo real
      const newPercentage = Math.round((progress.consumed_ml / dailyGoalMl) * 100);
      setProgress({
        ...progress,
        goal_ml: dailyGoalMl,
        percentage: newPercentage,
      });
    }
  }, [dailyGoalMl]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Busca perfil
      const { data: userProfile } = await profileService.getProfile();
      if (userProfile) {
        setProfile(userProfile);

        // Verifica dados obrigatórios
        const hasRequiredData = userProfile.weight && userProfile.height && userProfile.age && userProfile.gender;
        if (!hasRequiredData) {
          navigate('/onboarding');
          return;
        }
      }

      // Busca configurações de hidratação
      const { data: hydrationSettings } = await hydrationService.getSettings();

      if (hydrationSettings) {
        setSettings(hydrationSettings);
        setDailyGoalMl(hydrationSettings.daily_goal_ml);
        setWakeTime(hydrationSettings.wake_time);
        setSleepTime(hydrationSettings.sleep_time);
        setIntakeSizeMl(hydrationSettings.intake_size_ml);
        setNotificationsEnabled(hydrationSettings.notifications_enabled);
        setSoundEnabled(hydrationSettings.sound_enabled);
        setVibrationEnabled(hydrationSettings.vibration_enabled);
        setUnit(hydrationSettings.unit);
      } else if (userProfile?.weight && userProfile?.height && userProfile?.age) {
        // Calcula meta automática se não tiver configuração
        const calculatedGoal = calculateDailyWaterGoal(
          userProfile.weight,
          userProfile.height,
          userProfile.age,
          userProfile.activity_level || 'sedentary'
        );
        setDailyGoalMl(calculatedGoal);
      }

      // Busca progresso do dia
      const { data: todayProgress } = await hydrationService.getTodayProgress();
      if (todayProgress) {
        setProgress(todayProgress);
      }
    } catch (error) {
      logger.error('Error loading hydration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const newSettings: Partial<HydrationSettings> = {
        daily_goal_ml: dailyGoalMl,
        wake_time: wakeTime,
        sleep_time: sleepTime,
        intake_size_ml: intakeSizeMl,
        notifications_enabled: notificationsEnabled,
        sound_enabled: soundEnabled,
        vibration_enabled: vibrationEnabled,
        unit,
        language: 'pt-BR',
        silent_start: null,
        silent_end: null,
      };

      // Salva configurações
      const { error } = await hydrationService.upsertSettings(newSettings);

      if (error) {
        alert('Erro ao salvar configurações');
        return;
      }

      // Cria lembretes no banco para hoje
      const { error: remindersError } = await hydrationService.createDailyReminders(
        wakeTime,
        sleepTime,
        dailyGoalMl,
        intakeSizeMl
      );

      if (remindersError) {
        logger.error('Error creating daily reminders:', remindersError);
      }

      // Recarrega dados (atualiza progresso com nova meta e lembretes)
      await loadData();

      // Reagenda notificações com as novas configurações
      if (notificationsEnabled) {
        const { restartReminders } = await import('../utils/hydrationNotifications');
        await restartReminders();
      }

      alert('Configurações salvas com sucesso!\n\nLembretes foram reagendados automaticamente.');
    } catch (error) {
      logger.error('Error saving settings:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordIntake = async () => {
    try {
      const { error } = await hydrationService.recordIntake(intakeSizeMl);

      if (error) {
        alert('Erro ao registrar ingestão');
        return;
      }

      // Recarrega progresso
      const { data: todayProgress } = await hydrationService.getTodayProgress();
      if (todayProgress) {
        setProgress(todayProgress);
      }

      // Mostra notificação de sucesso
      if (Notification.permission === 'granted') {
        new Notification('Hidratação Registrada! 💧', {
          body: `Você bebeu ${intakeSizeMl}ml. Continue assim!`,
          icon: '/img/nutrimais_logo.png',
        });
      }
    } catch (error) {
      logger.error('Error recording intake:', error);
      alert('Erro ao registrar ingestão');
    }
  };

  const handleCalculateSuggestion = () => {
    if (!profile?.weight || !profile?.height || !profile?.age) {
      alert('Complete seu perfil para calcular a meta sugerida');
      return;
    }

    const suggested = calculateDailyWaterGoal(
      profile.weight,
      profile.height,
      profile.age,
      profile.activity_level || 'sedentary'
    );

    setDailyGoalMl(suggested);
  };

  const formatValue = (valueMl: number) => {
    if (unit === 'liters') {
      return `${(valueMl / 1000).toFixed(2)}L`;
    }
    return `${valueMl}ml`;
  };

  const reminders = generateReminders(wakeTime, sleepTime, dailyGoalMl, intakeSizeMl);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-4xl">
              💧
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Hidratação Personalizada</h1>
              <p className="text-gray-600">Mantenha-se hidratado com lembretes inteligentes</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Progresso do Dia */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Progresso de Hoje</h2>

            {progress ? (
              <>
                {/* Círculo de Progresso */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90 w-48 h-48">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="#e5e7eb"
                        strokeWidth="16"
                        fill="none"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="url(#gradient)"
                        strokeWidth="16"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 88}`}
                        strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress.percentage / 100)}`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-gray-800">{progress.percentage}%</span>
                      <span className="text-sm text-gray-600">da meta</span>
                    </div>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Consumido</p>
                    <p className="text-2xl font-bold text-cyan-600">{formatValue(progress.consumed_ml)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Meta</p>
                    <p className="text-2xl font-bold text-blue-600">{formatValue(progress.goal_ml)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Ingestões</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {progress.intakes_completed}/{progress.intakes_total}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Sequência</p>
                    <p className="text-2xl font-bold text-orange-600">{progress.streak_days} dias</p>
                  </div>
                </div>

                {/* Botão Beber Água */}
                <button
                  onClick={handleRecordIntake}
                  className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  💧 Bebi {formatValue(intakeSizeMl)}
                </button>
              </>
            ) : (
              <p className="text-center text-gray-500 py-12">
                Configure suas preferências para começar a acompanhar sua hidratação
              </p>
            )}
          </div>

          {/* Configurações */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Configurações</h2>

            <div className="space-y-4">
              {/* Meta Diária */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Meta Diária</label>
                  <button
                    onClick={handleCalculateSuggestion}
                    className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    Calcular Sugestão
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={dailyGoalMl}
                    onChange={(e) => setDailyGoalMl(Number(e.target.value))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    min="500"
                    max="10000"
                    step="250"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as 'ml' | 'liters')}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="ml">ml</option>
                    <option value="liters">Litros</option>
                  </select>
                </div>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Acordar</label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dormir</label>
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Tamanho de Ingestão */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamanho de Cada Ingestão
                </label>
                <div className="flex gap-2">
                  {[200, 250, 300, 350, 400, 500].map((size) => (
                    <button
                      key={size}
                      onClick={() => setIntakeSizeMl(size)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        intakeSizeMl === size
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {size}ml
                    </button>
                  ))}
                </div>
              </div>

              {/* Notificações */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="w-5 h-5 text-cyan-600 rounded focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Ativar Lembretes</span>
                </label>

                {notificationsEnabled && (
                  <>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ml-8">
                      <input
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                        className="w-5 h-5 text-cyan-600 rounded focus:ring-2 focus:ring-cyan-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Som</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ml-8">
                      <input
                        type="checkbox"
                        checked={vibrationEnabled}
                        onChange={(e) => setVibrationEnabled(e.target.checked)}
                        className="w-5 h-5 text-cyan-600 rounded focus:ring-2 focus:ring-cyan-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Vibração</span>
                    </label>
                  </>
                )}
              </div>

              {/* Botão Salvar */}
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        </div>

        {/* Lembretes Programados */}
        {reminders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Lembretes Programados ({reminders.length})
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {reminders.map((reminder, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-3 text-center"
                >
                  <p className="text-lg font-bold text-cyan-600">{reminder.time}</p>
                  <p className="text-xs text-gray-600">{formatValue(reminder.amount_ml)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HydrationPage;
