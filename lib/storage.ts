/* Хранилище настроек и прогресса: синхронный кэш в памяти поверх AsyncStorage.
   При старте вызывается hydrate() — после него вся логика работает синхронно, как раньше с localStorage;
   запись уходит в AsyncStorage в фоне. */
import AsyncStorage from '@react-native-async-storage/async-storage';

const cache = new Map<string, string>();
let ready = false;

export async function hydrate(): Promise<void> {
  if (ready) return;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter(k => k.startsWith('islamua_'));
    const pairs = await AsyncStorage.multiGet(mine);
    for (const [k, v] of pairs) if (v != null) cache.set(k, v);
  } catch { /* ignore */ }
  ready = true;
}

export const isHydrated = () => ready;

export function getItem(key: string): string | null { return cache.get(key) ?? null; }
export function setItem(key: string, value: string): void {
  cache.set(key, value);
  AsyncStorage.setItem(key, value).catch(() => {});
}
export function removeItem(key: string): void {
  cache.delete(key);
  AsyncStorage.removeItem(key).catch(() => {});
}

/* Объект с запасными значениями (как load/save в старой версии) */
export function load<T extends object>(key: string, fallback: T): T {
  try {
    const raw = getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch { return { ...fallback }; }
}
export function save(key: string, value: unknown): void {
  try { setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}
export function loadRaw<T>(key: string, fallback: T): T {
  try { const raw = getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
