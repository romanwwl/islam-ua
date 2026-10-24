/* ---------- Время намазов: астрономический расчёт (алгоритм PrayTimes), без интернета ---------- */
import CITIES_JSON from '../data/cities.json';

export type City = { name: string; lat: number; lng: number };
export const CITIES = CITIES_JSON as City[];

export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type TimeKey = PrayerKey | 'jumuah';

export type Method = {
  name: string; fajr: number; isha?: number; ishaMin?: number;
  offsets?: Partial<Record<PrayerKey, number>>; jumuah?: string; jumuahWinter?: string;
};

/*
 * Методы расчёта. fajr / isha — углы Солнца под горизонтом (градусы), ishaMin — фиксированные минуты после магриба.
 * «Мечеть АМУ (Киев)»: по словам мечети — стандартный ISNA, 15°/15°, без поправок; джума 13:30 летом, 12:30 зимой.
 */
export const METHODS: Record<string, Method> = {
  amu:     { name: 'Мечеть АМУ (Киев)', fajr: 15,   isha: 15,   jumuah: '13:30', jumuahWinter: '12:30' },
  mwl:     { name: 'Лига исламского мира (18° / 17°)', fajr: 18,   isha: 17 },
  diyanet: { name: 'Диянет, Турция (18° / 17°)',       fajr: 18,   isha: 17 },
  isna:    { name: 'ISNA (15° / 15°)',                  fajr: 15,   isha: 15 },
  egypt:   { name: 'Египет (19.5° / 17.5°)',            fajr: 19.5, isha: 17.5 },
  makkah:  { name: 'Умм аль-Кура (18.5° / 90 мин)',     fajr: 18.5, ishaMin: 90 },
  karachi: { name: 'Карачи (18° / 18°)',                fajr: 18,   isha: 18 },
};

export const PRAYER_KEYS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const PRAYER_RU: Record<TimeKey, string> = { fajr: 'Фаджр', sunrise: 'Восход', dhuhr: 'Зухр', asr: 'Аср', maghrib: 'Магриб', isha: 'Иша', jumuah: 'Джума' };
/* Родительный падеж для «До Зухра осталось» */
export const PRAYER_GEN: Record<TimeKey, string> = { fajr: 'Фаджра', sunrise: 'восхода', dhuhr: 'Зухра', asr: 'Асра', maghrib: 'Магриба', isha: 'Иша', jumuah: 'Джумы' };

export type PrayerState = { city: string; method: string; asr: string; geo: { lat: number; lng: number } | null };
export const DEFAULT_STATE: PrayerState = { city: '0', method: 'amu', asr: '1', geo: null };

const DR = Math.PI / 180, RD = 180 / Math.PI;
const fixAngle = (a: number) => { a = a - 360 * Math.floor(a / 360); return a < 0 ? a + 360 : a; };
const fixHour = (h: number) => { h = h - 24 * Math.floor(h / 24); return h < 0 ? h + 24 : h; };

function julian(y: number, m: number, d: number) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function sunPos(jd: number) {
  const D = jd - 2451545.0, g = fixAngle(357.529 + 0.98560028 * D), q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(g * DR) + 0.020 * Math.sin(2 * g * DR)), e = 23.439 - 0.00000036 * D;
  const RA = Math.atan2(Math.cos(e * DR) * Math.sin(L * DR), Math.cos(L * DR)) * RD / 15;
  return { decl: Math.asin(Math.sin(e * DR) * Math.sin(L * DR)) * RD, eqt: q / 15 - fixHour(RA) };
}

export type Params = { fajr: number; isha?: number; ishaMin?: number; asr: number; offsets: Partial<Record<PrayerKey, number>> };

/* Времена в часах UTC для даты date в точке lat/lng по параметрам p */
export function computePrayerTimes(date: Date, lat: number, lng: number, p: Params): Record<PrayerKey, number> {
  const jDate = julian(date.getFullYear(), date.getMonth() + 1, date.getDate()) - lng / (15 * 24);
  const sp = (t: number) => sunPos(jDate + t / 24);
  const midDay = (t: number) => fixHour(12 - sp(t).eqt);
  const sunAngleTime = (angle: number, t: number, ccw: boolean) => {
    const s = sp(t), noon = midDay(t);
    const c = (-Math.sin(angle * DR) - Math.sin(s.decl * DR) * Math.sin(lat * DR)) / (Math.cos(s.decl * DR) * Math.cos(lat * DR));
    const H = Math.acos(Math.max(-1, Math.min(1, c))) * RD / 15;
    return noon + (ccw ? -H : H);
  };
  const asrTime = (factor: number, t: number) => {
    const s = sp(t);
    const angle = -Math.atan(1 / (factor + Math.tan(Math.abs(lat - s.decl) * DR))) * RD;
    return sunAngleTime(angle, t, false);
  };
  const T: Record<string, number> = {
    fajr: sunAngleTime(p.fajr, 5, true),
    sunrise: sunAngleTime(0.833, 6, true),
    dhuhr: midDay(12),
    asr: asrTime(p.asr, 13),
    sunset: sunAngleTime(0.833, 18, false),
    isha: p.ishaMin ? 0 : sunAngleTime(p.isha ?? 15, 18, false),
  };
  T.maghrib = T.sunset;
  if (p.ishaMin) T.isha = T.maghrib + p.ishaMin / 60;
  // Высокие широты (метод AngleBased): летом ночные намазы не «уплывают»
  const night = fixHour(T.sunrise - T.sunset);
  const portion = (a: number) => a / 60 * night;
  const diff = (a: number, b: number) => fixHour(b - a);
  const fp = portion(p.fajr); if (!isFinite(T.fajr) || diff(T.fajr, T.sunrise) > fp) T.fajr = T.sunrise - fp;
  const ip = portion(p.ishaMin ? 18 : (p.isha ?? 15)); if (!isFinite(T.isha) || diff(T.sunset, T.isha) > ip) T.isha = T.sunset + ip;
  const out = {} as Record<PrayerKey, number>;
  for (const k of PRAYER_KEYS) out[k] = T[k] - lng / 15;
  return out;
}

/* Часы UTC → Date с округлением до минуты + поправки мечети */
export function toDates(utcHours: Record<PrayerKey, number>, date: Date, offsets: Partial<Record<PrayerKey, number>> = {}): Record<PrayerKey, Date> {
  const base = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const o = {} as Record<PrayerKey, Date>;
  for (const k of PRAYER_KEYS) {
    const ms = Math.round((base + utcHours[k] * 3600000) / 60000) * 60000;
    o[k] = new Date(ms + (offsets[k] || 0) * 60000);
  }
  return o;
}

export function coordsFor(state: PrayerState) {
  if (state.city === 'geo' && state.geo) return { lat: state.geo.lat, lng: state.geo.lng, name: 'Моё местоположение' };
  const c = CITIES[+state.city] || CITIES[0];
  return { lat: c.lat, lng: c.lng, name: c.name };
}

export function paramsFor(state: PrayerState): Params {
  const m = METHODS[state.method] || METHODS.amu;
  return { fajr: m.fajr, isha: m.isha, ishaMin: m.ishaMin, asr: (+state.asr || 1), offsets: m.offsets || {} };
}

/* Летнее время? (смещение от UTC меньше, чем зимой) */
export function isDST(d: Date): boolean {
  const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
  return jan !== jul && d.getTimezoneOffset() === Math.min(jan, jul);
}

/* Время джумы «HH:MM» из пресета мечети (или '' — если у метода нет фиксированной джумы) */
export function jumuahFor(state: PrayerState, date: Date = new Date()): string {
  const m = METHODS[state.method];
  if (!m || !m.jumuah) return '';
  return (m.jumuahWinter && !isDST(date)) ? m.jumuahWinter : m.jumuah;
}

export type Times = Record<PrayerKey, Date> & { jumuah?: Date };

/* Все времена на дату (Date в локальном времени) */
export function timesFor(date: Date, state: PrayerState): Times {
  const co = coordsFor(state), p = paramsFor(state);
  const t: Times = toDates(computePrayerTimes(date, co.lat, co.lng, p), date, p.offsets);
  const j = jumuahFor(state, date);
  if (j) {
    const [h, m] = j.split(':').map(Number);
    t.jumuah = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0);
  }
  return t;
}

export const isFriday = (d: Date) => d.getDay() === 5;

const two = (n: number) => String(n).padStart(2, '0');
export const fmtTime = (d: Date) => `${two(d.getHours())}:${two(d.getMinutes())}`;

/* Следующий намаз: ключ, время и до него миллисекунд; после Иша — Фаджр завтра */
export type NextPrayer = { key: TimeKey; at: Date; ms: number; isTomorrow: boolean };
export function nextPrayer(now: Date, state: PrayerState): NextPrayer {
  const today = timesFor(now, state);
  const seq: TimeKey[] = [...PRAYER_KEYS];
  if (isFriday(now) && today.jumuah) seq.splice(seq.indexOf('asr'), 0, 'jumuah');
  for (const k of seq) {
    const at = today[k as PrayerKey] as Date | undefined;
    if (at && at > now) return { key: k, at, ms: at.getTime() - now.getTime(), isTomorrow: false };
  }
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const at = timesFor(tomorrow, state).fajr;
  return { key: 'fajr', at, ms: at.getTime() - now.getTime(), isTomorrow: true };
}

/* «3 ч 01 мин» → части для отсчёта */
export function countdownParts(ms: number): { h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
/* «Суббота, 24 октября» */
export const fmtDateRu = (d: Date) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;

const HIJRI_MONTHS = ['мухаррам', 'сафар', 'раби аль-авваль', 'раби ас-сани', 'джумада аль-уля', 'джумада ас-сани', 'раджаб', 'шаабан', 'рамадан', 'шавваль', 'зуль-када', 'зуль-хиджа'];

/* Табличный (арифметический) хиджри-календарь — запасной вариант, если Intl не знает исламский календарь. ±1 день от Умм аль-Кура. */
export function hijriTabular(d: Date): { day: number; month: number; year: number } {
  const jd = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) + 2440588;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { day, month, year };
}

/* «13 джумада аль-уля 1448» */
export function hijri(d: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(d);
    const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
    const day = get('day'), month = get('month'), year = get('year');
    if (day && month && year && year > 1300) return `${day} ${HIJRI_MONTHS[month - 1]} ${year}`;
  } catch { /* fallthrough */ }
  const h = hijriTabular(d);
  return `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year}`;
}
