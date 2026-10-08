<script>
  import { fly, fade } from 'svelte/transition';
  import Brand from './Brand.svelte';
  import Quiz from './Quiz.svelte';
  import { MODES, MODE_KEYS, statsOf, buildDeck, pendingSession, restoreSession } from '../lib/quiz.js';
  import { dueAcross, getName } from '../lib/progress.js';

  let { quizOpen = $bindable(false) } = $props();

  let session = $state(null);   // { title, mode|null, deck }
  let tick = $state(0);         // пересчёт статистики после теста

  const name = $derived((tick, getName()));
  const stats = $derived.by(() => { tick; const o = {}; for (const m of MODE_KEYS) o[m] = statsOf(m); return o; });

  // повторение на сегодня — всё, что ждёт повтора, из всех разделов
  const due = $derived.by(() => {
    tick;
    const src = {}; for (const m of MODE_KEYS) src[m] = { items: MODES[m].data, idOf: MODES[m].id };
    return dueAcross(src);
  });

  const pending = $derived.by(() => { tick; const o = {}; for (const m of [...MODE_KEYS, 'review']) o[m] = pendingSession(m); return o; });

  function open(mode) {
    const r = restoreSession(mode);
    session = r ? { ...r.session, resume: r.state } : { title: MODES[mode].title, mode, deck: buildDeck(mode) };
    quizOpen = true;
  }
  function openReview() {
    const r = restoreSession('review');
    if (r) { session = { ...r.session, resume: r.state }; quizOpen = true; return; }
    const shuffled = [...due].sort(() => Math.random() - 0.5).slice(0, 30);
    session = { title: 'Повторение', mode: null, deck: shuffled };
    quizOpen = true;
  }
  function close() { session = null; quizOpen = false; tick++; }
  const unit = m => (m === 'sira' ? 'Верно' : 'Выучено');
</script>

{#if session}
  <div in:fly={{ y: 24, duration: 260 }}>
    <Quiz {session} onclose={close} onanswer={() => tick++} />
  </div>
{:else}
  <div in:fade={{ duration: 200 }}>
    <Brand subtitle="Учёба" />

    <div class="hello">
      <b>{name ? `Ассаляму алейкум, ${name}` : 'Ассаляму алейкум'}</b>
    </div>

    {#if pending.review}
      <button class="reviewrow" onclick={openReview}>
        <span>Повторение <small>({pending.review.total - pending.review.pos})</small></span>
        <span class="go">Продолжить</span>
      </button>
    {:else if due.length}
      <button class="reviewrow" onclick={openReview}>
        <span>Повторение <small>({due.length})</small></span>
        <span class="go">Начать</span>
      </button>
    {/if}

    <div class="grid">
      {#each MODE_KEYS as m}
        {@const s = stats[m]}
        <button class="tcard" onclick={() => open(m)}>
          <div class="g" class:latin={MODES[m].latin}>{MODES[m].glyph}</div>
          <b>{MODES[m].title}</b>
          <small>{unit(m)} {s.learned} из {s.total}</small>
          <div class="bar">
            <i class="soft" style="width:{s.total ? (s.learned + s.learning) / s.total * 100 : 0}%"></i>
            <i style="width:{s.total ? s.learned / s.total * 100 : 0}%"></i>
          </div>
          {#if pending[m]}
            <!-- незаконченный тест: кольцо прогресса без текста -->
            <svg class="ring" viewBox="0 0 24 24" aria-label="Тест не закончен">
              <circle cx="12" cy="12" r="9"/>
              <circle cx="12" cy="12" r="9" class="v" style="stroke-dasharray: {Math.round(pending[m].pos / pending[m].total * 56.5)} 56.5"/>
            </svg>
          {:else if s.due}<span class="due">{s.due}</span>{/if}
        </button>
      {/each}
    </div>

  </div>
{/if}
