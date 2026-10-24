/* Аудио аятов — чтец Мишари Рашид аль-Афаси, потоково с CDN AlQuran Cloud (нужен интернет).
   Один общий плеер, очередь для диапазонов аятов (1:1-7 → семь файлов подряд). */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { SURAHS } from './daily';

const CDN = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/';
const FALLBACK = 'https://everyayah.com/data/Alafasy_128kbps/';

const START: number[] = []; // сквозной номер первого аята каждой суры
{ let n = 0; for (const s of SURAHS) { START.push(n); n += s.ay; } }

/* «2:255» / «1:1-7» → список URL по порядку */
export function ayahUrls(ref: string, fallback = false): string[] {
  const [s, v] = ref.split(':');
  const [a, b] = v.split('-').map(Number);
  const out: string[] = [];
  for (let x = a; x <= (b || a); x++) {
    out.push(fallback
      ? `${FALLBACK}${String(s).padStart(3, '0')}${String(x).padStart(3, '0')}.mp3`
      : `${CDN}${START[+s - 1] + x}.mp3`);
  }
  return out;
}

export type AudioState = 'loading' | 'playing' | 'ended' | 'error';
type Listener = (state: AudioState, ref: string | null) => void;

let player: AudioPlayer | null = null;
let queue: string[] = [], idx = 0, current: string | null = null, usedFallback = false, wasPlaying = false;
const listeners = new Set<Listener>();
const emit = (s: AudioState) => { for (const f of listeners) f(s, current); };

function getPlayer(): AudioPlayer {
  if (player) return player;
  setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {});
  player = createAudioPlayer(null, { updateInterval: 250 });
  player.addListener('playbackStatusUpdate', st => {
    if (st.didJustFinish) {
      idx++;
      if (idx < queue.length) { player!.replace({ uri: queue[idx] }); player!.play(); }
      else { current = null; wasPlaying = false; emit('ended'); }
      return;
    }
    if (st.playing && !wasPlaying) { wasPlaying = true; emit('playing'); }
    if (!st.playing && st.isBuffering && current) emit('loading');
  });
  return player;
}

/* Воспроизвести аят (или диапазон). Повторный вызов того же ref во время игры — остановка. */
export function playAyah(ref: string) {
  const p = getPlayer();
  if (current === ref && p.playing) { stopAyah(); return; }
  current = ref; usedFallback = false; queue = ayahUrls(ref); idx = 0; wasPlaying = false;
  emit('loading');
  try { p.replace({ uri: queue[0] }); p.play(); }
  catch {
    if (!usedFallback) { usedFallback = true; queue = ayahUrls(ref, true); try { p.replace({ uri: queue[0] }); p.play(); return; } catch { /* fallthrough */ } }
    current = null; emit('error');
  }
}
export function stopAyah() {
  if (player) { try { player.pause(); player.seekTo(0); } catch { /* ignore */ } }
  current = null; wasPlaying = false; emit('ended');
}
export const isPlaying = (ref: string) => !!player && current === ref && player.playing;
export const currentRef = () => current;
export function onAudio(fn: Listener) { listeners.add(fn); return () => { listeners.delete(fn); }; }
