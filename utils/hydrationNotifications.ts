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
      return;
    }

    const { wake_time, sleep_time, daily_goal_ml, intake_size_ml } = settings;

    // Parse horários
    const [wakeHour, wakeMin] = wake_time.split(':').map(Number);
    const [sleepHour, sleepMin] = sleep_time.split(':').map(Number);

    // Calcula número de lembretes
    const numberOfIntakes = Math.ceil(daily_goal_ml / intake_size_ml);

    // Calcula intervalo em minutos
    let wakeMinutes = wakeHour * 60 + wakeMin;
    let sleepMinutes = sleepHour * 60 + sleepMin;

    if (sleepMinutes <= wakeMinutes) {
      sleepMinutes += 24 * 60;
    }

    const awakeMinutes = sleepMinutes - wakeMinutes;
    const intervalMinutes = awakeMinutes / numberOfIntakes;

    // Verifica a cada minuto se é hora de notificar
    notificationIntervalId = window.setInterval(() => {
      checkAndNotify(wakeHour, wakeMin, intervalMinutes, numberOfIntakes, intake_size_ml, settings.sound_enabled, settings.vibration_enabled);
    }, 60000); // Checa a cada 1 minuto

    logger.info('Hydration reminders scheduled');
  } catch (error) {
    logger.error('Error scheduling reminders:', error);
  }
}

/**
 * Verifica se é hora de notificar
 */
function checkAndNotify(
  wakeHour: number,
  wakeMin: number,
  intervalMinutes: number,
  numberOfIntakes: number,
  amountMl: number,
  soundEnabled: boolean,
  vibrationEnabled: boolean
): void {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  const currentMinutes = currentHour * 60 + currentMin;
  const wakeMinutes = wakeHour * 60 + wakeMin;

  // Calcula em qual "slot" de lembrete estamos
  const minutesSinceWake = currentMinutes - wakeMinutes;

  if (minutesSinceWake < 0) {
    return; // Ainda não acordou
  }

  // Verifica se é um múltiplo exato do intervalo
  const reminderIndex = Math.floor(minutesSinceWake / intervalMinutes);

  if (reminderIndex >= numberOfIntakes) {
    return; // Já passou de todos os lembretes do dia
  }

  const expectedReminderMinutes = wakeMinutes + Math.round(intervalMinutes * reminderIndex);
  const diff = Math.abs(currentMinutes - expectedReminderMinutes);

  // Se estamos dentro de 1 minuto do horário esperado
  if (diff <= 1) {
    showHydrationReminder(amountMl);

    if (soundEnabled) {
      playNotificationSound();
    }

    if (vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }
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
