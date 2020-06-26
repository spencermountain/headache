<script>
  import spacetime from 'spacetime'
  import Day from './Day.svelte'
  import Year from './Year.svelte'
  export let date = ''
  let s = spacetime(date).startOf('week')
  let end = s.endOf('week')
  s = s.minus(1, 'second')
  let days = s.every('day', end)
</script>

<style>
  .month {
    align-self: flex-start;
    font-size: 1rem;
    color: #e6b3bc;
    margin-left: 2rem;
  }
  .week {
    align-items: flex-start;
  }
  .slider {
    /* max-height: 400px; */
    /* overflow-y: scroll; */
    padding-left: 2rem;
    padding-right: 2rem;
    padding-top: 1rem;
    /* border: 1px solid lightgrey; */
    /* border-radius: 5px; */
  }

  .leftSide {
    /* border-right: 4px solid #e6b3bc; */
    /* color: #a6a6a6; */
    color: #e6b3bc;
    padding-right: 10px;
    font-size: 40px;
    opacity: 0.6;
    cursor: pointer;
  }
  .rightSide {
    /* border-left: 4px solid #b0c4de; */
    font-size: 40px;
    color: #b0c4de;
    opacity: 0.6;
    padding-left: 10px;
    cursor: pointer;
  }
</style>

<div class="col">
  <div class="month">
    <div>{s.format('{month} {year}')}</div>
    <!-- <div>{'w' + s.week() + ' - ' + s.year()}</div> -->
  </div>
  <div class="row nowrap week">
    <!-- <div class="leftSide">&lt;</div> -->
    <div class="slider">
      {#each days as d}
        <Day date={d} />
      {/each}
    </div>
    <div class="rightSide">
      <Year date={s} />
    </div>
  </div>
</div>
