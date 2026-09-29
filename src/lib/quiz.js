import LETTERS from '../data/letters.json';
import NAMES from '../data/names.json';
import WORDS from '../data/words.json';
import SIRA from '../data/sira.json';
import SURAHS from '../data/surahs.json';
import QURAN from '../data/quran.json';

import { pickDeck, modeStats } from './progress.js';

/* Режимы тестов. round — сколько вопросов в одном прохождении (иначе все); id — стабильный ключ элемента для прогресса;
   glyph — символ на карточке раздела; unit — что считаем («выучено» или «верно»). */
export const MODES = {
  alphabet: { title: 'Алфавит',      data: LETTERS, label: l => l.name, id: l => l.c,  glyph: 'ب',      round: 28 },
  names:    { title: 'Имена Аллаха', data: NAMES,   label: n => n.tr,   id: n => n.ar, glyph: 'الله',   round: 30 },
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
