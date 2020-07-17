<script>
  import { Calendar, Day } from '/Users/spencer/mountain/somehow-calendar/src'

  import { parsed } from '../../store'
  import spacetime from 'spacetime'
  let start = spacetime('jan 1 2020')
  // .minus(1, 'hour')
  let end = start.endOf('year')
</script>

<style>
  .container {
    /* border: 2px solid #fbfbfb; */
  }
</style>

<div class="container">

  <Calendar {start} {end} align="row" width="10rem">
    {#each Object.keys($parsed.days) as k}
      <Day date={k} color={$parsed.colors[$parsed.days[k][0]]} />
    {/each}
  </Calendar>
</div>
