<script>
  import Week from './Week.svelte'
  import Pouch from './Pouch.svelte'
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
    '2020-06-23': '',
    '2020-06-24': '.kates\n.dream = stress',
    '2020-06-25': 'drove to port credit\n\n.kate\n.dream = stress',
    '2020-06-26': `i worked on this app and it is not that good yet.

.micheal
.work = headache
.release=false
.beer=true

.storm=nope
`,
    '2020-07-23': 'july',
  }
  setContext('data', data)
</script>

<style>
  .week {
    justify-content: flex-start;
  }
</style>

<div class="main">
  <Pouch />
  <div class="row nowrap week">
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
