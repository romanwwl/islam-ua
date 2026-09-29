<script>
  let { tab, onselect } = $props();
  const items = [
    { id: 'prayer', label: 'Намаз' },
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
            <svg viewBox="0 0 24 24"><path d="M12 3a7 7 0 1 0 7 7"/><path d="M12 3v4M4 21h16M6 21v-5a6 6 0 0 1 12 0v5"/></svg>
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
