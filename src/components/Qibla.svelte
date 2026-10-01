<script>
  /* Кибла: азимут на Каабу + компас. На iPhone компас включается по кнопке (нужно разрешение на датчики). */
  import { onMount } from 'svelte';
  import { qibla, compassDir } from '../lib/daily.js';

  let { lat, lng, place = '' } = $props();

  const q = $derived(qibla(lat, lng));
  const km = $derived(Math.round(q.km).toLocaleString('ru-RU'));

  let heading = $state(null);      // куда смотрит телефон, 0–360 (null — компас не включён)
  let supported = $state(false);   // есть ли датчики
  let needsTap = $state(false);    // iOS: требуется разрешение по нажатию
  let denied = $state(false);
  let listening = false;

  const onOrient = e => {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;           // iOS: истинный курс
    else if (e.absolute && typeof e.alpha === 'number') h = (360 - e.alpha) % 360;        // Android
    if (h !== null && !Number.isNaN(h)) heading = h;
  };
  function listen() {
    if (listening) return;
    listening = true;
    window.addEventListener('deviceorientationabsolute', onOrient, true);
    window.addEventListener('deviceorientation', onOrient, true);
  }
  async function enable() {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r !== 'granted') { denied = true; return; }
      }
      needsTap = false; denied = false; listen();
    } catch (e) { denied = true; }
  }
  onMount(() => {
    supported = typeof DeviceOrientationEvent !== 'undefined';
    if (!supported) return;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') needsTap = true;   // iOS 13+
    else listen();
    return () => { window.removeEventListener('deviceorientationabsolute', onOrient, true); window.removeEventListener('deviceorientation', onOrient, true); };
  });

  // поворот циферблата: север остаётся севером, когда телефон крутят
  const dial = $derived(heading === null ? 0 : -heading);
  const delta = $derived(heading === null ? null : ((q.bearing - heading + 540) % 360) - 180);  // −180…180
  const aligned = $derived(delta !== null && Math.abs(delta) <= 5);
</script>

<div class="qibla" class:aligned>
  <div class="qdial" style="transform: rotate({dial}deg)">
    <svg viewBox="0 0 200 200" class="qsvg">
      <circle cx="100" cy="100" r="96" class="rim"/>
      {#each Array(72) as _, i}
        <line x1="100" y1="6" x2="100" y2={i % 18 === 0 ? 18 : i % 6 === 0 ? 14 : 10} transform="rotate({i * 5} 100 100)" class:major={i % 18 === 0}/>
      {/each}
      <text x="100" y="36" class="n">С</text>
      <text x="168" y="106" class="l">В</text>
      <text x="100" y="172" class="l">Ю</text>
      <text x="32" y="106" class="l">З</text>
      <!-- метка Каабы на азимуте киблы -->
      <g transform="rotate({q.bearing} 100 100)">
        <line x1="100" y1="100" x2="100" y2="30" class="ray"/>
        <g transform="translate(100 24)">
          <rect x="-9" y="-9" width="18" height="18" rx="3" class="kaaba"/>
          <rect x="-9" y="-3" width="18" height="4" class="band"/>
        </g>
      </g>
      <circle cx="100" cy="100" r="5" class="hub"/>
    </svg>
  </div>
  <div class="qtop-mark"></div>

  <div class="qinfo">
    <div class="qdeg"><b>{Math.round(q.bearing)}°</b><span>{compassDir(q.bearing)}</span></div>
    <div class="qsub">
      {#if aligned}
        Вы смотрите в сторону Киблы
      {:else if heading !== null}
        Поверните {delta > 0 ? 'вправо' : 'влево'} на {Math.abs(Math.round(delta))}°
      {:else}
        {place ? `${place} · ` : ''}до Каабы {km} км
      {/if}
    </div>
    {#if needsTap}
      <button class="btn ghost small" onclick={enable}>Включить компас</button>
    {/if}
    {#if denied}
      <div class="warn">Нет доступа к компасу. Разрешите доступ к движению: Настройки → Islam UA.</div>
    {/if}
  </div>
</div>
