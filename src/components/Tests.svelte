<script>
  import { MODES, MODE_KEYS, NONCONNECT, displayForm, letterForms, highlightWord, ayatWord, buildDeck, buildOptions, resultMessage, surahName } from '../lib/quiz.js';

  let { active = false } = $props();

  let mode = $state('alphabet');
  let deck = $state([]);
  let pos = $state(0);
  let optsCache = $state([]);       // варианты ответа по каждому вопросу (чтобы при возврате назад были те же)
  let answers = $state([]);         // выбранный вариант по каждому вопросу (null — ещё не отвечал)
  let hints = $state([]);           // открыта ли подсказка (Суры)
  let finished = $state(false);
  let formsMode = $state(false);
  let playing = $state(false);
  let nextBtn = $state(null), restartBtn = $state(null);

  const cfg = $derived(MODES[mode]);
  const label = item => MODES[mode].label(item);
  const current = $derived(deck[pos] ?? null);
  const options = $derived(optsCache[pos] ?? []);
  const chosen = $derived(answers[pos] ?? null);
  const answered = $derived(chosen !== null);
  const hintOpen = $derived(!!hints[pos]);
  const correctLabel = $derived(current ? label(current) : '');
  const isCorrect = (i) => answers[i] != null && label(answers[i]) === label(deck[i]);
  const total = $derived(answers.filter(a => a != null).length);
  const score = $derived(deck.reduce((n, _, i) => n + (isCorrect(i) ? 1 : 0), 0));
  // серия — подряд верных с конца отвеченных
  const streak = $derived.by(() => { let k = 0; for (let i = total - 1; i >= 0; i--) { if (isCorrect(i)) k++; else break; } return k; });
  const mistakes = $derived(deck.reduce((n, _, i) => n + (answers[i] != null && !isCorrect(i) ? 1 : 0), 0));
  const allAnswered = $derived(deck.length > 0 && total === deck.length);
  const accuracy = $derived(total ? Math.round(score / total * 100) + '%' : '—');
  const progress = $derived(deck.length ? Math.min(total / deck.length * 100, 100) : 0);
  const pct = $derived(deck.length ? Math.round(score / deck.length * 100) : 0);
  const cardState = $derived(!answered ? '' : (label(chosen) === correctLabel ? 'correct' : 'wrong'));
  // Глиф на карточке (для алфавита — случайная форма буквы, пересчитывается при переключении режима форм)
  const glyph = $derived(current && mode === 'alphabet' ? displayForm(current.c, formsMode) : '');

  function start() {
    deck = buildDeck(mode);
    optsCache = []; answers = []; hints = [];
    finished = false;
    goTo(0);
  }

  function goTo(i) {
    pos = i;
    if (!optsCache[i]) { optsCache[i] = buildOptions(mode, deck[i]); }
  }

  function next() {
    if (pos + 1 >= deck.length) {
      if (allAnswered) { finished = true; queueMicrotask(() => restartBtn?.focus()); }
      return;
    }
    goTo(pos + 1);
  }

  function back() { if (pos > 0) goTo(pos - 1); }

  // с экрана результата — к разбору: на первую ошибку (или на первый вопрос)
  function review() {
    finished = false;
    const first = deck.findIndex((_, i) => answers[i] != null && !isCorrect(i));
    goTo(first >= 0 ? first : 0);
  }

  function choose(opt) {
    if (answered) return;
    answers[pos] = opt;
    queueMicrotask(() => nextBtn?.focus());
  }

  function setMode(m) {
    if (mode === m) return;
    mode = m;
    start();
  }

  const refLabel = w => {
    const [s, a] = w.ref.split(':');
    return `Сура ${s} «${surahName(+s)}», аят ${a}`;
  };
  const timesWord = n => { const m = n % 100, d = n % 10; return (m >= 11 && m <= 14) ? 'раз' : (d === 1 ? 'раз' : (d >= 2 && d <= 4 ? 'раза' : 'раз')); };

  function optClass(o) {
    if (!answered) return '';
    if (label(o) === correctLabel) return 'correct';
    if (o === chosen) return 'wrong';
    return 'dim';
  }

  /* ---- Аудио букв ---- */
  const audioEl = typeof Audio !== 'undefined' ? new Audio() : null;
  if (audioEl) { audioEl.onended = () => playing = false; audioEl.onpause = () => playing = false; }
  function play() {
    if (mode !== 'alphabet' || !current || !current.audio || !audioEl) return;
    try {
      audioEl.pause(); audioEl.src = current.audio; audioEl.currentTime = 0;
      audioEl.play(); playing = true;
    } catch (e) { /* ignore */ }
  }

  /* ---- Клавиатура (для веб-версии) ---- */
  function onKey(e) {
    if (!active) return;
    if (finished) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } return; }
    if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); back(); return; }
    if (!answered && ['1', '2', '3', '4'].includes(e.key)) {
      const o = options[+e.key - 1]; if (o) choose(o);
    } else if (answered && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) {
      e.preventDefault(); next();
    }
  }

  start();
</script>

<svelte:window onkeydown={onKey} />

<div class="tabs">
  {#each MODE_KEYS as m}
    <button class="tab" class:active={mode === m} onclick={() => setMode(m)}>{MODES[m].title}</button>
  {/each}
</div>

<div class="counter">{finished ? deck.length : pos + 1} / {deck.length}</div>
<div class="bar"><i style="width:{progress}%"></i></div>

{#if !finished && current}
  <div id="quiz">
    <div class="card {cardState}">
      {#key pos}
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
        {:else if mode === 'quran'}
          <div class="glyph name">{current.ar}</div>
          <div class="translit">{current.ru}</div>
        {:else}
          <div class="glyph name">{current.ar}</div>
          <div class="translit">{current.ru}</div>
        {/if}
      {/key}

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
          <button class="hint-btn" onclick={() => hints[pos] = true}>Подсказка</button>
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
        {#if NONCONNECT.has(current.c)}
          <div class="note">Соединяется только справа — отдельных начальной и серединной форм нет.</div>
        {/if}
      </div>
    {/if}

    <div class="promptrow">
      {#if pos > 0}
        <button class="next ghost" onclick={back}>← Назад</button>
      {/if}
      {#if answered}
        <button class="next" bind:this={nextBtn} onclick={next}>{pos + 1 >= deck.length ? (allAnswered ? 'Результат →' : 'Дальше →') : 'Дальше →'}</button>
      {/if}
    </div>

    <div class="options" class:single={mode === 'sira' || mode === 'surah'}>
      {#each options as o, i}
        <button class="opt {optClass(o)}" disabled={answered} onclick={() => choose(o)}>
          <span class="num">{i + 1}</span>{label(o)}
        </button>
      {/each}
    </div>

    <div class="stats">
      <div class="stat"><b>{score}</b><span>верно</span></div>
      <div class="stat"><b>{accuracy}</b><span>точность</span></div>
      <div class="stat"><b class:hot={streak >= 5} id="stStreak">{streak}</b><span>серия</span></div>
    </div>

    {#if answered && mode !== 'dict'}
      {#key pos}
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
            <div class="freq">Встречается в Коране <b>{current.n}</b> {timesWord(current.n)}</div>
            <div class="seclbl">Пример из Корана</div>
            <div class="example">
              <div class="ex-ayah">{current.ex}</div>
              <div class="ex-tr">{current.ext}</div>
              <div class="ex-ref">{refLabel(current)}</div>
            </div>
          {/if}
        </div>
      {/key}
    {/if}

    {#if mode === 'alphabet'}
      <div class="controls">
        <label class="toggle"><input type="checkbox" bind:checked={formsMode}> Разные формы букв</label>
      </div>
    {/if}
  </div>
{:else if finished}
  <div class="result">
    <div class="rbig">{pct}%</div>
    <div class="rmsg">{resultMessage(pct)}</div>
    <div class="rline">Верно {score} из {deck.length}</div>
    <div class="rbtns">
      <button class="next restart" bind:this={restartBtn} onclick={start}>Пройти заново</button>
      <button class="next ghost" onclick={review}>{mistakes ? `Разобрать ошибки (${mistakes})` : 'Посмотреть ответы'}</button>
    </div>
  </div>
{/if}
