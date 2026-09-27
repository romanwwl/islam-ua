<script>
  import Tests from './components/Tests.svelte';
  import Prayer from './components/Prayer.svelte';
  import logo from '/logo.png?url';

  let section = $state('prayer');
</script>

<div class="app">
  <header class="hdr">
    <button class="mbtn" class:active={section === 'prayer'} onclick={() => section = 'prayer'}>Время намаза</button>
    <div class="brand">
      <img class="logo" src={logo} alt="ISLAM UA">
      <h1>ISLAM UA</h1>
    </div>
    <button class="mbtn" class:active={section === 'tests'} onclick={() => section = 'tests'}>Тесты</button>
  </header>

  <div hidden={section !== 'tests'}>
    <Tests active={section === 'tests'} />
  </div>
  <div hidden={section !== 'prayer'}>
    <Prayer active={section === 'prayer'} />
  </div>
</div>
