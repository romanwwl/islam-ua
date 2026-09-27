import LETTERS from '../data/letters.json';
import NAMES from '../data/names.json';
import WORDS from '../data/words.json';
import SIRA from '../data/sira.json';
import SURAHS from '../data/surahs.json';
import QURAN from '../data/quran.json';

/* Режимы тестов. round — сколько вопросов в одном прохождении (иначе все). */
export const MODES = {
  alphabet: { title: 'Алфавит',      data: LETTERS, prompt: 'Какая это буква?',          label: l => l.name },
  names:    { title: 'Имена Аллаха', data: NAMES,   prompt: 'Что означает это имя?',     label: n => n.tr },
  dict:     { title: 'Словарь',      data: WORDS,   prompt: 'Что означает это слово?',   label: w => w.tr, round: 30 },
  sira:     { title: 'Сира',         data: SIRA,    prompt: 'Выберите правильный ответ', label: x => (x.ans !== undefined ? x.ans : x.a[0]), round: 30 },
  surah:    { title: 'Суры',         data: SURAHS,  prompt: 'Как называется эта сура?',  label: s => s.lb },
  // Слова Корана: по порядку частотности, раундами по 30; варианты ответа — той же категории (частица/имя/глагол)
  quran:    { title: 'Коран',        data: QURAN,   prompt: 'Что означает это слово?',   label: w => w.tr, round: 30, ordered: true, sameCat: true },
};
export const MODE_KEYS = Object.keys(MODES);

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

/* Сколько раундов в упорядоченном режиме */
export function roundCount(mode) {
  const cfg = MODES[mode];
  return cfg.ordered ? Math.ceil(cfg.data.length / cfg.round) : 1;
}

/* Колода на одно прохождение. roundIdx — номер раунда (с 0) для упорядоченных режимов */
export function buildDeck(mode, roundIdx = 0) {
  const cfg = MODES[mode];
  if (cfg.ordered) {
    const from = roundIdx * cfg.round;
    return shuffle(cfg.data.slice(from, from + cfg.round));
  }
  let d = shuffle([...cfg.data]);
  if (cfg.round) d = d.slice(0, Math.min(cfg.round, d.length));
  return d;
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
