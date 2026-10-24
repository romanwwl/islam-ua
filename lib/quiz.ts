/* Режимы тестов, колоды, варианты ответа и незавершённые сессии. */
import LETTERS_JSON from '../data/letters.json';
import SIRA_JSON from '../data/sira.json';
import QURAN_JSON from '../data/quran.json';
import NUMBERS_JSON from '../data/numbers.json';
import { AYAT, NAMES, SURAHS, type Ayah, type Name, type Surah } from './daily';
import { WORDS, SPELL_WORDS, MISSING, HARAKAT_ITEMS, type Word } from './spelling';
import { pickDeck, modeStats } from './progress';
import { loadRaw, save } from './storage';

export type Letter = { c: string; name: string; sound: string; ex: { w: string; hi: number; tl: string; tr: string }; audio?: string };
export type SiraQ = { q: string; a: string[]; ans?: string; why?: string };
export type QuranWord = { ar: string; ru: string; tr: string; n: number; cat: string; ref: string; ex: string; exl: string; ext: string };
export type NumberItem = { id: string; n: number; kind: 'word' | 'digit'; ar: string; tl: string; digit: string; cat: string };

export const LETTERS = LETTERS_JSON as Letter[];
export const SIRA = SIRA_JSON as SiraQ[];
export const QURAN = QURAN_JSON as QuranWord[];
export const NUMBERS = NUMBERS_JSON as NumberItem[];

/* Аяты на слух: известные аяты с не слишком длинным переводом */
export const LISTEN: Ayah[] = AYAT.filter(a => a.ru.length <= 200);

export type ModeKey = 'alphabet' | 'numbers' | 'names' | 'dict' | 'quran' | 'sira' | 'surah' | 'listen' | 'spell' | 'missing' | 'harakat';
export type AnyItem = any;

export type Mode = {
  title: string; data: AnyItem[]; label: (x: AnyItem) => string; id: (x: AnyItem) => string; glyph: string;
  round?: number; ordered?: boolean; sameCat?: boolean; latin?: boolean; single?: boolean; ownOpts?: boolean; arOpts?: boolean; custom?: 'spell';
};

/* round — сколько вопросов в одном прохождении (только Словарь и правописание; иначе все элементы);
   id — стабильный ключ элемента для прогресса; glyph — символ на карточке раздела. */
export const MODES: Record<ModeKey, Mode> = {
  alphabet: { title: 'Алфавит',      data: LETTERS, label: l => l.name, id: l => l.c,  glyph: 'ب' },
  numbers:  { title: 'Цифры',        data: NUMBERS, label: x => String(x.n), id: x => x.id, glyph: '٧', sameCat: true },
  names:    { title: 'Имена Аллаха', data: NAMES,   label: n => n.tr,   id: n => n.ar, glyph: 'الله',   ordered: true },
  dict:     { title: 'Словарь',      data: WORDS,   label: w => w.tr,   id: w => w.ar, glyph: 'بَيْت',  round: 30 },
  quran:    { title: 'Коран',        data: QURAN,   label: w => w.tr,   id: w => w.ar, glyph: 'قُرْآن', sameCat: true },
  sira:     { title: 'Сира',         data: SIRA,    label: x => (x.ans !== undefined ? x.ans : x.a[0]), id: x => x.q, glyph: 'سِيرَة' },
  surah:    { title: 'Суры',         data: SURAHS,  label: s => s.lb,   id: s => String(s.n), glyph: '114', latin: true },
  listen:   { title: 'На слух',      data: LISTEN,  label: a => a.ru,   id: a => a.ref, glyph: 'سَمَاع', single: true },
  spell:    { title: 'Собери слово', data: SPELL_WORDS, label: w => w.sk, id: w => w.ar, glyph: 'ب+ي+ت', round: 20, custom: 'spell' },
  missing:  { title: 'Пропущенная буква', data: MISSING, label: x => (x.ans !== undefined ? x.ans : x.letter), id: x => x.ar, glyph: 'كتـ؟ب', round: 30, ownOpts: true, arOpts: true },
  harakat:  { title: 'Огласовки',    data: HARAKAT_ITEMS, label: x => (x.ans !== undefined ? x.ans : x.ar), id: x => x.ar, glyph: 'ـَـُـِ', round: 30, ownOpts: true, arOpts: true, single: true },
};
export const MODE_KEYS = Object.keys(MODES) as ModeKey[];
export const idsOf = (mode: ModeKey) => MODES[mode].data.map(MODES[mode].id);
export const statsOf = (mode: ModeKey) => modeStats(mode, idsOf(mode));

/* Буквы, которые соединяются только справа */
export const NONCONNECT = new Set(['ا', 'د', 'ذ', 'ر', 'ز', 'و']);
export const ZWJ = '‍';

export const rand = (n: number) => Math.floor(Math.random() * n);
export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* Случайная позиционная форма буквы (режим «Разные формы букв») */
export function displayForm(char: string, formsMode: boolean) {
  if (!formsMode) return char;
  if (NONCONNECT.has(char)) return rand(2) ? ZWJ + char : char;
  const f = rand(4);
  if (f === 0) return char;
  if (f === 1) return char + ZWJ;
  if (f === 2) return ZWJ + char + ZWJ;
  return ZWJ + char;
}

/* Четыре формы буквы для таблицы под карточкой */
export function letterForms(c: string) {
  return [
    { lbl: 'Отдельно',   g: c },
    { lbl: 'В начале',   g: c + ZWJ },
    { lbl: 'В середине', g: ZWJ + c + ZWJ },
    { lbl: 'В конце',    g: ZWJ + c },
  ];
}

/* Слово с подсвеченной буквой: [до, буква, после] с ZWJ для сохранения соединений */
export function highlightParts(word: string, hi: number) {
  const letters = [...word];
  const prev = letters[hi - 1], cur = letters[hi], next = letters[hi + 1];
  const connRight = prev !== undefined && !NONCONNECT.has(prev);
  const connLeft = next !== undefined && !NONCONNECT.has(cur);
  return {
    before: letters.slice(0, hi).join('') + (connRight ? ZWJ : ''),
    target: (connRight ? ZWJ : '') + cur + (connLeft ? ZWJ : ''),
    after: (connLeft ? ZWJ : '') + letters.slice(hi + 1).join(''),
  };
}

export function ayatWord(n: number) {
  const m = n % 100, d = n % 10;
  if (m >= 11 && m <= 14) return 'аятов';
  if (d === 1) return 'аят';
  if (d >= 2 && d <= 4) return 'аята';
  return 'аятов';
}

export type DeckEntry = { mode: ModeKey; item: AnyItem };
/* Колода на одно прохождение — сначала то, что ждёт повтора, потом новое */
export function buildDeck(mode: ModeKey): DeckEntry[] {
  const cfg = MODES[mode];
  if (cfg.ordered) return cfg.data.map(item => ({ mode, item }));
  return pickDeck(mode, cfg.data, cfg.id, cfg.round).map(item => ({ mode, item }));
}

export function surahName(n: number): string { return SURAHS[n - 1]?.ru || ''; }

export type Option = AnyItem & { ans?: string };
/* Варианты ответа для текущего вопроса */
export function buildOptions(mode: ModeKey, current: AnyItem): Option[] {
  const cfg = MODES[mode];
  if (mode === 'sira') return shuffle(current.a.map((s: string) => ({ ans: s })));
  if (cfg.ownOpts) return shuffle(current.opts.map((s: string) => ({ ans: s })));
  const label = cfg.label;
  const correct = label(current);
  const opts: AnyItem[] = [current];
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

export function resultMessage(pct: number) {
  if (pct >= 90) return 'Великолепно!';
  if (pct >= 70) return 'Хорошо!';
  if (pct >= 50) return 'Неплохо, продолжай';
  return 'Есть куда расти';
}

/* ---------- Незавершённая сессия теста: сохраняем, чтобы продолжить с того же вопроса ---------- */
const SKEY = 'islamua_sessions';
type Saved = { title: string; mode: ModeKey | null; pos: number; hints: number[]; deck: { m: ModeKey; id: string }[]; opts: string[][]; answers: (string | null)[] };
const readAll = (): Record<string, Saved> => loadRaw(SKEY, {});
const writeAll = (obj: Record<string, Saved>) => save(SKEY, obj);

export type Session = { title: string; mode: ModeKey | null; deck: DeckEntry[]; resume?: SessionState };
export type SessionState = { deck: DeckEntry[]; optsCache: (Option[] | undefined)[]; answers: (Option | null)[]; hints: number[]; pos: number };
const sessionKey = (session: Session) => session.mode || 'review';

const itemId = (m: ModeKey, it: Option) => (it.ans !== undefined ? it.ans : MODES[m].id(it));
const findItem = (m: ModeKey, id: string) => MODES[m].data.find(x => MODES[m].id(x) === id) || null;

export function saveSession(session: Session, state: SessionState) {
  const all = readAll();
  all[sessionKey(session)] = {
    title: session.title, mode: session.mode, pos: state.pos, hints: state.hints,
    deck: state.deck.map(e => ({ m: e.mode, id: MODES[e.mode].id(e.item) })),
    opts: state.deck.map((e, i) => (state.optsCache[i] || []).map(o => itemId(e.mode, o))),
    answers: state.deck.map((e, i) => (state.answers[i] == null ? null : itemId(e.mode, state.answers[i] as Option))),
  };
  writeAll(all);
}
export function clearSession(session: Session) { const all = readAll(); delete all[sessionKey(session)]; writeAll(all); }

/* Есть ли незавершённая сессия для раздела (или 'review') — {pos, total} */
export function pendingSession(key: string): { pos: number; total: number } | null {
  const s = readAll()[key];
  if (!s) return null;
  const answered = s.answers.filter(a => a != null).length;
  if (answered === 0 || answered >= s.deck.length) return null;
  return { pos: answered, total: s.deck.length };
}

/* Восстановить сессию: {session, state} или null */
export function restoreSession(key: string): { session: Session; state: SessionState } | null {
  const s = readAll()[key];
  if (!s) return null;
  const deck: DeckEntry[] = [];
  for (const d of s.deck) { const item = findItem(d.m, d.id); if (!item) return null; deck.push({ mode: d.m, item }); }
  const optsCache = s.opts.map((ids, i) => {
    if (!ids || !ids.length) return undefined;
    const m = deck[i].mode;
    if (m === 'sira' || MODES[m].ownOpts) return ids.map(ans => ({ ans }));
    const o = ids.map(id => findItem(m, id)).filter(Boolean) as Option[];
    return o.length ? o : undefined;
  });
  const answers = s.answers.map((id, i) => {
    if (id == null) return null;
    const m = deck[i].mode;
    return (optsCache[i] || []).find(o => itemId(m, o) === id) ?? null;
  });
  return { session: { title: s.title, mode: s.mode, deck }, state: { deck, optsCache, answers, hints: s.hints || [], pos: Math.min(s.pos, deck.length - 1) } };
}
