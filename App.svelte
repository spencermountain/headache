<script>
  import Margin from './Margin.svelte'
  export let user = ''
  let value = ''
  let keys = []
  function onType(res) {
    console.log(res)
    keys = keys.concat(['more'])
  }
</script>

<style>

</style>

<div class="main row nowrap">
  user:
  <input bind:value={user} />
</div>
<div class="main">
  <Margin bind:value callback={onType} />
</div>
<div class="main row">
  {#each keys as key}
    <div>{key}</div>
  {/each}
</div>
<div class="main">[calendar]</div>
