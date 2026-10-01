<script>
  import Brand from './Brand.svelte';
  import { MODES, MODE_KEYS, idsOf, statsOf } from '../lib/quiz.js';
  import { overall, weekActivity, getName, setName } from '../lib/progress.js';
  import { CITIES, METHODS, PRAYER_RU } from '../lib/prayer.js';
  import { isNative, NOTIFY_PRAYERS, ensurePermission } from '../lib/notify.js';
  import { prayer, notify, savePrayer, saveNotify } from '../lib/settings.svelte.js';

  /* Намаз: город / метод / аср */
  let geoBusy = $state(false);
  function askGeo() {
    const fallback = () => { prayer.city = '0'; geoBusy = false; savePrayer(); };
    if (!navigator.geolocation) { fallback(); return; }
    geoBusy = true;
    navigator.geolocation.getCurrentPosition(
      pos => { prayer.geo = { lat: pos.coords.latitude, lng: pos.coords.longitude }; geoBusy = false; savePrayer(); },
      fallback, { timeout: 8000 }
    );
  }
  function onCity() { if (prayer.city === 'geo') askGeo(); else savePrayer(); }

  /* Уведомления */
  let notifyDenied = $state(false);
  async function toggleNotify() {
    if (!notify.on) {
      const ok = await ensurePermission();
      if (!ok) { notifyDenied = true; return; }
      notifyDenied = false;
    }
    notify.on = !notify.on;
    saveNotify();
  }
  function togglePrayer(k) { notify.prayers[k] = !notify.prayers[k]; saveNotify(); }

  let name = $state(getName());
  const initial = $derived((name || 'И').trim().charAt(0).toUpperCase());
  const modesIds = {}; for (const m of MODE_KEYS) modesIds[m] = idsOf(m);
  const o = overall(modesIds);
  const week = weekActivity();
  const since = new Date(o.since).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const daysWord = n => (n % 10 === 1 && n % 100 !== 11) ? 'день подряд' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'дня подряд' : 'дней подряд';
  function saveName() { setName(name); name = getName(); }
</script>

<Brand subtitle="Профиль" />

<div class="avatar">
  <div class="a">{initial}</div>
  <div class="who">
    <input id="profileName" type="text" placeholder="Как вас зовут?" bind:value={name} onblur={saveName} onkeydown={e => e.key === 'Enter' && e.target.blur()} maxlength="30" autocomplete="off">
    <small>С нами с {since}</small>
  </div>
</div>

<div class="pstats">
  <div class="stat"><b>{o.streak}</b><span>{daysWord(o.streak)}</span></div>
  <div class="stat"><b>{o.learned}</b><span>выучено</span></div>
  <div class="stat"><b>{o.accuracy === null ? '—' : o.accuracy + '%'}</b><span>точность</span></div>
</div>
<div class="week">
  {#each week as d}
    <div class="day" class:done={d.done} class:today={d.today} class:future={d.future}><i></i>{d.label}</div>
  {/each}
</div>

<div class="sec">Прогресс</div>
<div class="list"><div class="prog">
  {#each MODE_KEYS as m}
    {@const s = statsOf(m)}
    <div class="pr"><span>{MODES[m].title}</span><div class="bar"><i class="soft" style="width:{s.total ? (s.learned + s.learning) / s.total * 100 : 0}%"></i><i style="width:{s.total ? s.learned / s.total * 100 : 0}%"></i></div><span class="n">{s.learned}/{s.total}</span></div>
  {/each}
</div></div>

<div class="sec">Намаз</div>
<div class="list">
  <label class="li">
    <span>Город</span>
    <select bind:value={prayer.city} onchange={onCity}>
      <option value="geo">Моё местоположение</option>
      {#each CITIES as c, i}<option value={String(i)}>{c.name}</option>{/each}
    </select>
  </label>
  <label class="li">
    <span>Метод</span>
    <select bind:value={prayer.method} onchange={savePrayer}>
      {#each Object.entries(METHODS) as [k, m]}<option value={k}>{m.name}</option>{/each}
    </select>
  </label>
  <label class="li">
    <span>Аср</span>
    <select bind:value={prayer.asr} onchange={savePrayer}>
      <option value="1">Стандарт</option>
      <option value="2">Ханафи</option>
    </select>
  </label>
</div>
<div class="note">
  {#if prayer.method === 'amu'}
    Расписание мечети Асоціації мусульман України (Киев, Нивки): метод ISNA 15°, джума в 13:30. Для другой мечети выберите её метод расчёта.
  {:else}
    Времена рассчитываются астрономически для выбранного города{geoBusy ? ' (определяем местоположение…)' : ''}. Для точного соответствия расписанию вашей мечети выберите её метод расчёта.
  {/if}
</div>

{#if isNative}
  <div class="sec">Уведомления</div>
  <div class="list">
    <label class="li toggle">
      <span>Уведомления о намазе</span>
      <input type="checkbox" checked={notify.on} onchange={toggleNotify}>
    </label>
    {#if notify.on}
      <div class="chips">
        {#each NOTIFY_PRAYERS as k}
          <button class="chip" class:on={notify.prayers[k]} onclick={() => togglePrayer(k)}>{PRAYER_RU[k]}</button>
        {/each}
      </div>
    {/if}
  </div>
  {#if notifyDenied}
    <div class="warn">Уведомления запрещены. Разрешите их: Настройки iPhone → Islam UA → Уведомления.</div>
  {/if}
{/if}

<div class="sec">Аккаунт</div>
<div class="list">
  <div class="li static"><span>Вход и синхронизация</span><span class="val" style="opacity:.6">Скоро</span></div>
</div>
<div class="note">Прогресс хранится на этом устройстве. С появлением аккаунта он будет синхронизироваться между телефоном и сайтом.</div>
