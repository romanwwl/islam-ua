<script>
  import { fly } from 'svelte/transition';
  import { untrack } from 'svelte';
  import Prayer from './components/Prayer.svelte';
  import Learn from './components/Learn.svelte';
  import Profile from './components/Profile.svelte';
  import TabBar from './components/TabBar.svelte';
  import { load, save } from './lib/storage.js';

  const TABS = ['prayer', 'learn', 'profile'];
  let tab = $state(load('islamua_tab', { tab: 'prayer' }).tab);
  let prev = $state(untrack(() => tab));
  let quizOpen = $state(false); // во время теста нижняя панель скрыта

  function go(t) {
    if (t === tab) return;
    prev = tab; tab = t;
    save('islamua_tab', { tab: t });
  }
  // направление сдвига: к нажатой вкладке
  const dir = $derived(TABS.indexOf(tab) >= TABS.indexOf(prev) ? 1 : -1);
</script>

<div class="app">
  {#key tab}
    <div class="screen" in:fly={{ x: 40 * dir, duration: 280, opacity: 0.4 }}>
      {#if tab === 'prayer'}
        <Prayer active={true} />
      {:else if tab === 'learn'}
        <Learn bind:quizOpen />
      {:else}
        <Profile onopen={go} />
      {/if}
    </div>
  {/key}
</div>

{#if !quizOpen}
  <TabBar {tab} onselect={go} />
{/if}
