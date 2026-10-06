/* Аудио аятов — чтец Мишари Рашид аль-Афаси, потоково с CDN AlQuran Cloud (нужен интернет).
   Один общий элемент <audio>, очередь для диапазонов аятов (1:1-7 → семь файлов подряд). */
import SURAHS from '../data/surahs.json';

const CDN = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/';
const FALLBACK = 'https://everyayah.com/data/Alafasy_128kbps/';

const START = []; // сквозной номер первого аята каждой суры
{ let n = 0; for (const s of SURAHS) { START.push(n); n += s.ay; } }

/* «2:255» / «1:1-7» → список URL по порядку */
export function ayahUrls(ref, fallback = false) {
  const [s, v] = ref.split(':');
  const [a, b] = v.split('-').map(Number);
  const out = [];
  for (let x = a; x <= (b || a); x++) {
    out.push(fallback
      ? `${FALLBACK}${String(s).padStart(3, '0')}${String(x).padStart(3, '0')}.mp3`
      : `${CDN}${START[+s - 1] + x}.mp3`);
  }
  return out;
}

const el = typeof Audio !== 'undefined' ? new Audio() : null;
if (el) el.preload = 'auto';
let queue = [], idx = 0, listeners = new Set(), current = null, usedFallback = false;
const emit = state => { for (const f of listeners) f(state); };

if (el) {
  el.addEventListener('ended', () => {
    idx++;
    if (idx < queue.length) { el.src = queue[idx]; el.play().catch(() => emit('error')); }
    else { current = null; emit('ended'); }
  });
  el.addEventListener('playing', () => emit('playing'));
  el.addEventListener('waiting', () => emit('loading'));
  el.addEventListener('error', () => {
    // CDN недоступен — пробуем запасной источник один раз
    if (!usedFallback && current) { usedFallback = true; queue = ayahUrls(current, true); el.src = queue[idx]; el.play().catch(() => emit('error')); return; }
    current = null; emit('error');
  });
}

/* Воспроизвести аят (или диапазон). Повторный вызов того же ref во время игры — остановка. */
export function playAyah(ref) {
  if (!el) return;
  if (current === ref && !el.paused) { stopAyah(); return; }
  current = ref; usedFallback = false; queue = ayahUrls(ref); idx = 0;
  el.src = queue[0];
  emit('loading');
  el.play().catch(() => { current = null; emit('error'); });
}
export function stopAyah() {
  if (!el) return;
  try { el.pause(); el.currentTime = 0; } catch (e) { /* ignore */ }
  current = null; emit('ended');
}
export const isPlaying = ref => !!el && current === ref && !el.paused;
export function onAudio(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/* Подгрузить первый файл заранее (следующий вопрос) */
export function preloadAyah(ref) {
  try { const a = new Audio(); a.preload = 'auto'; a.src = ayahUrls(ref)[0]; } catch (e) { /* ignore */ }
}
