<script>
  /* Расписание субботних уроков в мечети АМУ: группы → лента уроков. По субботам подсвечивается текущий урок. */
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import S from '../data/schedule.json';
  import { load, save } from '../lib/storage.js';

  let { onclose } = $props();

  let group = $state(load('islamua_sched', { g: 'kids' }).g);
  let now = $state(new Date());
  onMount(() => { const t = setInterval(() => now = new Date(), 30000); return () => clearInterval(t); });

  const g = $derived(S.groups.find(x => x.id === group) || S.groups[0]);
  const blocks = $derived(g.blocks || [{ lessons: g.lessons }]);
  const saturday = $derived(now.getDay() === S.day);
  const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const cur = $derived(now.getHours() * 60 + now.getMinutes());
  const live = l => saturday && l.to && cur >= mins(l.from) && cur < mins(l.to);
  const past = l => saturday && l.to && cur >= mins(l.to);

  function pick(id) { group = id; save('islamua_sched', { g: id }); }
  const mapUrl = `https://maps.apple.com/?q=${encodeURIComponent(S.mapQuery)}`;
</script>

<div class="qtop noback">
  <div class="qtitle"><b>{S.title}</b><span>каждую субботу</span></div>
  <button class="iconbtn plain" onclick={onclose} aria-label="Закрыть">
    <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
  </button>
</div>

<div class="chips seg">
  {#each S.groups as x}
    <button class="chip" class:on={x.id === group} onclick={() => pick(x.id)}>{x.title}</button>
  {/each}
</div>

{#key group}
<div in:fly={{ y: 12, duration: 220 }}>
  {#if g.sub}<div class="sched-sub">{g.title} · {g.sub}</div>{/if}
  {#each blocks as b}
    {#if b.title}<div class="sec">{b.title}</div>{/if}
    <div class="sched">
      {#each b.lessons as l}
        <div class="lesson" class:break={l.type === 'break'} class:live={live(l)} class:past={past(l)}>
          <div class="when"><b>{l.from}</b>{#if l.to}<span>{l.to}</span>{/if}</div>
          <div class="what">
            <b>{l.title}{#if l.note}<i>&nbsp;· {l.note}</i>{/if}</b>
            {#if l.book}<small>по книге «{l.book}»</small>{/if}
            {#if l.who}<small class="who">{l.who}</small>{/if}
          </div>
          {#if live(l)}<span class="livedot" title="Идёт сейчас"></span>{/if}
        </div>
      {/each}
    </div>
  {/each}
</div>
{/key}

<a class="place" href={mapUrl} target="_blank" rel="noopener">
  <svg viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
  <span><b>{S.address}</b><small>{S.metro} · открыть в картах</small></span>
</a>
