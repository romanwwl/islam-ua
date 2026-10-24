/* Крошечный внешний стор для настроек: синхронное чтение, подписка через useSyncExternalStore. */
import { useSyncExternalStore } from 'react';

export type Store<T> = { get: () => T; set: (patch: Partial<T>) => void; replace: (v: T) => void; subscribe: (fn: () => void) => () => void };

export function createStore<T extends object>(initial: T, onChange?: (v: T) => void): Store<T> {
  let value = initial;
  const subs = new Set<() => void>();
  const emit = () => { for (const f of subs) f(); onChange?.(value); };
  return {
    get: () => value,
    set: patch => { value = { ...value, ...patch }; emit(); },
    replace: v => { value = v; emit(); },
    subscribe: fn => { subs.add(fn); return () => { subs.delete(fn); }; },
  };
}

export function useStore<T extends object>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
