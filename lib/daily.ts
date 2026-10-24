/* Ежедневный контент: аят дня, хадис дня, дуа дня, имя дня — выбор детерминирован датой,
   поэтому у всех пользователей в один день одно и то же, и ничего не нужно хранить. */
import AYAT_JSON from '../data/ayat.json';
import HADITH_JSON from '../data/hadith.json';
import DUA_JSON from '../data/dua.json';
import NAMES_JSON from '../data/names.json';
import SURAHS_JSON from '../data/surahs.json';

export type Ayah = { ref: string; ar: string; tl: string; ru: string };
export type Hadith = { ar: string; ru: string; src: string };
export type Dua = { t: string; ar: string; tl: string; ru: string; src: string };
export type Name = { ar: string; ru: string; lat: string; tr: string; variants?: string; info?: string; ex?: string; exl?: string; ext?: string; ref?: string; exnote?: string };
export type Surah = { n: number; ar: string; ru: string; tr: string; lb: string; t: string; ay: number; hint?: string };

export const AYAT = AYAT_JSON as Ayah[];
export const HADITH = HADITH_JSON as Hadith[];
export const DUA = DUA_JSON as Dua[];
export const NAMES = NAMES_JSON as Name[];
export const SURAHS = SURAHS_JSON as Surah[];

/* Номер дня (локальная дата), одинаковый в любом часовом поясе для одной календарной даты */
export function dayIndex(d: Date = new Date()): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/* Перемешанный обход массива: шаг взаимно прост с длиной, чтобы соседние дни не шли по порядку */
function pick<T>(arr: T[], salt: number, d?: Date): T {
  const n = arr.length;
  let step = Math.floor(n * 0.618) || 1;
  while (gcd(step, n) !== 1) step++;
  return arr[((dayIndex(d) + salt) * step) % n];
}

export const ayahOfDay = (d?: Date) => pick(AYAT, 11, d);
export const hadithOfDay = (d?: Date) => pick(HADITH, 5, d);
export const duaOfDay = (d?: Date) => pick(DUA, 2, d);
export const nameOfDay = (d?: Date) => pick(NAMES, 7, d);

/* «Сура 2 «Аль-Бакара», аят 255» */
export function refLabel(ref: string): string {
  const [s, a] = ref.split(':');
  const name = SURAHS[+s - 1]?.ru || '';
  const range = a.includes('-') ? `аяты ${a.replace('-', '–')}` : `аят ${a}`;
  return `Сура ${s} «${name}», ${range}`;
}

/* ---------- Кибла ---------- */
const KAABA = { lat: 21.4225, lng: 39.8262 };
const DR = Math.PI / 180;

/* Азимут на Каабу (0–360°, по часовой от севера) и расстояние по большому кругу (км) */
export function qibla(lat: number, lng: number): { bearing: number; km: number } {
  const f1 = lat * DR, f2 = KAABA.lat * DR, dl = (KAABA.lng - lng) * DR;
  const y = Math.sin(dl) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
  const bearing = (Math.atan2(y, x) / DR + 360) % 360;
  const a = Math.sin((f2 - f1) / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return { bearing, km };
}

const DIRS = ['С', 'ССВ', 'СВ', 'ВСВ', 'В', 'ВЮВ', 'ЮВ', 'ЮЮВ', 'Ю', 'ЮЮЗ', 'ЮЗ', 'ЗЮЗ', 'З', 'ЗСЗ', 'СЗ', 'ССЗ'];
export const compassDir = (deg: number) => DIRS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
