/* Прогресс обучения — локально, структура готова к синхронизации в облако.
   items[key] = { s: серия верных подряд, ok, bad, due: когда повторить (ms), last: ms, days: [YYYY-MM-DD верных ответов] }
   Элемент «выучен», когда на него ответили верно в 3 разных дня. Повтор — по растущим интервалам. */
import { load, save } from './storage';

const KEY = 'islamua_progress';
const INTERVALS = [0, 1, 3, 7, 14, 30, 60]; // дней до следующего повтора при серии s

export type ProgressItem = { s: number; ok: number; bad: number; due: number; last: number; days: string[] };
type Data = { items: Record<string, ProgressItem>; days: Record<string, { n: number; ok: number }>; name: string; since: number };

const empty = (): Data => ({ items: {}, days: {}, name: '', since: Date.now() });
let data: Data = empty();
let listeners = new Set<() => void>();
const notify = () => { for (const f of listeners) f(); };

/* Вызывается после hydrate() хранилища */
export function initProgress() { data = load(KEY, empty()); if (!data.items) data = empty(); notify(); }
export function onProgress(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

const dayKey = (d: Date = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const persist = () => { save(KEY, data); notify(); };

export const itemKey = (mode: string, id: string) => `${mode}:${id}`;
export function getItem(mode: string, id: string): ProgressItem | null { return data.items[itemKey(mode, id)] || null; }

export function isLearned(mode: string, id: string) {
  const it = getItem(mode, id);
  return !!it && it.days.length >= 3 && it.s >= 3;
}
export function isDue(mode: string, id: string, now = Date.now()) {
  const it = getItem(mode, id);
  return !!it && it.due <= now;
}

/* Записать ответ */
export function record(mode: string, id: string, correct: boolean) {
  const k = itemKey(mode, id);
  const today = dayKey();
  const it: ProgressItem = data.items[k] || { s: 0, ok: 0, bad: 0, due: 0, last: 0, days: [] };
  if (correct) {
    it.ok++;
    if (!it.days.includes(today)) it.days.push(today);
    // серия растёт не чаще раза в день — иначе три верных подряд за минуту «выучат» слово
    if (it.last === 0 || dayKey(new Date(it.last)) !== today || it.s === 0) it.s = Math.min(it.s + 1, INTERVALS.length - 1);
    it.due = Date.now() + INTERVALS[it.s] * 86400000;
  } else {
    it.bad++; it.s = 0; it.due = Date.now();
  }
  it.last = Date.now();
  data.items[k] = it;
  const d = data.days[today] || { n: 0, ok: 0 };
  d.n++; if (correct) d.ok++;
  data.days[today] = d;
  persist();
}

export type ModeStats = { total: number; learned: number; learning: number; due: number; seen: number; accuracy: number | null };
/* Сводка по режиму: всего / выучено / учится / ждут повтора / когда-либо отвечали */
export function modeStats(mode: string, ids: string[]): ModeStats {
  const now = Date.now();
  let learned = 0, due = 0, seen = 0, ok = 0, n = 0;
  for (const id of ids) {
    const it = getItem(mode, id);
    if (!it) continue;
    seen++; ok += it.ok; n += it.ok + it.bad;
    if (it.days.length >= 3 && it.s >= 3) learned++;
    else if (it.due <= now) due++;
  }
  return { total: ids.length, learned, learning: seen - learned, due, seen, accuracy: n ? Math.round(ok / n * 100) : null };
}

/* Общая статистика для профиля */
export function overall(modes: Record<string, string[]>) {
  let learned = 0, total = 0, ok = 0, n = 0;
  for (const [mode, ids] of Object.entries(modes)) {
    const s = modeStats(mode, ids);
    learned += s.learned; total += s.total;
  }
  for (const d of Object.values(data.days)) { ok += d.ok; n += d.n; }
  return { learned, total, accuracy: n ? Math.round(ok / n * 100) : null, answers: n, streak: streakDays(), since: data.since };
}

/* Дней подряд с хотя бы одним ответом */
export function streakDays() {
  let k = 0; const d = new Date();
  if (!data.days[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (data.days[dayKey(d)]) { k++; d.setDate(d.getDate() - 1); }
  return k;
}

/* Активность за текущую неделю (пн…вс) */
export function weekActivity() {
  const labels = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const out: { label: string; done: boolean; today: boolean; future: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now); d.setDate(now.getDate() - dow + i);
    out.push({ label: labels[i], done: !!data.days[dayKey(d)], today: i === dow, future: i > dow });
  }
  return out;
}

const shuffle = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* Собрать колоду: сначала то, что ждёт повтора (ошибки), потом новое, потом выученное */
export function pickDeck<T>(mode: string, items: T[], idOf: (x: T) => string, size?: number): T[] {
  const now = Date.now();
  const due: T[] = [], fresh: T[] = [], rest: T[] = [];
  for (const item of items) {
    const it = getItem(mode, idOf(item));
    if (!it) fresh.push(item);
    else if (it.due <= now) due.push(item);
    else rest.push(item);
  }
  shuffle(due); shuffle(fresh); shuffle(rest);
  const deck = [...due, ...fresh, ...rest].slice(0, size || items.length);
  return shuffle(deck);
}

/* Всё, что ждёт повтора, по режимам */
export function dueAcross(modesItems: Record<string, { items: any[]; idOf: (x: any) => string }>) {
  const now = Date.now();
  const out: { mode: string; item: any }[] = [];
  for (const [mode, { items, idOf }] of Object.entries(modesItems)) {
    for (const item of items) {
      const it = getItem(mode, idOf(item));
      if (it && it.due <= now && !(it.days.length >= 3 && it.s >= 3)) out.push({ mode, item });
    }
  }
  return out;
}

export function getName() { return data.name || ''; }
export function setName(n: string) { data.name = (n || '').trim().slice(0, 30); persist(); }
export function resetProgress() { data = empty(); persist(); }
