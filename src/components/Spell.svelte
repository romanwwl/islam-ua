<script>
  /* «Собери слово»: по переводу и транскрипции собрать слово из плиток с буквами (плюс 3 похожие лишние). */
  import { fly } from 'svelte/transition';
  import { MODES } from '../lib/quiz.js';
  import { tilesFor } from '../lib/spelling.js';
  import { pickDeck, record } from '../lib/progress.js';
  import { hapticCorrect, hapticWrong } from '../lib/haptics.js';

  let { onclose, onanswer } = $props();

  const cfg = MODES.spell;
  let deck = $state(pickDeck('spell', cfg.data, cfg.id, cfg.round));
  let pos = $state(0);
  let built = $state([]);          // индексы выбранных плиток по порядку
  let state = $state('build');     // build | ok | wrong
  let tries = $state(0);
  let results = $state([]);        // true/false по вопросам
  let finished = $state(false);
  let shake = $state(false);

  const w = $derived(deck[pos]);
  const tiles = $derived(w ? tilesFor(w) : []);
  const word = $derived(built.map(i => tiles[i]).join(''));
  const target = $derived(w ? w.sk : '');
  const score = $derived(results.filter(Boolean).length);

  function tap(i) {
    if (state !== 'build' || built.includes(i)) return;
    built = [...built, i];
    if (word.length === target.length) check();
  }
  function undo() { if (state === 'build') built = built.slice(0, -1); }
  function check() {
    if (word === target) {
      state = 'ok'; hapticCorrect();
      results[pos] = tries === 0; record('spell', w.ar, tries === 0); onanswer?.();
    } else {
      state = 'wrong'; tries++; hapticWrong(); shake = true; setTimeout(() => shake = false, 400);
      if (tries === 1) { results[pos] = false; record('spell', w.ar, false); onanswer?.(); }
    }
  }
  function retry() { built = []; state = 'build'; }
  function next() {
    if (pos + 1 >= deck.length) { finished = true; return; }
    pos++; built = []; state = 'build'; tries = 0;
  }
  function restart() { deck = pickDeck('spell', cfg.data, cfg.id, cfg.round); pos = 0; built = []; state = 'build'; tries = 0; results = []; finished = false; }
</script>

<div class="qtop noback">
  <div class="qtitle"><b>Собери слово</b><span>{finished ? deck.length : pos + 1} / {deck.length}</span></div>
  <button class="iconbtn plain" onclick={onclose} aria-label="Закрыть">
    <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
  </button>
</div>
<div class="bar qbar"><i style="width:{(finished ? deck.length : pos) / deck.length * 100}%"></i></div>

{#if !finished && w}
  {#key pos}
  <div class="card sp-card {state === 'ok' ? 'correct' : state === 'wrong' ? 'wrong' : ''}" in:fly={{ y: 10, duration: 220 }}>
    <div class="sp-prompt"><b>{w.tr}</b><span>{w.ru}</span></div>
    <div class="sp-word" class:shake class:empty={!word}>
      {#if state === 'ok'}<span class="ok">{w.ar}</span>{:else}{word || '…'}{/if}
    </div>
    <div class="sp-sub">
      {#if state === 'ok'}Верно!{:else if state === 'wrong'}Не так — попробуйте ещё раз{:else}{word.length} из {target.length} букв{/if}
    </div>
  </div>

  <div class="tiles">
    {#each tiles as t, i}
      <button class="tile" class:used={built.includes(i)} disabled={built.includes(i) || state !== 'build'} onclick={() => tap(i)}>{t}</button>
    {/each}
  </div>

  <div class="nextrow">
    <button class="iconbtn back" onclick={undo} disabled={!built.length || state !== 'build'} aria-label="Стереть букву">
      <svg viewBox="0 0 24 24"><path d="M21 6H8l-5 6 5 6h13z"/><path d="M15 9l-4 6M11 9l4 6"/></svg>
    </button>
    {#if state === 'ok'}
      <button class="next" onclick={next}>{pos + 1 >= deck.length ? 'Результат →' : 'Дальше →'}</button>
    {:else if state === 'wrong'}
      <button class="next" onclick={retry}>Ещё раз</button>
    {:else}
      <button class="next hidden" tabindex="-1" aria-hidden="true">Дальше →</button>
    {/if}
  </div>
  {/key}

  <div class="stats">
    <div class="stat"><b>{score}</b><span>верно</span></div>
    <div class="stat"><b>{results.length ? Math.round(score / results.length * 100) + '%' : '—'}</b><span>точность</span></div>
    <div class="stat"><b>{deck.length - pos - (state === 'ok' ? 1 : 0)}</b><span>осталось</span></div>
  </div>
  <div class="controls"><button class="linkbtn" onclick={restart}>Начать заново</button></div>
{:else if finished}
  <div class="result">
    <div class="rbig">{Math.round(score / deck.length * 100)}%</div>
    <div class="rmsg">{score === deck.length ? 'Все слова собраны!' : score >= deck.length * 0.7 ? 'Хорошо!' : 'Есть куда расти'}</div>
    <div class="rline">Собрано с первой попытки {score} из {deck.length}</div>
    <div class="rbtns">
      <button class="btn" onclick={restart}>Ещё раунд</button>
      <button class="btn ghost" onclick={onclose}>К разделам</button>
    </div>
  </div>
{/if}
