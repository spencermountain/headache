<script>
  import { Calendar, Day } from '/Users/spencer/mountain/somehow-calendar/src'

  import { parsed } from '../../store'
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
  .div {
    left: 10%;
    width: 80%;
    height: 10px;
    border-radius: 5px;
    background-color: #fbfbfb;
  }
  pre {
    text-align: left;
  }
  .square {
    display: inline-block;
    border-radius: 2px;
    height: 2rem;
    width: 2rem;
  }
</style>

<div class="container">
  -->
  <!-- {#each Object.keys($parsed.days) as k}
    <div>{k}, {$parsed.colors[$parsed.days[k][0]]}</div>
  {/each}
  <!-- <pre>{JSON.stringify($parsed, null, 2)}</pre> -->
  <div class="row m1 nowrap">
    {#each $parsed.tags.slice(0, 10) as tag}
      <div>
        <span class="square" style="background-color:{tag.color}" />
        {tag.tag}
      </div>
    {/each}
  </div>

  <div class="g2 div" />
  <Calendar start="jan 1 2020" end="today" align="row" width="10rem">
    {#each Object.keys($parsed.days) as k}
      <Day date={k} color={$parsed.colors[$parsed.days[k][0]]} />
    {/each}
  </Calendar>
</div>
