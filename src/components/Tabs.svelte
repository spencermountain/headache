<script>
  export let active = ''
  let tabs = []

  import { setContext } from 'svelte'
  setContext('addTab', t => {
    tabs = tabs.concat([t])
  })
  let show = null
</script>

<style>

</style>

<div class="col">
  <div class="row nowrap">
    {#each tabs as t}
      <div />
    {/each}
  </div>
  <div class="container">{show}</div>
</div>

<slot />
