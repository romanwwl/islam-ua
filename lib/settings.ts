/* Общие настройки: намаз, уведомления, оформление. Читаются после hydrate() хранилища. */
import { createStore, useStore } from './store';
import { load, save } from './storage';
import { DEFAULT_STATE, type PrayerState } from './prayer';
import { type ThemeId } from '../theme/tokens';
import { type StyleId } from '../theme/styles';

const PKEY = 'islamua_prayer';
const NKEY = 'islamua_notify';
const TKEY = 'islamua_theme';

export type NotifyKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export const NOTIFY_PRAYERS: NotifyKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
export type NotifyState = { on: boolean; prayers: Record<NotifyKey, boolean> };
export const DEFAULT_NOTIFY: NotifyState = { on: false, prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true } };

export type ArabicFont = 'scheherazade' | 'amiri';
export type ThemeState = { theme: ThemeId; style: StyleId; pattern: boolean; nightMidnight: boolean; arabicFont: ArabicFont };
export const DEFAULT_THEME: ThemeState = { theme: 'sapphire', style: 'focus', pattern: true, nightMidnight: false, arabicFont: 'scheherazade' };

export const prayerStore = createStore<PrayerState>({ ...DEFAULT_STATE }, v => save(PKEY, v));
export const notifyStore = createStore<NotifyState>({ ...DEFAULT_NOTIFY }, v => save(NKEY, v));
export const themeStore = createStore<ThemeState>({ ...DEFAULT_THEME }, v => save(TKEY, v));

/* Прочитать сохранённые настройки (после hydrate) */
export function initSettings() {
  prayerStore.replace({ ...DEFAULT_STATE, ...load(PKEY, DEFAULT_STATE) });
  const n = { ...DEFAULT_NOTIFY, ...load(NKEY, DEFAULT_NOTIFY) };
  if (!n.prayers) n.prayers = { ...DEFAULT_NOTIFY.prayers };
  notifyStore.replace(n);
  themeStore.replace({ ...DEFAULT_THEME, ...load(TKEY, DEFAULT_THEME) });
}

export const usePrayerSettings = () => useStore(prayerStore);
export const useNotifySettings = () => useStore(notifyStore);
export const useThemeSettings = () => useStore(themeStore);
