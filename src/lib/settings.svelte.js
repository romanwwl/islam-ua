/* Общие настройки намаза и уведомлений — один реактивный стор для экранов «Сегодня» и «Профиль».
   Объекты не переприсваиваются (только мутируются), чтобы реактивность сохранялась между компонентами. */
import { load, save } from './storage.js';
import { DEFAULT_STATE } from './prayer.js';
import { DEFAULT_NOTIFY, reschedule } from './notify.js';

const PKEY = 'islamua_prayer';
const NKEY = 'islamua_notify';

export const prayer = $state({ ...DEFAULT_STATE, ...load(PKEY, DEFAULT_STATE) });
export const notify = $state({ ...DEFAULT_NOTIFY, ...load(NKEY, DEFAULT_NOTIFY) });
if (!notify.prayers) notify.prayers = { ...DEFAULT_NOTIFY.prayers };

/* Сохранить настройки намаза и перепланировать уведомления (если включены) */
export function savePrayer() {
  save(PKEY, $state.snapshot(prayer));
  if (notify.on) reschedule($state.snapshot(prayer), $state.snapshot(notify));
}
export function saveNotify() {
  save(NKEY, $state.snapshot(notify));
  reschedule($state.snapshot(prayer), $state.snapshot(notify));
}
export function applyNotify() {
  if (notify.on) reschedule($state.snapshot(prayer), $state.snapshot(notify));
}
