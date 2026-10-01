<script>
  let { tab, onselect } = $props();
  const items = [
    { id: 'prayer', label: 'Сегодня' },
    { id: 'learn', label: 'Учёба' },
    { id: 'profile', label: 'Профиль' },
  ];
</script>

<nav class="tabbar">
  <div class="in">
    {#each items as it}
      <button class="tab" class:active={tab === it.id} onclick={() => onselect(it.id)} aria-label={it.label}>
        <span class="ico">
          {#if it.id === 'prayer'}
            <svg viewBox="0 0 24 24"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/><path d="M17 4l.8 1.8 1.9.3-1.4 1.3.4 1.9L17 8.4l-1.7.9.4-1.9-1.4-1.3 1.9-.3z"/></svg>
          {:else if it.id === 'learn'}
            <svg viewBox="0 0 24 24"><path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/></svg>
          {:else}
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
          {/if}
        </span>
        {it.label}
      </button>
    {/each}
  </div>
</nav>
