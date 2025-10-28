/**
 * Sistema de notificações para hidratação
 * Gerencia permissões, agendamento e exibição de lembretes
 */

import { hydrationService } from '../services/hydrationService';
import logger from './logger';

let notificationIntervalId: number | null = null;

/**
 * Solicita permissão para notificações
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    logger.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Verifica se notificações estão disponíveis
 */
export function areNotificationsSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Verifica se notificações estão permitidas
 */
export function areNotificationsGranted(): boolean {
  return areNotificationsSupported() && Notification.permission === 'granted';
}

/**
 * Mostra notificação de lembrete de hidratação
 */
export function showHydrationReminder(amountMl: number): void {
  if (!areNotificationsGranted()) {
    logger.warn('Notifications not granted');
    return;
  }

  const notification = new Notification('Hora de se Hidratar! 💧', {
    body: `Beba ${amountMl}ml de água agora para manter-se hidratado. Clique para registrar.`,
    icon: '/img/nutrimais_logo.png',
    badge: '/icons/icon-96x96.png',
    tag: 'hydration-reminder',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { amountMl }, // Passa amount para o click handler
  });

  notification.onclick = async () => {
    window.focus();
    notification.close();

    // Pergunta se quer registrar a ingestão
    const shouldRecord = confirm(`Você bebeu ${amountMl}ml de água agora?\n\nClique OK para registrar.`);

    if (shouldRecord) {
      try {
        // Registra a ingestão
        await hydrationService.recordIntake(amountMl);

        // Mostra feedback de sucesso
        showSuccessNotification(amountMl);
      } catch (error) {
        logger.error('Error recording intake from notification:', error);
        alert('Erro ao registrar ingestão. Tente novamente.');
      }
    }

    // Navega para página de hidratação
    if (window.location.pathname !== '/hydration') {
      window.location.href = '/hydration';
    }
  };
}

/**
 * Mostra notificação de sucesso após registrar ingestão
 */
function showSuccessNotification(amountMl: number): void {
  if (!areNotificationsGranted()) {
    return;
  }

  new Notification('Ingestão Registrada! ✅', {
    body: `Você bebeu ${amountMl}ml. Continue assim!`,
    icon: '/img/nutrimais_logo.png',
    badge: '/icons/icon-96x96.png',
    tag: 'hydration-success',
  });
}

/**
 * Mostra notificação de conquista
 */
export function showAchievementNotification(message: string): void {
  if (!areNotificationsGranted()) {
    return;
  }

  new Notification('Conquista Desbloqueada! 🏆', {
    body: message,
    icon: '/img/nutrimais_logo.png',
    badge: '/icons/icon-96x96.png',
    tag: 'hydration-achievement',
  });
}

/**
 * Mostra notificação de meta atingida
 */
export function showGoalCompletedNotification(): void {
  if (!areNotificationsGranted()) {
    return;
  }

  new Notification('Meta Atingida! 🎉', {
    body: 'Parabéns! Você atingiu sua meta de hidratação hoje!',
    icon: '/img/nutrimais_logo.png',
    badge: '/icons/icon-96x96.png',
    tag: 'hydration-goal',
  });
}

/**
 * Agenda lembretes com base nas configurações do usuário
 * Agora usa os lembretes do banco de dados ao invés de calcular
 */
export async function scheduleReminders(): Promise<void> {
  try {
    // Para agendamentos anteriores
    if (notificationIntervalId) {
      clearInterval(notificationIntervalId);
      notificationIntervalId = null;
    }

    // Busca configurações
    const { data: settings } = await hydrationService.getSettings();
    if (!settings || !settings.notifications_enabled) {
      logger.info('Notifications disabled or no settings found');
      return;
    }

    // Busca lembretes do dia
    const { data: todayReminders } = await hydrationService.getTodayReminders();
    if (!todayReminders || todayReminders.length === 0) {
      logger.warn('No reminders found for today. Please save settings first.');
      return;
    }

    logger.info(`Scheduling ${todayReminders.length} reminders for today`);

    // Verifica a cada minuto se é hora de notificar algum lembrete
    notificationIntervalId = window.setInterval(async () => {
      await checkAndNotifyFromDatabase(settings.sound_enabled, settings.vibration_enabled);
    }, 60000); // Checa a cada 1 minuto

    // Faz uma verificação imediata também
    await checkAndNotifyFromDatabase(settings.sound_enabled, settings.vibration_enabled);

    logger.info('Hydration reminders scheduled successfully');
  } catch (error) {
    logger.error('Error scheduling reminders:', error);
  }
}

/**
 * Verifica lembretes do banco e notifica se for hora
 */
async function checkAndNotifyFromDatabase(
  soundEnabled: boolean,
  vibrationEnabled: boolean
): Promise<void> {
  try {
    const { data: todayReminders } = await hydrationService.getTodayReminders();
    if (!todayReminders) return;

    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:mm

    // Percorre lembretes não completados
    for (const reminder of todayReminders) {
      if (reminder.completed) continue;

      const scheduledTime = new Date(reminder.scheduled_time);
      const reminderTime = scheduledTime.toTimeString().substring(0, 5);

      // Verifica se é hora de notificar (com margem de 1 minuto)
      if (shouldNotifyNow(currentTime, reminderTime)) {
        logger.info(`Triggering notification for ${reminderTime}`);

        showHydrationReminder(reminder.amount_ml);

        if (soundEnabled) {
          playNotificationSound();
        }

        if (vibrationEnabled && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }

        // Marca que já notificou para não repetir no próximo minuto
        // (poderia adicionar uma flag 'notified' no banco se quiser ser mais robusto)
        break; // Notifica apenas um lembrete por vez
      }
    }
  } catch (error) {
    logger.error('Error checking notifications:', error);
  }
}

/**
 * Verifica se deve notificar agora (com margem de 1 minuto)
 */
function shouldNotifyNow(currentTime: string, reminderTime: string): boolean {
  const [currentHour, currentMin] = currentTime.split(':').map(Number);
  const [reminderHour, reminderMin] = reminderTime.split(':').map(Number);

  const currentMinutes = currentHour * 60 + currentMin;
  const reminderMinutes = reminderHour * 60 + reminderMin;

  const diff = Math.abs(currentMinutes - reminderMinutes);

  // Notifica se estamos dentro de 1 minuto do horário
  return diff <= 1;
}

/**
 * Toca som de notificação
 */
function playNotificationSound(): void {
  try {
    const audio = new Audio('/sounds/water-drop.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => logger.warn('Could not play notification sound:', err));
  } catch (error) {
    logger.warn('Error playing sound:', error);
  }
}

/**
 * Para todos os lembretes
 */
export function stopReminders(): void {
  if (notificationIntervalId) {
    clearInterval(notificationIntervalId);
    notificationIntervalId = null;
    logger.info('Hydration reminders stopped');
  }
}

/**
 * Reinicia lembretes
 */
export async function restartReminders(): Promise<void> {
  stopReminders();
  await scheduleReminders();
}

/**
 * Registra Service Worker para notificações em background
 */
export async function registerNotificationServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    logger.warn('Service Worker not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    logger.info('Service Worker registered for notifications:', registration);

    // Escuta mensagens do Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        const action = event.data.action;

        if (action === 'drink') {
          // Registra ingestão
          hydrationService.recordIntake(event.data.amountMl);
        } else if (action === 'snooze') {
          // Adia por 15 minutos
          setTimeout(() => {
            showHydrationReminder(event.data.amountMl);
          }, 15 * 60 * 1000);
        }
      }
    });
  } catch (error) {
    logger.error('Error registering Service Worker:', error);
  }
}

/**
 * Inicializa sistema de notificações
 */
export async function initializeHydrationNotifications(): Promise<void> {
  logger.info('Initializing hydration notifications...');

  // Solicita permissão
  const granted = await requestNotificationPermission();

  if (!granted) {
    logger.warn('Notification permission not granted');
    return;
  }

  // Registra Service Worker
  await registerNotificationServiceWorker();

  // Agenda lembretes
  await scheduleReminders();

  logger.info('Hydration notifications initialized');
}
