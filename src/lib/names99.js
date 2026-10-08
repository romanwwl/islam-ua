/* Тривиа «99 имён»: сопоставление ввода с именем — по-арабски, по-русски (значение) или транскрипцией (Аль Мунтакым). */
import NAMES from '../data/names.json';
import { load, save } from './storage.js';

const KEY = 'islamua_names99';

const AR_MARKS = /[ً-ٰٟۖ-ۭ]/g;
function normAr(s) {
  s = s.replace(AR_MARKS, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^ء-ي\s]/g, '').trim();
  s = s.replace(/\s+/g, ' ');
  // артикль в начале каждого слова не обязателен
  return s.split(' ').map(w => w.replace(/^ال/, '')).join('');
}

/* Кириллица/латиница: без артикля, дефисов, мягких знаков, удвоений; ы→и, й→и, э→е, ё→е, къ→к, кх→х и т.п. */
function normCyr(s) {
  s = s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  s = s.replace(/^(аль|ал|ар|ас|ад|аз|ат|аш|ан|al|ar|as|ad|az|at|ash|an)[\s\-–—]+/, '');   // артикль только с разделителем (Аллах не трогаем)
  s = s.replace(/[`'ʼ’ʻ"\-–—.,!?()]/g, '');
  s = s.replace(/[\sъь]/g, '')
       .replace(/ы/g, 'и').replace(/й/g, 'и').replace(/э/g, 'е').replace(/я/g, 'а').replace(/ю/g, 'у')
       .replace(/къ/g, 'к').replace(/дж/g, 'ж').replace(/з̃/g, 'з').replace(/с̃/g, 'с').replace(/қ/g, 'к').replace(/ғ/g, 'г').replace(/ҳ/g, 'х')
       .replace(/kh/g, 'h').replace(/gh/g, 'g').replace(/dh/g, 'z').replace(/th/g, 's').replace(/sh/g, 'ш').replace(/j/g, 'ж').replace(/q/g, 'k').replace(/w/g, 'в').replace(/y/g, 'и')
       .replace(/(.)\1+/g, '$1');
  return s;
}

/* Все формы, под которыми принимается имя */
export const FORMS = NAMES.map(n => {
  const set = new Set();
  set.add('ar:' + normAr(n.ar));
  set.add(normCyr(n.ru));
  set.add(normCyr(n.lat));
  set.add(normCyr(n.tr));
  for (const v of (n.variants || '').split(',')) { const t = v.trim(); if (t) set.add(normCyr(t)); }
  return set;
});

/* Индекс имени по вводу среди ещё не открытых (или -1) */
export function matchName(input, revealed) {
  const raw = input.trim();
  if (raw.length < 2) return -1;
  const key = /[؀-ۿ]/.test(raw) ? 'ar:' + normAr(raw) : normCyr(raw);
  if (!key || key === 'ar:') return -1;
  for (let i = 0; i < FORMS.length; i++) {
    if (!revealed.has(i) && FORMS[i].has(key)) return i;
  }
  return -1;
}

export function loadState() { const s = load(KEY, null); return s && Array.isArray(s.revealed) ? s : { revealed: [], hinted: [], gaveUp: false, best: 0 }; }
export function saveState(s) { save(KEY, s); }
