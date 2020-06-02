<script>
  import Margin from './Margin.svelte'
  export let user = ''
  let value = 'asdf [fun:cool] and [nice:yes]'
  let keys = []
  function onType(res) {
    keys = []
    res.forEach(l => {
      l.data.forEach(o => keys.push(o.key))
    })
    console.log(keys)
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
