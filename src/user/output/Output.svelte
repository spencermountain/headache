<script>
  import { Calendar, Day } from '/Users/spencer/mountain/somehow-calendar/src'

  import { parsed } from '../../store'
  import TagList from './TagList.svelte'
</script>

<style>
  .container {
    margin-top: 3rem;
    flex-grow: 1;
    align-items: flex-start;
    width: 90%;
    border-radius: 5px;

    /* border: 2px solid #fbfbfb; */
  }
</style>

<div class="container">

  <!-- {#each Object.keys($parsed.days) as k}
    <div>{k}, {$parsed.colors[$parsed.days[k][0]]}</div>
  {/each}
  <!-- <pre>{JSON.stringify($parsed, null, 2)}</pre> -->
  <TagList />

  <!-- <div class="g2 div" /> -->
  <Calendar start="jan 1 2020" end="today" align="row" width="10rem">
    {#each Object.keys($parsed.days) as k}
      <Day date={k} color={$parsed.colors[$parsed.days[k][0]]} />
    {/each}
  </Calendar>
</div>
