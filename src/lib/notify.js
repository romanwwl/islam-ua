/* Уведомления о намазе — локальные (без сервера), через Capacitor Local Notifications.
   Планируем на 7 дней вперёд, пересчитываем при открытии приложения и при смене настроек. */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PRAYER_RU, timesFor, coordsFor } from './prayer.js';

export const NOTIFY_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const DEFAULT_NOTIFY = { on: false, prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true } };
const DAYS = 7;

export const isNative = Capacitor.isNativePlatform();

/* Спросить разрешение; true — если разрешено */
export async function ensurePermission() {
  if (!isNative) return false;
  try {
    let st = await LocalNotifications.checkPermissions();
    if (st.display !== 'granted') st = await LocalNotifications.requestPermissions();
    return st.display === 'granted';
  } catch (e) { return false; }
}

async function cancelAll() {
  try {
    const { notifications } = await LocalNotifications.getPending();
    if (notifications.length) await LocalNotifications.cancel({ notifications: notifications.map(n => ({ id: n.id })) });
  } catch (e) { /* ignore */ }
}

/* Перепланировать все уведомления под текущие настройки (state — настройки намаза, notify — настройки уведомлений) */
export async function reschedule(state, notify) {
  if (!isNative) return;
  await cancelAll();
  if (!notify.on) return;
  const ok = await ensurePermission();
  if (!ok) return;
  const now = new Date();
  const city = coordsFor(state).name;
  const list = [];
  for (let d = 0; d < DAYS; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    const t = timesFor(day, state);
    NOTIFY_PRAYERS.forEach((k, i) => {
      if (!notify.prayers[k]) return;
      const at = t[k];
      if (!at || at <= now) return;
      list.push({
        id: d * 10 + i + 1,
        title: `${PRAYER_RU[k]} · ${at.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
        body: `Время намаза ${PRAYER_RU[k]} — ${city}`,
        schedule: { at, allowWhileIdle: true },
        sound: 'default',
      });
    });
  }
  if (list.length) {
    try { await LocalNotifications.schedule({ notifications: list }); } catch (e) { /* ignore */ }
  }
}
