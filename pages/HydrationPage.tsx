import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hydrationService, calculateDailyWaterGoal, generateReminders } from '../services/hydrationService';
import { profileService } from '../services/profileService';
import type { HydrationIntake, HydrationSettings, HydrationProgress, UserProfile } from '../types';
import logger from '../utils/logger';
import SuccessModal from '../components/SuccessModal';

const HydrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<HydrationSettings | null>(null);
  const [progress, setProgress] = useState<HydrationProgress | null>(null);
  const [todayReminders, setTodayReminders] = useState<HydrationIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingReminder, setProcessingReminder] = useState<string | null>(null);

  // Modal de sucesso
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '', icon: '✅' });

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

      // Busca lembretes do dia
      const { data: reminders } = await hydrationService.getTodayReminders();
      if (reminders) {
        setTodayReminders(reminders);
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

      // Exibe modal de sucesso
      setSuccessMessage({
        title: 'Configurações Salvas! ⚙️',
        message: 'Lembretes foram reagendados automaticamente',
        icon: '✅',
      });
      setShowSuccessModal(true);
    } catch (error) {
      logger.error('Error saving settings:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const formatReminderTime = (value?: string | null) => {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleToggleReminder = async (reminder: HydrationIntake) => {
    const reminderKey = reminder.id ?? reminder.scheduled_time;

    if (!reminderKey) {
      logger.error('Reminder without identifier:', reminder);
      return;
    }

    if (processingReminder === reminderKey) {
      return;
    }

    const { scheduled_time: scheduledTime } = reminder;

    if (!scheduledTime) {
      logger.error('Reminder without scheduled_time:', reminder);
      return;
    }

    const matchesReminder = (item: HydrationIntake) =>
      (reminder.id && item.id ? item.id === reminder.id : item.scheduled_time === reminder.scheduled_time);

    try {
      setProcessingReminder(reminderKey);

      if (reminder.completed) {
        const { error } = await hydrationService.uncompleteIntake(scheduledTime);
        if (error) {
          setSuccessMessage({
            title: 'Erro',
            message: 'Não foi possível desmarcar a ingestão',
            icon: '❌',
          });
          setShowSuccessModal(true);
          return;
        }

        setTodayReminders((prev) =>
          prev.map((item) =>
            matchesReminder(item) ? { ...item, completed: false, actual_time: null } : item
          )
        );

        setSuccessMessage({
          title: 'Ingestão Desmarcada',
          message: `Lembrete de ${formatReminderTime(scheduledTime) || '--:--'} foi desmarcado com sucesso`,
          icon: '↩️',
        });
        setShowSuccessModal(true);
      } else {
        const { data, error } = await hydrationService.recordIntake(reminder.amount_ml, scheduledTime);
        if (error) {
          setSuccessMessage({
            title: 'Erro',
            message: 'Não foi possível registrar a ingestão',
            icon: '❌',
          });
          setShowSuccessModal(true);
          return;
        }

        const now = new Date();
        const recordedAtIso = data?.actual_time || now.toISOString();
        const amountText =
          unit === 'liters'
            ? `${(reminder.amount_ml / 1000).toFixed(2)}L`
            : `${reminder.amount_ml}ml`;
        const currentTime =
          formatReminderTime(recordedAtIso) ||
          now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        setTodayReminders((prev) =>
          prev.map((item) =>
            matchesReminder(item) ? { ...item, completed: true, actual_time: recordedAtIso } : item
          )
        );

        setSuccessMessage({
          title: 'Água Registrada! 💧',
          message: `${amountText} consumidos às ${currentTime}`,
          icon: '✅',
        });
        setShowSuccessModal(true);
      }

      const { data: todayProgress } = await hydrationService.getTodayProgress();
      if (todayProgress) {
        setProgress(todayProgress);
      }
    } catch (error) {
      logger.error('Error toggling reminder:', error);
      setSuccessMessage({
        title: 'Erro',
        message: 'Erro ao atualizar ingestão',
        icon: '❌',
      });
      setShowSuccessModal(true);
    } finally {
      setProcessingReminder(null);
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

const reminderItems = todayReminders.map((reminder, index) => {
  const reminderKey = reminder.id || reminder.scheduled_time || String(index);
  const timeStr = formatReminderTime(reminder.scheduled_time);
  const isProcessing = processingReminder === (reminder.id || reminder.scheduled_time);

  const buttonClasses = [
    'relative rounded-xl p-4 text-center transition-all transform hover:scale-105',
    reminder.completed
      ? 'bg-gradient-to-br from-emerald-100 to-green-100 border-2 border-emerald-400 shadow-lg'
      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 hover:border-cyan-400',
    isProcessing ? 'opacity-50 cursor-not-allowed' : '',
  ].join(' ');

  const timeClasses = [
    'text-xl font-bold',
    reminder.completed ? 'text-emerald-600' : 'text-gray-700',
  ].join(' ');

  const amountClasses = [
    'text-sm mt-1',
    reminder.completed ? 'text-emerald-500' : 'text-gray-500',
  ].join(' ');

  return (
    <button
      key={reminderKey}
      onClick={() => handleToggleReminder(reminder)}
      disabled={isProcessing}
      className={buttonClasses}
    >
      {/* Ícone de Check */}
      {reminder.completed && (
        <div className="absolute top-2 right-2">
          <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Horário */}
      <p className={timeClasses}>
        {timeStr || '--'}
      </p>

      {/* Quantidade */}
      <p className={amountClasses}>
        {formatValue(reminder.amount_ml)}
      </p>

      {/* Hora real se completado */}
      {reminder.completed && reminder.actual_time && (
        <p className="text-xs text-emerald-400 mt-1">
          Consumido às {formatReminderTime(reminder.actual_time) || '--'}
        </p>
      )}
    </button>
  );
});

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

                {/* Mensagem informativa */}
                <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200">
                  <p className="text-sm text-gray-700 text-center">
                    ✅ Clique nos horários programados abaixo para registrar sua hidratação
                  </p>
                </div>
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
        {todayReminders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Lembretes de Hoje ({todayReminders.filter(r => r.completed).length}/{todayReminders.length})
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {reminderItems}
            </div>

            {/* Legenda */}
            <div className="mt-4 flex justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-emerald-100 to-green-100 border-2 border-emerald-400 rounded"></div>
                <span>Consumido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded"></div>
                <span>Pendente</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Sucesso */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage.title}
        message={successMessage.message}
        icon={successMessage.icon}
      />
    </div>
  );
};

export default HydrationPage;
