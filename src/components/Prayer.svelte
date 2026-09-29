<script>
  import { onMount } from 'svelte';
  import Brand from './Brand.svelte';
  import { CITIES, METHODS, PRAYER_KEYS, PRAYER_RU, DEFAULT_STATE, timesFor, coordsFor, jumuahFor, isFriday, fmtTime, hijri } from '../lib/prayer.js';
  import { load, save } from '../lib/storage.js';
  import { isNative, NOTIFY_PRAYERS, DEFAULT_NOTIFY, ensurePermission, reschedule } from '../lib/notify.js';

  let { active = false } = $props();

  const KEY = 'islamua_prayer';
  let st = $state(load(KEY, DEFAULT_STATE));
  let now = $state(new Date());
  let dayKey = $state('');
  let today = $state(null);
  let tomorrow = $state(null);
  let geoBusy = $state(false);

  /* Уведомления */
  const NKEY = 'islamua_notify';
  let nt = $state(load(NKEY, DEFAULT_NOTIFY));
  let notifyDenied = $state(false);
  function syncNotify() { save(NKEY, nt); reschedule(st, nt); }
  async function toggleNotify() {
    if (!nt.on) {
      const ok = await ensurePermission();
      if (!ok) { notifyDenied = true; return; }
      notifyDenied = false;
    }
    nt.on = !nt.on;
    syncNotify();
  }
  function togglePrayer(k) { nt.prayers[k] = !nt.prayers[k]; syncNotify(); }

  const coords = $derived(coordsFor(st));
  const jumuah = $derived(jumuahFor(st));
  const friday = $derived(isFriday(now));
  const methodName = $derived((METHODS[st.method] || METHODS.amu).name.replace(/\s*\(.*\)$/, ''));

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

  function compute() {
    const n = new Date();
    today = timesFor(n, st);
    const tm = new Date(n); tm.setDate(tm.getDate() + 1);
    tomorrow = timesFor(tm, st);
    dayKey = n.toDateString();
    now = n;
  }
  function tick() {
    const n = new Date();
    if (n.toDateString() !== dayKey) { compute(); return; }
    now = n;
  }
  function persist() { save(KEY, st); if (nt.on) reschedule(st, nt); }

  function askGeo() {
    const fallback = () => { st.city = '0'; geoBusy = false; persist(); compute(); };
    if (!navigator.geolocation) { fallback(); return; }
    geoBusy = true;
    navigator.geolocation.getCurrentPosition(
      pos => { st.geo = { lat: pos.coords.latitude, lng: pos.coords.longitude }; geoBusy = false; persist(); compute(); },
      fallback, { timeout: 8000 }
    );
  }
  function onCity() { persist(); if (st.city === 'geo') askGeo(); else compute(); }
  function onMethod() { persist(); compute(); }
  function onAsr() { persist(); compute(); }

  onMount(() => {
    if (st.city === 'geo' && !st.geo) askGeo(); else compute();
    const t = setInterval(tick, 1000);
    if (nt.on) reschedule(st, nt);
    const onVis = () => { if (document.visibilityState === 'visible') { tick(); if (nt.on) reschedule(st, nt); } };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  });
  $effect(() => { if (active && today) tick(); });
</script>

<Brand subtitle={`${coords.name} · ${st.method === 'amu' ? 'мечеть АМУ' : methodName}`} />

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

{#if isNative}
  <div class="sec">Уведомления</div>
  <div class="list">
    <label class="li toggle">
      <span>Уведомления о намазе</span>
      <input type="checkbox" checked={nt.on} onchange={toggleNotify}>
    </label>
    {#if nt.on}
      <div class="chips">
        {#each NOTIFY_PRAYERS as k}
          <button class="chip" class:on={nt.prayers[k]} onclick={() => togglePrayer(k)}>{PRAYER_RU[k]}</button>
        {/each}
      </div>
    {/if}
  </div>
  {#if notifyDenied}
    <div class="warn">Уведомления запрещены. Разрешите их: Настройки iPhone → Islam UA → Уведомления.</div>
  {/if}
{/if}

<div class="sec">Расчёт</div>
<div class="list">
  <label class="li">
    <span>Город</span>
    <select bind:value={st.city} onchange={onCity}>
      <option value="geo">Моё местоположение</option>
      {#each CITIES as c, i}<option value={String(i)}>{c.name}</option>{/each}
    </select>
  </label>
  <label class="li">
    <span>Метод</span>
    <select bind:value={st.method} onchange={onMethod}>
      {#each Object.entries(METHODS) as [k, m]}<option value={k}>{m.name}</option>{/each}
    </select>
  </label>
  <label class="li">
    <span>Аср</span>
    <select bind:value={st.asr} onchange={onAsr}>
      <option value="1">Стандарт</option>
      <option value="2">Ханафи</option>
    </select>
  </label>
</div>
<div class="note">
  {#if st.method === 'amu'}
    Расписание мечети Асоціації мусульман України (Киев, Нивки): метод ISNA с поправками мечети, джума в 13:30. Для другой мечети выберите её метод расчёта.
  {:else}
    Времена рассчитываются астрономически для выбранного города{geoBusy ? ' (определяем местоположение…)' : ''} и обновляются каждый день. Для точного соответствия расписанию вашей мечети выберите её метод расчёта.
  {/if}
</div>
