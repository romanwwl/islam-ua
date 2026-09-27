<script>
  import { onMount } from 'svelte';
  import { CITIES, METHODS, PRAYER_KEYS, PRAYER_RU, DEFAULT_STATE, timesFor, coordsFor, jumuahFor, isFriday, fmtTime, hijri } from '../lib/prayer.js';
  import { load, save } from '../lib/storage.js';

  let { active = false } = $props();

  const KEY = 'islamua_prayer';
  let st = $state(load(KEY, DEFAULT_STATE));
  let now = $state(new Date());
  let dayKey = $state('');
  let today = $state(null);
  let tomorrow = $state(null);
  let geoBusy = $state(false);

  const coords = $derived(coordsFor(st));
  const jumuah = $derived(jumuahFor(st));
  const friday = $derived(isFriday(now));

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

  const countdown = $derived.by(() => {
    if (!status.at) return '--:--:--';
    const s = Math.max(0, Math.floor((status.at - now) / 1000));
    const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return hh + ':' + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  });

  const dateLine = $derived.by(() => {
    const h = hijri(now);
    return now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) + (h ? ' · ' + h : '');
  });

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

  function persist() { save(KEY, st); }

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
  function onMethod() {
    // при смене пресета джума берётся из него, если пользователь не задавал свою
    persist(); compute();
  }
  function onAsr() { persist(); compute(); }
  function onJumuah(e) {
    const v = e.target.value;
    st.jumuah = v; // '' = без джумы
    persist(); compute();
  }
  function resetJumuah() { st.jumuah = null; persist(); compute(); }

  onMount(() => {
    if (st.city === 'geo' && !st.geo) askGeo(); else compute();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  });

  // при возврате на экран пересчитать (день мог смениться, пока экран был скрыт)
  $effect(() => { if (active && today) tick(); });
</script>

<div class="prayer">
  <div class="ptop">
    <div class="pnext"><small>Следующий намаз</small><span>{PRAYER_RU[status.next]}</span> · <span>{countdown}</span></div>
    <div class="pmoon">☾</div>
  </div>

  <div class="prow">
    {#each PRAYER_KEYS as k}
      <div class="pcell" class:cur={status.cur === k} class:next={status.next === k}>
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

  <div class="pfoot"><span>{dateLine}</span><span>{geoBusy ? 'Определяем…' : coords.name}</span></div>

  <div class="psettings">
    <select class="full" bind:value={st.city} onchange={onCity}>
      <option value="geo">Моё местоположение (GPS)</option>
      {#each CITIES as c, i}<option value={String(i)}>{c.name}</option>{/each}
    </select>
    <select class="full" bind:value={st.method} onchange={onMethod}>
      {#each Object.entries(METHODS) as [k, m]}<option value={k}>{m.name}</option>{/each}
    </select>
    <select bind:value={st.asr} onchange={onAsr}>
      <option value="1">Аср: стандарт</option>
      <option value="2">Аср: ханафи</option>
    </select>
    <label class="field">
      <span>Джума</span>
      <input type="time" value={jumuah} onchange={onJumuah}>
      {#if st.jumuah !== null && st.jumuah !== undefined}
        <button type="button" class="hint-btn" style="margin:0;padding:3px 9px;font-size:11px" onclick={resetJumuah} title="Вернуть значение пресета">↺</button>
      {/if}
    </label>
  </div>

  <div class="pnote">
    {#if st.method === 'amu'}
      Расписание мечети Асоціації мусульман України (Киев, Нивки): метод ISNA с поправками мечети. Джума — 13:30. Для других мечетей выберите свой метод расчёта и укажите время джумы.
    {:else}
      Времена рассчитываются астрономически для выбранного города и обновляются автоматически каждый день. Для точного соответствия расписанию вашей мечети выберите её метод расчёта и укажите время джумы.
    {/if}
  </div>
</div>
