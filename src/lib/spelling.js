/* Правописание: данные для игр «Собери слово», «Пропущенная буква», «Огласовки» — из Словаря. */
import WORDS from '../data/words.json';

const HARAKAT = /[ً-ٰٟ]/g;
export const skeleton = s => s.replace(HARAKAT, '');
export const NONCONNECT = new Set(['ا', 'أ', 'إ', 'آ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ة', 'ى']);
const ZWNJ = '‌', TATWEEL = 'ـ';

/* Похожие буквы — из них берём отвлекающие варианты */
const GROUPS = [
  ['ب', 'ت', 'ث', 'ن', 'ي'], ['ج', 'ح', 'خ'], ['د', 'ذ'], ['ر', 'ز'], ['س', 'ش'], ['ص', 'ض'], ['ط', 'ظ'],
  ['ع', 'غ'], ['ف', 'ق'], ['ك', 'ل'], ['ه', 'ة'], ['ا', 'أ', 'إ', 'آ'], ['و', 'ؤ'], ['ى', 'ي'], ['م', 'ن'],
];
const ALL = [...new Set(GROUPS.flat())];
const similar = ch => { const g = GROUPS.find(x => x.includes(ch)); return g ? g.filter(x => x !== ch) : []; };

/* Детерминированный «случайный» генератор по слову — чтобы у слова всегда был один и тот же вопрос */
function rng(seed) {
  let h = 2166136261;
  for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}
const shuffleWith = (arr, r) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* Слова, пригодные для игр: одно слово, 3–7 букв */
export const SPELL_WORDS = WORDS.filter(w => !w.ar.includes(' ') && skeleton(w.ar).length >= 3 && skeleton(w.ar).length <= 7)
  .map(w => ({ ...w, sk: skeleton(w.ar) }));

/* Отвлекающие буквы для сборки слова: 2 похожие на буквы слова + 1 случайная */
export function tilesFor(w) {
  const r = rng('t' + w.ar);
  const letters = [...w.sk];
  const pool = [...new Set(letters.flatMap(similar))].filter(x => !letters.includes(x));
  const extra = shuffleWith(pool, r).slice(0, 2);
  const rest = ALL.filter(x => !letters.includes(x) && !extra.includes(x));
  if (rest.length) extra.push(rest[Math.floor(r() * rest.length)]);
  return shuffleWith([...letters, ...extra], r);
}

/* «Пропущенная буква»: прячем одну букву (по возможности ту, у которой есть похожие) */
export const MISSING = SPELL_WORDS.map(w => {
  const r = rng('m' + w.ar);
  const letters = [...w.sk];
  const cand = letters.map((c, i) => i).filter(i => similar(letters[i]).length);
  const idx = (cand.length ? cand : letters.map((_, i) => i))[Math.floor(r() * (cand.length || letters.length))];
  const letter = letters[idx];
  const sim = shuffleWith(similar(letter), r);
  const opts = [letter, ...sim.slice(0, 3)];
  const rest = shuffleWith(ALL.filter(x => !opts.includes(x)), r);
  while (opts.length < 4) opts.push(rest.pop());
  return { ...w, idx, letter, opts };
});

/* HTML слова с пропуском: внутри пропуска — тэтвилы (они соединяются с соседями сами),
   после несоединяемой буквы — разрыв, чтобы следующая буква встала в начальную форму */
export function gapHTML(sk, idx) {
  const L = [...sk];
  const before = L.slice(0, idx).join(''), after = L.slice(idx + 1).join('');
  const brk = after && NONCONNECT.has(L[idx]) ? ZWNJ : '';
  return before + '<span class="gap">' + TATWEEL + TATWEEL + TATWEEL + '</span>' + brk + after;
}

/* «Огласовки»: правильная форма + 3 с перепутанными гласными */
const VOWELS = ['َ', 'ُ', 'ِ'];
export const HARAKAT_ITEMS = SPELL_WORDS.filter(w => (w.ar.match(/[َُِ]/g) || []).length >= 2).map(w => {
  const r = rng('h' + w.ar);
  const chars = [...w.ar];
  const vpos = chars.map((c, i) => (VOWELS.includes(c) ? i : -1)).filter(i => i >= 0);
  const variants = new Set([w.ar]);
  let guard = 0;
  while (variants.size < 4 && guard++ < 40) {
    const c = [...chars];
    const n = 1 + Math.floor(r() * Math.min(2, vpos.length));
    for (const i of shuffleWith(vpos, r).slice(0, n)) {
      const others = VOWELS.filter(v => v !== c[i]);
      c[i] = others[Math.floor(r() * others.length)];
    }
    variants.add(c.join(''));
  }
  return { ...w, opts: shuffleWith([...variants], r) };
});
