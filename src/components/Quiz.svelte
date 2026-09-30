<script>
  import { MODES, NONCONNECT, displayForm, letterForms, highlightWord, ayatWord, buildOptions, buildDeck, resultMessage, surahName, saveSession, clearSession } from '../lib/quiz.js';
  import { untrack } from 'svelte';
  import { record } from '../lib/progress.js';

  let { session, onclose, onanswer } = $props();

  // eslint-disable-next-line svelte/valid-compile
  const init = untrack(() => session.resume || null);   // восстановленная сессия, если есть
  let deck = $state(untrack(() => init ? init.deck : session.deck));   // [{mode, item}]
  let pos = $state(init ? init.pos : 0);
  let optsCache = $state(init ? init.optsCache : []);
  let answers = $state(init ? init.answers : []);
  let hints = $state(init ? init.hints : []);
  let finished = $state(false);
  let formsMode = $state(false);
  let playing = $state(false);
  let nextBtn = $state(null), restartBtn = $state(null);

  const entry = $derived(deck[pos] ?? null);
  const mode = $derived(entry?.mode ?? session.mode ?? 'alphabet');
  const current = $derived(entry?.item ?? null);
  const cfg = $derived(MODES[mode]);
  const label = (m, it) => MODES[m].label(it);
  const options = $derived(optsCache[pos] ?? []);
  const chosen = $derived(answers[pos] ?? null);
  const answered = $derived(chosen !== null);
  const hintOpen = $derived(!!hints[pos]);
  const correctLabel = $derived(current ? label(mode, current) : '');
  const isCorrect = i => answers[i] != null && label(deck[i].mode, answers[i]) === label(deck[i].mode, deck[i].item);
  const total = $derived(answers.filter(a => a != null).length);
  const score = $derived(deck.reduce((n, _, i) => n + (isCorrect(i) ? 1 : 0), 0));
  const streak = $derived.by(() => { let k = 0; for (let i = total - 1; i >= 0; i--) { if (isCorrect(i)) k++; else break; } return k; });
  const mistakes = $derived(deck.reduce((n, _, i) => n + (answers[i] != null && !isCorrect(i) ? 1 : 0), 0));
  const allAnswered = $derived(deck.length > 0 && total === deck.length);
  const accuracy = $derived(total ? Math.round(score / total * 100) + '%' : '—');
  const progress = $derived(deck.length ? Math.min(total / deck.length * 100, 100) : 0);
  const pct = $derived(deck.length ? Math.round(score / deck.length * 100) : 0);
  const cardState = $derived(!answered ? '' : (label(mode, chosen) === correctLabel ? 'correct' : 'wrong'));
  const glyph = $derived(current && mode === 'alphabet' ? displayForm(current.c, formsMode) : '');

  function persist() {
    if (finished) { clearSession(session); return; }
    saveSession(session, { deck, optsCache, answers, hints, pos });
  }
  function goTo(i) {
    pos = i;
    if (!optsCache[i]) optsCache[i] = buildOptions(deck[i].mode, deck[i].item);
    persist();
  }
  function next() {
    if (pos + 1 >= deck.length) {
      if (allAnswered) { finished = true; clearSession(session); queueMicrotask(() => restartBtn?.focus()); }
      return;
    }
    goTo(pos + 1);
  }
  function back() { if (pos > 0) goTo(pos - 1); }
  function review() {
    finished = false;
    const first = deck.findIndex((_, i) => answers[i] != null && !isCorrect(i));
    goTo(first >= 0 ? first : 0);
  }
  function restart() {
    // новый раунд того же раздела (или повтор тех же элементов для смешанного повторения)
    deck = session.mode ? buildDeck(session.mode) : [...deck].sort(() => Math.random() - 0.5);
    reset();
  }
  function reset() { optsCache = []; answers = []; hints = []; finished = false; clearSession(session); goTo(0); }
  // начать этот раздел заново (новая колода)
  function startOver() { deck = session.mode ? buildDeck(session.mode) : [...deck].sort(() => Math.random() - 0.5); reset(); }
  function choose(opt) {
    if (answered) return;
    answers[pos] = opt;
    const ok = label(mode, opt) === correctLabel;
    record(mode, cfg.id(current), ok);
    persist();
    onanswer?.();
    queueMicrotask(() => nextBtn?.focus());
  }

  const refLabel = w => { const [s, a] = w.ref.split(':'); return `Сура ${s} «${surahName(+s)}», аят ${a}`; };
  function optClass(o) {
    if (!answered) return '';
    if (label(mode, o) === correctLabel) return 'correct';
    if (o === chosen) return 'wrong';
    return 'dim';
  }

  /* ---- Аудио букв ---- */
  const audioEl = typeof Audio !== 'undefined' ? new Audio() : null;
  if (audioEl) { audioEl.onended = () => playing = false; audioEl.onpause = () => playing = false; }
  function play() {
    if (mode !== 'alphabet' || !current?.audio || !audioEl) return;
    try { audioEl.pause(); audioEl.src = current.audio; audioEl.currentTime = 0; audioEl.play(); playing = true; } catch (e) { /* ignore */ }
  }

  /* ---- Клавиатура (веб) ---- */
  function onKey(e) {
    if (finished) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); restart(); } return; }
    if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); back(); return; }
    if (e.key === 'Escape') { onclose(); return; }
    if (!answered && ['1', '2', '3', '4'].includes(e.key)) { const o = options[+e.key - 1]; if (o) choose(o); }
    else if (answered && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) { e.preventDefault(); next(); }
  }

  goTo(init ? init.pos : 0);
</script>

<svelte:window onkeydown={onKey} />

<div class="qtop">
  <button class="iconbtn" onclick={back} disabled={pos === 0 || finished} aria-label="Назад">
    <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>
  </button>
  <div class="qtitle"><b>{session.title}{session.mode === null && entry ? ` · ${MODES[mode].title}` : ''}</b><span>{finished ? deck.length : pos + 1} / {deck.length}</span></div>
  <button class="iconbtn plain" onclick={onclose} aria-label="Закрыть">
    <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
  </button>
</div>
<div class="bar qbar"><i style="width:{progress}%"></i></div>

{#if !finished && current}
  {#key pos}
  <div class="card {cardState}">
    {#if mode === 'alphabet'}
      <div class="glyph" style="cursor:pointer" onclick={play} role="button" tabindex="-1" onkeydown={() => {}}>{glyph}</div>
    {:else if mode === 'surah'}
      <div class="glyph num">{current.n}</div>
      <div class="translit">Сура № {current.n} из 114</div>
    {:else if mode === 'sira'}
      <div class="glyph question">{current.q}</div>
    {:else if mode === 'names'}
      <div class="glyph name">{current.ar}</div>
      <div class="translit">{current.ru}&nbsp;&nbsp;·&nbsp;&nbsp;<span class="lat">{current.lat}</span></div>
    {:else}
      <div class="glyph name">{current.ar}</div>
      <div class="translit">{current.ru}</div>
    {/if}

    {#if mode === 'alphabet'}
      <button class="play-btn" class:playing onclick={play}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 9 3 15 7 15 12 20 12 4 7 9 3 9" fill="currentColor" stroke="none"></polygon><path d="M16 8.5a4 4 0 0 1 0 7"></path><path d="M19 6a7 7 0 0 1 0 12"></path></svg>
        Слушать
      </button>
    {/if}
    {#if mode === 'surah'}
      {#if hintOpen}
        <div class="hint-box">{current.t} сура · {current.ay} {ayatWord(current.ay)} · {current.hint}</div>
      {:else if !answered}
        <button class="hint-btn" onclick={() => { hints[pos] = true; persist(); }}>Подсказка</button>
      {/if}
    {/if}
  </div>

  {#if mode === 'alphabet'}
    <div class="card-forms">
      <div class="flabel">Формы буквы</div>
      <div class="forms">
        {#each letterForms(current.c) as f}
          <div class="form-cell"><div class="lbl">{f.lbl}</div><div class="g">{f.g}</div></div>
        {/each}
      </div>
      {#if NONCONNECT.has(current.c)}<div class="note">Соединяется только справа — отдельных начальной и серединной форм нет.</div>{/if}
    </div>
  {/if}

  <div class="options" class:single={mode === 'sira' || mode === 'surah'}>
    {#each options as o, i}
      <button class="opt {optClass(o)}" disabled={answered} onclick={() => choose(o)}>
        <span class="num">{i + 1}</span>{label(mode, o)}
      </button>
    {/each}
  </div>

  <div class="nextrow">
    {#if answered}
      <button class="next" bind:this={nextBtn} onclick={next}>{pos + 1 >= deck.length ? (allAnswered ? 'Результат →' : 'Дальше →') : 'Дальше →'}</button>
    {/if}
  </div>

  {#if answered && mode !== 'dict'}
    <div class="panel">
      {#if mode === 'alphabet'}
        <div class="rname">{current.c} — {current.name}</div>
        <div class="rbody">Звук: {current.sound}</div>
        <div class="seclbl">Пример</div>
        <div class="example">
          <div class="ex-word">{@html highlightWord(current.ex.w, current.ex.hi)}</div>
          <div class="ex-tr">{current.ex.tl} — «{current.ex.tr}»</div>
        </div>
      {:else if mode === 'names'}
        <div class="rname">{current.ru} · {current.lat}</div>
        <div class="rvars">{current.variants}</div>
        <div class="rbody">{current.info}</div>
      {:else if mode === 'sira'}
        <div class="rname">Правильный ответ: {current.a[0]}</div>
        <div class="rbody">{current.info}</div>
      {:else if mode === 'surah'}
        <div class="rname"><span class="arname">{current.ar}</span></div>
        <div class="rvars">{current.lb}</div>
        <div class="rbody">{current.t} сура · {current.ay} {ayatWord(current.ay)}. {current.hint}</div>
      {:else if mode === 'quran'}
        <div class="rname">{current.ar} · {current.ru}</div>
        <div class="rvars">{current.tr}</div>
        {#if current.note}<div class="rbody" style="margin-top:4px">{current.note}</div>{/if}
        <div class="seclbl">Пример из Корана</div>
        <div class="example">
          <div class="ex-ayah">{current.ex}</div>
          <div class="ex-tl">{current.exl}</div>
          <div class="ex-tr">{current.ext}</div>
          <div class="ex-ref">{refLabel(current)}</div>
        </div>
      {/if}
    </div>
  {/if}
  {/key}

  <div class="stats">
    <div class="stat"><b>{score}</b><span>верно</span></div>
    <div class="stat"><b>{accuracy}</b><span>точность</span></div>
    <div class="stat"><b class:hot={streak >= 5}>{streak}</b><span>серия</span></div>
  </div>

  <div class="controls">
    {#if mode === 'alphabet'}
      <label class="toggle"><input type="checkbox" bind:checked={formsMode}> Разные формы букв</label>
    {/if}
    <button class="linkbtn" onclick={startOver}>Начать заново</button>
  </div>
{:else if finished}
  <div class="result">
    <div class="rbig">{pct}%</div>
    <div class="rmsg">{resultMessage(pct)}</div>
    <div class="rline">Верно {score} из {deck.length}</div>
    <div class="rbtns">
      {#if mistakes}
        <button class="btn" bind:this={restartBtn} onclick={review}>Разобрать ошибки ({mistakes})</button>
        <button class="btn ghost" onclick={restart}>Ещё раунд</button>
      {:else}
        <button class="btn" bind:this={restartBtn} onclick={restart}>Ещё раунд</button>
        <button class="btn ghost" onclick={review}>Посмотреть ответы</button>
      {/if}
      <button class="btn ghost" onclick={onclose}>К разделам</button>
    </div>
  </div>
{/if}
