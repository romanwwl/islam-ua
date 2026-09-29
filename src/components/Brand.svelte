<script>
  import logo from '/logo.png?url';
  let { subtitle = '' } = $props();
</script>

<div class="brand">
  <img class="logo" src={logo} alt="ISLAM UA">
  <div><h1>ISLAM UA</h1>{#if subtitle}<small>{subtitle}</small>{/if}</div>
</div>
