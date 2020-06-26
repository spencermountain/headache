<script>
  import Week from './Week.svelte'
  // export let user = ''
  let value = 'asdf [fun:cool] and [nice:yes]'
  let keys = []
  function onType(res) {
    keys = []
    res.forEach(l => {
      l.data.forEach(o => keys.push(o.key))
    })
    console.log(keys)
  }
  import { setContext } from 'svelte'
  let data = {
    '2020-06-23': 'asdf',
    '2020-07-23': 'asdf',
  }
  setContext('data', data)
</script>

<style>

</style>

<div class="main">
  <div class="row nowrap">
    <!-- user: -->
    <!-- <input bind:value={user} /> -->
    <Week bind:value callback={onType} />
  </div>
  <div class=" row">
    {#each keys as key}
      <div>{key}</div>
    {/each}
  </div>
  <div class="col outline">[calendar]</div>
</div>
