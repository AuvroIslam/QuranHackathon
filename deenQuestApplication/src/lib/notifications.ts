import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const STREAK_NOTIF_ID = 'deenquest-streak-reminder';

// Must be called at module level — controls how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  // Android 13+ requires an explicit channel before requesting permission
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('streak-reminders', {
      name: 'Streak Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedules a daily 8 PM streak-reminder notification.
 * Safe to call every time the home screen loads — it cancels the previous one first.
 */
export async function scheduleStreakReminder(streak: number): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Cancel existing so we don't stack duplicates
  await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIF_ID).catch(() => {});

  const title =
    streak > 0
      ? `🔥 Save your ${streak}-day streak!`
      : '📖 Your daily Quran lesson is waiting';

  const body =
    streak > 0
      ? `Complete a Quran lesson today to keep your ${streak}-day streak alive.`
      : "Complete today's lesson and start building your streak!";

  // Target 8 PM local time; if already past, push to tomorrow
  const trigger = new Date();
  trigger.setHours(20, 0, 0, 0);
  if (trigger <= new Date()) {
    trigger.setDate(trigger.getDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_NOTIF_ID,
    content: {
      title,
      body,
      sound: true,
      data: { screen: 'Home' },
      // Android channel
      ...(Platform.OS === 'android' ? { channelId: 'streak-reminders' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });
}

/** Cancel the streak reminder (call when user completes a task). */
export async function cancelStreakReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIF_ID).catch(() => {});
}
