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
  const dueText = $derived.by(() => {
    const by = {}; for (const d of due) by[d.mode] = (by[d.mode] || 0) + 1;
    const parts = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m, n]) => `${n} · ${MODES[m].title}`);
    return parts.join(', ');
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
      <div class="todaycard">
        <div><b>Повторение не закончено</b><small>Вопрос {pending.review.pos + 1} из {pending.review.total}</small></div>
        <button class="btn" onclick={openReview}>Продолжить</button>
      </div>
    {:else if due.length}
      <div class="todaycard">
        <div><b>Повторение на сегодня</b><small>{due.length} {due.length === 1 ? 'элемент' : 'элементов'}: {dueText}</small></div>
        <button class="btn" onclick={openReview}>Начать</button>
      </div>
    {:else}
      <div class="todaycard">
        <div><b>На сегодня всё повторено</b><small>Откройте любой раздел, чтобы учить новое</small></div>
      </div>
    {/if}

    <div class="grid">
      {#each MODE_KEYS as m}
        {@const s = stats[m]}
        <button class="tcard" onclick={() => open(m)}>
          <div class="g" class:latin={MODES[m].latin}>{MODES[m].glyph}</div>
          <b>{MODES[m].title}</b>
          <small>{unit(m)} {s.learned}/{s.total}{s.learning ? ` · учится ${s.learning}` : ''}</small>
          <div class="bar">
            <i class="soft" style="width:{s.total ? (s.learned + s.learning) / s.total * 100 : 0}%"></i>
            <i style="width:{s.total ? s.learned / s.total * 100 : 0}%"></i>
          </div>
          {#if pending[m]}<span class="cont">Продолжить · {pending[m].pos + 1}/{pending[m].total}</span>
          {:else if s.due}<span class="due">{s.due}</span>{/if}
        </button>
      {/each}
    </div>

    <p class="learnnote">Элемент считается выученным, когда вы ответили на него верно в три разных дня. Приложение само подскажет, что повторить, — заходите каждый день.</p>
    <p class="learnnote">Транскрипция: <b>қ</b> — ق, <b>з̃</b> — ذ, <b>с̃</b> — ث, <b>ж</b> — ج, <b>`</b> — ع, <b>'</b> — хамза; долгие «ии», «уу» удваиваются.</p>
  </div>
{/if}
