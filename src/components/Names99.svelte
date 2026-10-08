<script>
  /* Тривиа «99 имён»: одно поле ввода, 99 закреплённых ячеек. Имя принимается по-арабски,
     по-русски (значение) или транскрипцией. Нажатие на закрытую ячейку — подсказка. */
  import { fly } from 'svelte/transition';
  import NAMES from '../data/names.json';
  import { matchName, loadState, saveState } from '../lib/names99.js';
  import { hapticCorrect, hapticWrong } from '../lib/haptics.js';

  let { onclose } = $props();

  const st = loadState();
  let revealed = $state(new Set(st.revealed));
  let hinted = $state(new Set(st.hinted));
  let gaveUp = $state(st.gaveUp);
  let best = $state(st.best || 0);
  let input = $state('');
  let shake = $state(false);
  let lastHit = $state(-1);
  let inputEl = $state(null);

  const found = $derived(revealed.size - hinted.size);   // названы сами, без подсказок
  const done = $derived(revealed.size >= NAMES.length || gaveUp);

  function persist() {
    if (found > best) best = found;
    saveState({ revealed: [...revealed], hinted: [...hinted], gaveUp, best });
  }
  function submit() {
    const i = matchName(input, revealed);
    if (i < 0) { if (input.trim().length >= 2) { shake = true; hapticWrong(); setTimeout(() => shake = false, 400); } return; }
    revealed = new Set([...revealed, i]); lastHit = i; input = '';
    hapticCorrect(); persist();
    queueMicrotask(() => document.getElementById('n99-' + i)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }
  function onInput() {
    // открываем сразу, как только набранное совпало (без Enter)
    const i = matchName(input, revealed);
    if (i >= 0) submit();
  }
  function hint(i) {
    if (revealed.has(i) || done) return;
    revealed = new Set([...revealed, i]); hinted = new Set([...hinted, i]); persist();
  }
  function giveUp() { gaveUp = true; persist(); }
  function restart() { revealed = new Set(); hinted = new Set(); gaveUp = false; input = ''; lastHit = -1; persist(); inputEl?.focus(); }
  const cellState = i => revealed.has(i) ? (hinted.has(i) ? 'hint' : 'ok') : (gaveUp ? 'miss' : '');
</script>

<div class="qtop noback">
  <div class="qtitle"><b>99 имён</b><span>{found} / {NAMES.length}</span></div>
  <button class="iconbtn plain" onclick={onclose} aria-label="Закрыть">
    <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
  </button>
</div>
<div class="bar qbar"><i style="width:{revealed.size / NAMES.length * 100}%"></i></div>

{#if !done}
  <form class="n99form" class:shake onsubmit={e => { e.preventDefault(); submit(); }}>
    <input bind:this={inputEl} bind:value={input} oninput={onInput} type="text" placeholder="Напишите имя…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done">
    <button type="submit" aria-label="Проверить"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
  </form>
  <div class="n99hint">По-арабски, по-русски или транскрипцией — «Ар-Рахман», «Милостивый», الرحمن. Нажмите на ячейку, чтобы подсмотреть.</div>
{:else}
  <div class="n99done" in:fly={{ y: 10, duration: 250 }}>
    <b>{gaveUp && revealed.size < NAMES.length ? `Названо ${found} из 99` : 'Все 99 имён — машаАллах!'}</b>
    {#if hinted.size}<small>С подсказкой: {hinted.size}</small>{/if}
    {#if best}<small>Лучший результат: {best}</small>{/if}
  </div>
{/if}

<div class="n99grid">
  {#each NAMES as n, i}
    {@const s = cellState(i)}
    <button id="n99-{i}" class="n99cell {s}" class:pop={lastHit === i} onclick={() => hint(i)} disabled={!!s}>
      <span class="num">{i + 1}</span>
      {#if s}
        <span class="ar">{n.ar}</span>
        <span class="ru">{n.ru}</span>
      {/if}
    </button>
  {/each}
</div>

<div class="controls n99ctl">
  {#if !done}<button class="linkbtn" onclick={giveUp}>Показать все</button>{/if}
  <button class="linkbtn" onclick={restart}>Начать заново</button>
</div>
