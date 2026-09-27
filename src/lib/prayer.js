/* ---------- Время намазов: астрономический расчёт (алгоритм PrayTimes), без интернета ---------- */
import CITIES from '../data/cities.json';
export { CITIES };

/*
 * Методы расчёта. fajr / isha — углы Солнца под горизонтом (градусы), ishaMin — фиксированные минуты после магриба.
 * offsets — поправки в минутах, которые мечеть добавляет к расчётному времени (ихтият).
 * jumuah — время пятничной молитвы по умолчанию для этого пресета.
 *
 * «Мечеть АМУ (Киев)»: сверено с расписанием на сайте amu.org.ua — ISNA 15°/15°, Аср стандартный,
 * Аср +2 мин, Магриб +5 мин. Поправки предварительные — подтверждаются по расписанию мечети.
 */
export const METHODS = {
  amu:     { name: 'Мечеть АМУ, Киев (amu.org.ua)', fajr: 15,   isha: 15,   offsets: { asr: 2, maghrib: 5 }, jumuah: '13:30' },
  mwl:     { name: 'Лига исламского мира (18° / 17°)', fajr: 18,   isha: 17 },
  diyanet: { name: 'Диянет, Турция (18° / 17°)',       fajr: 18,   isha: 17 },
  isna:    { name: 'ISNA (15° / 15°)',                  fajr: 15,   isha: 15 },
  egypt:   { name: 'Египет (19.5° / 17.5°)',            fajr: 19.5, isha: 17.5 },
  makkah:  { name: 'Умм аль-Кура (18.5° / 90 мин)',     fajr: 18.5, ishaMin: 90 },
  karachi: { name: 'Карачи (18° / 18°)',                fajr: 18,   isha: 18 },
};

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const PRAYER_RU = { fajr: 'Фаджр', sunrise: 'Восход', dhuhr: 'Зухр', asr: 'Аср', maghrib: 'Магриб', isha: 'Иша', jumuah: 'Джума' };

export const DEFAULT_STATE = { city: '0', method: 'amu', asr: '1', geo: null, jumuah: null };

const DR = Math.PI / 180, RD = 180 / Math.PI;
const fixAngle = a => { a = a - 360 * Math.floor(a / 360); return a < 0 ? a + 360 : a; };
const fixHour = h => { h = h - 24 * Math.floor(h / 24); return h < 0 ? h + 24 : h; };

function julian(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function sunPos(jd) {
  const D = jd - 2451545.0, g = fixAngle(357.529 + 0.98560028 * D), q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(g * DR) + 0.020 * Math.sin(2 * g * DR)), e = 23.439 - 0.00000036 * D;
  const RA = Math.atan2(Math.cos(e * DR) * Math.sin(L * DR), Math.cos(L * DR)) * RD / 15;
  return { decl: Math.asin(Math.sin(e * DR) * Math.sin(L * DR)) * RD, eqt: q / 15 - fixHour(RA) };
}

/* Возвращает времена в часах UTC для даты date в точке lat/lng по параметрам p {fajr, isha, ishaMin, asr} */
export function computePrayerTimes(date, lat, lng, p) {
  const jDate = julian(date.getFullYear(), date.getMonth() + 1, date.getDate()) - lng / (15 * 24);
  const sp = t => sunPos(jDate + t / 24);
  const midDay = t => fixHour(12 - sp(t).eqt);
  const sunAngleTime = (angle, t, ccw) => {
    const s = sp(t), noon = midDay(t);
    const c = (-Math.sin(angle * DR) - Math.sin(s.decl * DR) * Math.sin(lat * DR)) / (Math.cos(s.decl * DR) * Math.cos(lat * DR));
    const H = Math.acos(Math.max(-1, Math.min(1, c))) * RD / 15;
    return noon + (ccw ? -H : H);
  };
  const asrTime = (factor, t) => {
    const s = sp(t);
    const angle = -Math.atan(1 / (factor + Math.tan(Math.abs(lat - s.decl) * DR))) * RD;
    return sunAngleTime(angle, t, false);
  };
  const T = {
    fajr: sunAngleTime(p.fajr, 5, true),
    sunrise: sunAngleTime(0.833, 6, true),
    dhuhr: midDay(12),
    asr: asrTime(p.asr, 13),
    sunset: sunAngleTime(0.833, 18, false),
    isha: p.ishaMin ? 0 : sunAngleTime(p.isha, 18, false),
  };
  T.maghrib = T.sunset;
  if (p.ishaMin) T.isha = T.maghrib + p.ishaMin / 60;
  // Высокие широты (метод AngleBased): летом ночные намазы не «уплывают»
  const night = fixHour(T.sunrise - T.sunset);
  const portion = a => a / 60 * night;
  const diff = (a, b) => fixHour(b - a);
  const fp = portion(p.fajr); if (!isFinite(T.fajr) || diff(T.fajr, T.sunrise) > fp) T.fajr = T.sunrise - fp;
  const ip = portion(p.ishaMin ? 18 : p.isha); if (!isFinite(T.isha) || diff(T.sunset, T.isha) > ip) T.isha = T.sunset + ip;
  const out = {};
  for (const k of PRAYER_KEYS) out[k] = T[k] - lng / 15;
  return out;
}

/* Часы UTC → Date с округлением до минуты + поправки мечети */
export function toDates(utcHours, date, offsets = {}) {
  const base = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const o = {};
  for (const k in utcHours) {
    const ms = Math.round((base + utcHours[k] * 3600000) / 60000) * 60000;
    o[k] = new Date(ms + (offsets[k] || 0) * 60000);
  }
  return o;
}

export function coordsFor(state) {
  if (state.city === 'geo' && state.geo) return { lat: state.geo.lat, lng: state.geo.lng, name: 'Моё местоположение' };
  const c = CITIES[+state.city] || CITIES[0];
  return { lat: c.lat, lng: c.lng, name: c.name };
}

export function paramsFor(state) {
  const m = METHODS[state.method] || METHODS.amu;
  return { fajr: m.fajr, isha: m.isha, ishaMin: m.ishaMin, asr: (+state.asr || 1), offsets: m.offsets || {} };
}

/* Время джумы «HH:MM» или '' — заданное пользователем либо из пресета */
export function jumuahFor(state) {
  if (state.jumuah !== null && state.jumuah !== undefined) return state.jumuah;
  const m = METHODS[state.method];
  return (m && m.jumuah) || '';
}

/* Все времена на дату (Date-объекты в локальном времени) */
export function timesFor(date, state) {
  const co = coordsFor(state), p = paramsFor(state);
  const t = toDates(computePrayerTimes(date, co.lat, co.lng, p), date, p.offsets);
  const j = jumuahFor(state);
  if (j) {
    const [h, m] = j.split(':').map(Number);
    t.jumuah = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0);
  }
  return t;
}

export const isFriday = d => d.getDay() === 5;

export const fmtTime = d => d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
export function hijri(d) {
  try {
    return new Intl.DateTimeFormat('ru-RU-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch (e) { return ''; }
}
