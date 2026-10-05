import LETTERS from '../data/letters.json';
import NAMES from '../data/names.json';
import WORDS from '../data/words.json';
import SIRA from '../data/sira.json';
import SURAHS from '../data/surahs.json';
import QURAN from '../data/quran.json';
import NUMBERS from '../data/numbers.json';

import { pickDeck, modeStats } from './progress.js';

/* Режимы тестов. round — сколько вопросов в одном прохождении (иначе все); id — стабильный ключ элемента для прогресса;
   glyph — символ на карточке раздела; unit — что считаем («выучено» или «верно»). */
export const MODES = {
  alphabet: { title: 'Алфавит',      data: LETTERS, label: l => l.name, id: l => l.c,  glyph: 'ب',      round: 28 },
  numbers:  { title: 'Цифры',        data: NUMBERS, label: x => String(x.n), id: x => x.id, glyph: '٧', round: 60, sameCat: true },
  names:    { title: 'Имена Аллаха', data: NAMES,   label: n => n.tr,   id: n => n.ar, glyph: 'الله',   round: 99, ordered: true },
  dict:     { title: 'Словарь',      data: WORDS,   label: w => w.tr,   id: w => w.ar, glyph: 'بَيْت',  round: 30 },
  quran:    { title: 'Коран',        data: QURAN,   label: w => w.tr,   id: w => w.ar, glyph: 'قُرْآن', round: 30, sameCat: true },
  sira:     { title: 'Сира',         data: SIRA,    label: x => (x.ans !== undefined ? x.ans : x.a[0]), id: x => x.q, glyph: 'سِيرَة', round: 30 },
  surah:    { title: 'Суры',         data: SURAHS,  label: s => s.lb,   id: s => String(s.n), glyph: '114', latin: true, round: 30 },
};
export const MODE_KEYS = Object.keys(MODES);
export const idsOf = mode => MODES[mode].data.map(MODES[mode].id);
export const statsOf = mode => modeStats(mode, idsOf(mode));

/* Буквы, которые соединяются только справа */
export const NONCONNECT = new Set(['ا', 'د', 'ذ', 'ر', 'ز', 'و']);
export const ZWJ = '‍';

export const rand = n => Math.floor(Math.random() * n);
export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* Случайная позиционная форма буквы (режим «Разные формы букв») */
export function displayForm(char, formsMode) {
  if (!formsMode) return char;
  if (NONCONNECT.has(char)) return rand(2) ? ZWJ + char : char;
  const f = rand(4);
  if (f === 0) return char;
  if (f === 1) return char + ZWJ;
  if (f === 2) return ZWJ + char + ZWJ;
  return ZWJ + char;
}

/* Четыре формы буквы для таблицы под карточкой */
export function letterForms(c) {
  return [
    { lbl: 'Отдельно',   g: c },
    { lbl: 'В начале',   g: c + ZWJ },
    { lbl: 'В середине', g: ZWJ + c + ZWJ },
    { lbl: 'В конце',    g: ZWJ + c },
  ];
}

/* Подсветка одной буквы в слове с сохранением соединения через ZWJ (возвращает HTML) */
export function highlightWord(word, hi) {
  const letters = [...word];
  const prev = letters[hi - 1], cur = letters[hi], next = letters[hi + 1];
  const connRight = prev !== undefined && !NONCONNECT.has(prev);
  const connLeft = next !== undefined && !NONCONNECT.has(cur);
  const before = letters.slice(0, hi).join('') + (connRight ? ZWJ : '');
  const target = (connRight ? ZWJ : '') + cur + (connLeft ? ZWJ : '');
  const after = (connLeft ? ZWJ : '') + letters.slice(hi + 1).join('');
  return before + '<span class="hi">' + target + '</span>' + after;
}

export function ayatWord(n) {
  const m = n % 100, d = n % 10;
  if (m >= 11 && m <= 14) return 'аятов';
  if (d === 1) return 'аят';
  if (d >= 2 && d <= 4) return 'аята';
  return 'аятов';
}

/* Колода на одно прохождение: [{mode, item}] — сначала то, что ждёт повтора, потом новое */
export function buildDeck(mode) {
  const cfg = MODES[mode];
  if (cfg.ordered) return cfg.data.map(item => ({ mode, item }));   // все элементы подряд, как в списке
  return pickDeck(mode, cfg.data, cfg.id, cfg.round).map(item => ({ mode, item }));
}

/* Название суры по номеру (для примеров из Корана) */
export function surahName(n) {
  const s = SURAHS[n - 1];
  return s ? s.ru : '';
}

/* Варианты ответа для текущего вопроса */
export function buildOptions(mode, current) {
  const cfg = MODES[mode];
  if (mode === 'sira') return shuffle(current.a.map(s => ({ ans: s })));
  const label = cfg.label;
  const correct = label(current);
  const opts = [current];
  let pool = cfg.data.filter(x => label(x) !== correct);
  if (cfg.sameCat) {
    const same = pool.filter(x => x.cat === current.cat);
    if (same.length >= 3) pool = same;
  }
  pool = shuffle(pool);
  for (const x of pool) {
    if (opts.length >= 4) break;
    if (!opts.some(o => label(o) === label(x))) opts.push(x);
  }
  return shuffle(opts);
}

export function resultMessage(pct) {
  if (pct >= 90) return 'Великолепно!';
  if (pct >= 70) return 'Хорошо!';
  if (pct >= 50) return 'Неплохо, продолжай';
  return 'Есть куда расти';
}

/* ---------- Незавершённая сессия теста: сохраняем, чтобы продолжить с того же вопроса ---------- */
const SKEY = 'islamua_sessions';
const readAll = () => { try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) { return {}; } };
const writeAll = obj => { try { localStorage.setItem(SKEY, JSON.stringify(obj)); } catch (e) { /* ignore */ } };
const sessionKey = session => session.mode || 'review';

const itemId = (m, it) => (it.ans !== undefined ? it.ans : MODES[m].id(it));
const findItem = (m, id) => MODES[m].data.find(x => MODES[m].id(x) === id) || null;

export function saveSession(session, state) {
  const all = readAll();
  all[sessionKey(session)] = {
    title: session.title, mode: session.mode, pos: state.pos, hints: state.hints,
    deck: state.deck.map(e => ({ m: e.mode, id: MODES[e.mode].id(e.item) })),
    opts: state.deck.map((e, i) => (state.optsCache[i] || []).map(o => itemId(e.mode, o))),
    answers: state.deck.map((e, i) => (state.answers[i] == null ? null : itemId(e.mode, state.answers[i]))),
  };
  writeAll(all);
}
export function clearSession(session) { const all = readAll(); delete all[sessionKey(session)]; writeAll(all); }

/* Есть ли незавершённая сессия для раздела (или 'review') — возвращает {pos, total} */
export function pendingSession(key) {
  const s = readAll()[key];
  if (!s) return null;
  const answered = s.answers.filter(a => a != null).length;
  if (answered === 0 || answered >= s.deck.length) return null;
  return { pos: answered, total: s.deck.length };
}

/* Восстановить сессию: {session, state} или null */
export function restoreSession(key) {
  const s = readAll()[key];
  if (!s) return null;
  const deck = [];
  for (const d of s.deck) { const item = findItem(d.m, d.id); if (!item) return null; deck.push({ mode: d.m, item }); }
  // варианты восстанавливаем только там, где они были построены; пустые — undefined, чтобы собрать заново
  const optsCache = s.opts.map((ids, i) => {
    if (!ids || !ids.length) return undefined;
    const m = deck[i].mode;
    if (m === 'sira') return ids.map(ans => ({ ans }));
    const o = ids.map(id => findItem(m, id)).filter(Boolean);
    return o.length ? o : undefined;
  });
  const answers = s.answers.map((id, i) => {
    if (id == null) return null;
    const m = deck[i].mode;
    return (optsCache[i] || []).find(o => itemId(m, o) === id) ?? null;
  });
  return { session: { title: s.title, mode: s.mode, deck }, state: { deck, optsCache, answers, hints: s.hints || [], pos: Math.min(s.pos, deck.length - 1) } };
}
