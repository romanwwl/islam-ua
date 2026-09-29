/* Прогресс обучения — локально (localStorage), структура готова к синхронизации в облако.
   items[key] = { s: серия верных подряд, ok, bad, due: когда повторить (ms), last: ms, days: [YYYY-MM-DD верных ответов] }
   Элемент «выучен», когда на него ответили верно в 3 разных дня. Повтор — по растущим интервалам. */
import { load, save } from './storage.js';

const KEY = 'islamua_progress';
const INTERVALS = [0, 1, 3, 7, 14, 30, 60]; // дней до следующего повтора при серии s

const empty = () => ({ items: {}, days: {}, name: '', since: Date.now() });
let data = load(KEY, empty());
if (!data.items) data = empty();

const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const persist = () => save(KEY, data);

export const itemKey = (mode, id) => `${mode}:${id}`;

export function getItem(mode, id) { return data.items[itemKey(mode, id)] || null; }

export function isLearned(mode, id) {
  const it = getItem(mode, id);
  return !!it && it.days.length >= 3 && it.s >= 3;
}

export function isDue(mode, id, now = Date.now()) {
  const it = getItem(mode, id);
  return !!it && it.due <= now;
}

/* Записать ответ */
export function record(mode, id, correct) {
  const k = itemKey(mode, id);
  const today = dayKey();
  const it = data.items[k] || { s: 0, ok: 0, bad: 0, due: 0, last: 0, days: [] };
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

/* Сводка по режиму: всего / выучено / ждут повтора / когда-либо отвечали */
export function modeStats(mode, ids) {
  const now = Date.now();
  let learned = 0, due = 0, seen = 0, ok = 0, n = 0;
  for (const id of ids) {
    const it = getItem(mode, id);
    if (!it) continue;
    seen++; ok += it.ok; n += it.ok + it.bad;
    if (it.days.length >= 3 && it.s >= 3) learned++;
    else if (it.due <= now) due++;
  }
  return { total: ids.length, learned, due, seen, accuracy: n ? Math.round(ok / n * 100) : null };
}

/* Общая статистика для профиля */
export function overall(modes /* {mode: ids[]} */) {
  let learned = 0, total = 0, ok = 0, n = 0;
  for (const [mode, ids] of Object.entries(modes)) {
    const s = modeStats(mode, ids);
    learned += s.learned; total += s.total;
  }
  for (const d of Object.values(data.days)) { ok += d.ok; n += d.n; }
  return { learned, total, accuracy: n ? Math.round(ok / n * 100) : null, answers: n, streak: streakDays(), since: data.since };
}

/* Дней подряд с хотя бы одним ответом (сегодня или вчера считается началом) */
export function streakDays() {
  let k = 0; const d = new Date();
  if (!data.days[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (data.days[dayKey(d)]) { k++; d.setDate(d.getDate() - 1); }
  return k;
}

/* Активность за последние 7 дней (пн…вс текущей недели): [{label, done, today}] */
export function weekActivity() {
  const labels = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0 = пн
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now); d.setDate(now.getDate() - dow + i);
    out.push({ label: labels[i], done: !!data.days[dayKey(d)], today: i === dow, future: i > dow });
  }
  return out;
}

/* Собрать колоду: сначала то, что ждёт повтора (ошибки), потом новое, потом выученное */
export function pickDeck(mode, items, idOf, size) {
  const now = Date.now();
  const due = [], fresh = [], rest = [];
  for (const item of items) {
    const it = getItem(mode, idOf(item));
    if (!it) fresh.push(item);
    else if (it.due <= now) due.push(item);
    else rest.push(item);
  }
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  shuffle(due); shuffle(fresh); shuffle(rest);
  const deck = [...due, ...fresh, ...rest].slice(0, size || items.length);
  return shuffle(deck);
}

/* Все элементы, которые ждут повтора, по режимам: [{mode, item}] */
export function dueAcross(modesItems /* {mode: {items, idOf}} */) {
  const now = Date.now();
  const out = [];
  for (const [mode, { items, idOf }] of Object.entries(modesItems)) {
    for (const item of items) {
      const it = getItem(mode, idOf(item));
      if (it && it.due <= now && !(it.days.length >= 3 && it.s >= 3)) out.push({ mode, item });
    }
  }
  return out;
}

export function getName() { return data.name || ''; }
export function setName(n) { data.name = (n || '').trim().slice(0, 30); persist(); }
export function resetProgress() { data = empty(); persist(); }
