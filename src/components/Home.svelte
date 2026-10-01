<script>
  import { onMount } from 'svelte';
  import Brand from './Brand.svelte';
  import Qibla from './Qibla.svelte';
  import { METHODS, PRAYER_KEYS, PRAYER_RU, timesFor, coordsFor, jumuahFor, isFriday, fmtTime, hijri } from '../lib/prayer.js';
  import { prayer, applyNotify } from '../lib/settings.svelte.js';
  import { ayahOfDay, hadithOfDay, duaOfDay, nameOfDay, refLabel } from '../lib/daily.js';

  let { active = false, onsettings } = $props();

  let now = $state(new Date());
  let dayKey = $state('');
  let today = $state(null);
  let tomorrow = $state(null);

  const coords = $derived(coordsFor(prayer));
  const jumuah = $derived(jumuahFor(prayer));
  const friday = $derived(isFriday(now));
  const methodName = $derived((METHODS[prayer.method] || METHODS.amu).name.replace(/\s*\(.*\)$/, ''));

  /* Порядок событий дня: по пятницам джума встаёт между зухром и асром */
  const sequence = $derived.by(() => {
    const seq = [...PRAYER_KEYS];
    if (friday && today && today.jumuah) seq.splice(seq.indexOf('asr'), 0, 'jumuah');
    return seq;
  });

  const status = $derived.by(() => {
    if (!today) return { cur: null, next: 'fajr', at: null };
    let cur = null, next = null;
    for (const k of sequence) { if (today[k] <= now) cur = k; else if (!next) next = k; }
    if (next) return { cur, next, at: today[next] };
    return { cur, next: 'fajr', at: tomorrow.fajr };
  });
  // жёлтое выделение стоит на ячейке следующего намаза (джума — отдельная строка, выделение остаётся на зухре)
  const highlighted = $derived(status.next === 'jumuah' ? 'dhuhr' : status.next);
  const sliderIdx = $derived(Math.max(0, PRAYER_KEYS.indexOf(highlighted)));

  const countdown = $derived.by(() => {
    if (!status.at) return '--:--:--';
    const s = Math.max(0, Math.floor((status.at - now) / 1000));
    const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return hh + ':' + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  });

  const dateLine = $derived(now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }));
  const hijriLine = $derived(hijri(now));

  /* Контент дня — меняется в полночь вместе с dayKey */
  const ayah = $derived((dayKey, ayahOfDay()));
  const hadith = $derived((dayKey, hadithOfDay()));
  const dua = $derived((dayKey, duaOfDay()));
  const name = $derived((dayKey, nameOfDay()));

  function compute() {
    const n = new Date();
    today = timesFor(n, prayer);
    const tm = new Date(n); tm.setDate(tm.getDate() + 1);
    tomorrow = timesFor(tm, prayer);
    dayKey = n.toDateString();
    now = n;
  }
  function tick() {
    const n = new Date();
    if (n.toDateString() !== dayKey) { compute(); return; }
    now = n;
  }
  // пересчёт при смене города / метода / аср из Профиля
  $effect(() => { prayer.city; prayer.method; prayer.asr; prayer.geo; compute(); });

  onMount(() => {
    const t = setInterval(tick, 1000);
    applyNotify();
    const onVis = () => { if (document.visibilityState === 'visible') { tick(); applyNotify(); } };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  });
  $effect(() => { if (active && today) tick(); });

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  async function share(text) {
    try { await navigator.share({ text }); } catch (e) { /* отменено */ }
  }
</script>

<div class="homehead">
  <Brand subtitle={`${coords.name} · ${prayer.method === 'amu' ? 'мечеть АМУ' : methodName}`} />
  <button class="iconbtn plain gear" onclick={onsettings} aria-label="Настройки намаза">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
  </button>
</div>

<div class="pnext">
  <div><small>Следующий намаз</small><b>{PRAYER_RU[status.next]} · {countdown}</b></div>
  <div class="date">{dateLine}{#if hijriLine}<br>{hijriLine}{/if}</div>
</div>

<div class="prow">
  <div class="slider" style="left: calc(6px + {sliderIdx} * ((100% - 12px - 20px) / 6 + 4px))"></div>
  {#each PRAYER_KEYS as k}
    <div class="pcell" class:cur={status.cur === k} class:upcoming={highlighted === k}>
      <div class="ic {k}"></div>
      <div class="nm">{PRAYER_RU[k]}</div>
      <div class="tm">{today ? fmtTime(today[k]) : '--:--'}</div>
    </div>
  {/each}
</div>

{#if jumuah}
  <div class="pjumua" class:today={friday}>
    <div class="jn"><b>Джума</b> · пятничная молитва{friday ? ' · сегодня' : ''}</div>
    <div class="jt">{jumuah}</div>
  </div>
{/if}

<!-- ---------- Контент дня ---------- -->
{#if ayah}
<section class="dcard">
  <header>
    <span class="dlabel"><i class="dot"></i>Аят дня</span>
    {#if canShare}<button class="share" aria-label="Поделиться" onclick={() => share(`${ayah.ar}\n\n${ayah.ru}\n— Коран, ${refLabel(ayah.ref)}`)}><svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"/></svg></button>{/if}
  </header>
  <div class="d-ar">{ayah.ar}</div>
  <div class="d-tl">{ayah.tl}</div>
  <div class="d-ru">{ayah.ru}</div>
  <div class="d-src">Коран, {refLabel(ayah.ref)}</div>
</section>
{/if}

{#if hadith}
<section class="dcard">
  <header>
    <span class="dlabel"><i class="dot"></i>Хадис дня</span>
    {#if canShare}<button class="share" aria-label="Поделиться" onclick={() => share(`Посланник Аллаха ﷺ сказал:\n${hadith.ar}\n\n«${hadith.ru}»\n— ${hadith.src}`)}><svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"/></svg></button>{/if}
  </header>
  <div class="d-intro">Посланник Аллаха ﷺ сказал:</div>
  <div class="d-ar">{hadith.ar}</div>
  <div class="d-ru">«{hadith.ru}»</div>
  <div class="d-src">{hadith.src}</div>
</section>
{/if}

{#if dua}
<section class="dcard">
  <header>
    <span class="dlabel"><i class="dot"></i>Дуа дня</span>
    {#if canShare}<button class="share" aria-label="Поделиться" onclick={() => share(`${dua.t}\n${dua.ar}\n\n${dua.tl}\n\n${dua.ru}\n— ${dua.src}`)}><svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"/></svg></button>{/if}
  </header>
  <div class="d-title">{dua.t}</div>
  <div class="d-ar">{dua.ar}</div>
  <div class="d-tl">{dua.tl}</div>
  <div class="d-ru">{dua.ru}</div>
  <div class="d-src">{dua.src}</div>
</section>
{/if}

{#if name}
<section class="dcard">
  <header><span class="dlabel"><i class="dot"></i>Имя Аллаха дня</span></header>
  <div class="d-ar big">{name.ar}</div>
  <div class="d-name">{name.ru} <span class="lat">· {name.lat}</span></div>
  <div class="d-title center">{name.tr}</div>
  <div class="d-ru">{name.info}</div>
</section>
{/if}

<section class="dcard">
  <header><span class="dlabel"><i class="dot"></i>Кибла</span></header>
  <Qibla lat={coords.lat} lng={coords.lng} place={coords.name} />
</section>
