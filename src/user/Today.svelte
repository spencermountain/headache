<script>
  import spacetime from 'spacetime'
  import { data, date } from '../store'
  setTimeout(() => {
    console.log($data)
  }, 1000)
  let iso = $date.format('iso-short')
</script>

<style>
  .container {
    margin: 2rem;
  }
  .entry {
    text-align: left;
    margin: 1rem;
    padding-left: 1rem;
    border-left: 4px solid steelblue;
  }
</style>

<div class="container">
  {#each Object.keys($data.dates) as k}
    {#if k.startsWith(iso)}
      <div class="entry">
        {$data.dates[k]}
        <a href="#" class="ml2">x</a>
      </div>
    {/if}
  {/each}
</div>
