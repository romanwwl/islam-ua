/* Уведомления о намазе — локальные (без сервера), через expo-notifications.
   Планируем на 7 дней вперёд, пересчитываем при открытии приложения и при смене настроек. */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PRAYER_RU, timesFor, coordsFor, fmtTime, type PrayerState } from './prayer';
import { NOTIFY_PRAYERS, type NotifyState } from './settings';

const DAYS = 7;
export const isNative = Platform.OS !== 'web';

if (isNative) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

/* Спросить разрешение; true — если разрешено */
export async function ensurePermission(): Promise<boolean> {
  if (!isNative) return false;
  try {
    let st = await Notifications.getPermissionsAsync();
    if (!st.granted) st = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
    return st.granted;
  } catch { return false; }
}

/* Перепланировать все уведомления под текущие настройки */
export async function reschedule(state: PrayerState, notify: NotifyState) {
  if (!isNative) return;
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch { /* ignore */ }
  if (!notify.on) return;
  if (!(await ensurePermission())) return;
  const now = new Date();
  const city = coordsFor(state).name;
  for (let d = 0; d < DAYS; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    const t = timesFor(day, state);
    for (const k of NOTIFY_PRAYERS) {
      if (!notify.prayers[k]) continue;
      const at = t[k];
      if (!at || at <= now) continue;
      try {
        await Notifications.scheduleNotificationAsync({
          content: { title: `${PRAYER_RU[k]} · ${fmtTime(at)}`, body: city, sound: 'default', interruptionLevel: 'timeSensitive' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
        });
      } catch { /* ignore */ }
    }
  }
}
