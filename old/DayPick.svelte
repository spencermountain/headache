<script>
  import { onMount } from 'svelte'
  import spacetime from 'spacetime'
  import debounce from './lib/debounce'
  export let date = null //thursday
  date = spacetime(date)
  const h = 75
  const w = 300
  const weekNum = 4
  let el
  let topLeft = date
    .clone()
    .startOf('week')
    .minus(weekNum - 1, 'weeks')

  // set our indexes
  let days = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  }
  let dayArr = Object.keys(days)

  let yIndex = days[date.format('day')]
  let xIndex = weekNum - 1

  let onScroll = () => {}

  onMount(() => {
    el.scrollTop = yIndex * h
    el.scrollLeft = xIndex * w
    console.log('mount')

    onScroll = debounce(function(e) {
      yIndex = Math.round(el.scrollTop / h)
      xIndex = Math.round(el.scrollLeft / w)
      console.log('scrolled')
      console.log(xIndex)
      date = topLeft.day(dayArr[yIndex])
      date = date.add(xIndex, 'weeks')
    }, 300)
  })
</script>

<style>
  .container {
    border: 1px solid #a2a8b3;
    border-radius: 5px;
    scroll-snap-type: both mandatory;
    overflow-y: scroll;
    overflow-x: scroll;
    height: 75px;
    min-width: 300px;
    max-width: 300px;
    background-color: #354052;
  }
  section {
    height: 75px;
    width: 300px;
    scroll-snap-align: start;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
  .grid {
    flex-wrap: nowrap !important;
    justify-content: stretch;
  }
  .week {
    min-width: 300px;
    max-width: 300px;
    border: 1px solid white;
  }
</style>

<!-- <svelte:window bind:scrollY={y} /> -->
<div class="col">
  <!-- <div class="blue ulred m1">{date.format('{day-short} {month} {date-ordinal}, {year}')}</div> -->
  <div class="container shadow" on:scroll={onScroll} bind:this={el}>
    <div class="row grid" style="width:{weekNum * (w - 1)}px">
      {#each Array(weekNum) as _, i}
        <div class="week">
          <section>monday</section>
          <section>tuesday</section>
          <section>wednesday</section>
          <section>thursday</section>
          <section>friday</section>
          <section>saturday</section>
          <section>sunday</section>
        </div>
      {/each}

    </div>
  </div>

</div>
<!-- <div>{xIndex}, {yIndex}</div> -->
