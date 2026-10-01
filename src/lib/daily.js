/* Ежедневный контент: аят дня, хадис дня, дуа дня, имя дня — выбор детерминирован датой,
   поэтому у всех пользователей в один день одно и то же, и ничего не нужно хранить. */
import AYAT from '../data/ayat.json';
import HADITH from '../data/hadith.json';
import DUA from '../data/dua.json';
import NAMES from '../data/names.json';
import SURAHS from '../data/surahs.json';

/* Номер дня (локальная дата), одинаковый в любом часовом поясе для одной календарной даты */
export function dayIndex(d = new Date()) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

/* Перемешанный обход массива: шаг взаимно прост с длиной, чтобы соседние дни не шли по порядку */
function pick(arr, salt, d) {
  const n = arr.length;
  if (!n) return null;
  let step = Math.floor(n * 0.618) || 1;
  while (gcd(step, n) !== 1) step++;
  return arr[((dayIndex(d) + salt) * step) % n];
}
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

export const ayahOfDay = d => pick(AYAT, 11, d);
export const hadithOfDay = d => pick(HADITH, 5, d);
export const duaOfDay = d => pick(DUA, 2, d);
export const nameOfDay = d => pick(NAMES, 7, d);

/* «Сура 2 «Корова», аяты 255» */
export function refLabel(ref) {
  const [s, a] = ref.split(':');
  const name = SURAHS[+s - 1]?.ru || '';
  const range = a.includes('-') ? `аяты ${a.replace('-', '–')}` : `аят ${a}`;
  return `Сура ${s} «${name}», ${range}`;
}

/* ---------- Кибла ---------- */
const KAABA = { lat: 21.4225, lng: 39.8262 };
const DR = Math.PI / 180;

/* Азимут на Каабу (0–360°, по часовой от севера) и расстояние по большому кругу (км) */
export function qibla(lat, lng) {
  const φ1 = lat * DR, φ2 = KAABA.lat * DR, Δλ = (KAABA.lng - lng) * DR;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearing = (Math.atan2(y, x) / DR + 360) % 360;
  const a = Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return { bearing, km };
}

const DIRS = ['С', 'ССВ', 'СВ', 'ВСВ', 'В', 'ВЮВ', 'ЮВ', 'ЮЮВ', 'Ю', 'ЮЮЗ', 'ЮЗ', 'ЗЮЗ', 'З', 'ЗСЗ', 'СЗ', 'ССЗ'];
export const compassDir = deg => DIRS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
