<script>
  import Brand from './Brand.svelte';
  import { MODES, MODE_KEYS, idsOf, statsOf } from '../lib/quiz.js';
  import { overall, weekActivity, getName, setName } from '../lib/progress.js';

  let { onopen } = $props();

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
    <div class="pr"><span>{MODES[m].title}</span><div class="bar"><i style="width:{s.total ? s.learned / s.total * 100 : 0}%"></i></div><span class="n">{s.learned}/{s.total}</span></div>
  {/each}
</div></div>

<div class="sec">Настройки</div>
<div class="list">
  <button class="li" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);color:inherit;font:inherit;cursor:pointer;text-align:left" onclick={() => onopen('prayer')}>
    <span>Город, метод расчёта, уведомления</span><span class="val">Намаз</span>
  </button>
  <div class="li static"><span>Аккаунт</span><span class="val" style="opacity:.6">Скоро</span></div>
</div>
<div class="note">Прогресс хранится на этом устройстве. С появлением аккаунта он будет синхронизироваться между телефоном и сайтом.</div>
