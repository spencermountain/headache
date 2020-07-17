<script>
  import { onMount } from 'svelte'
  import spacetime from 'spacetime'
  import debounce from './debounce'
  export let callback = () => {}
  export let date = null //thursday
  date = spacetime(date)
  const h = 75
  const w = 300
  let el
  let topLeft = date.clone().startOf('week')
  let xIndex = date.day() - 1
  let onScroll = () => {}
  onMount(() => {
    el.scrollLeft = xIndex * w
    onScroll = debounce(function(e) {
      xIndex = Math.round(el.scrollLeft / w)
      date = topLeft.add(xIndex, 'days')
      callback(date)
    }, 300)
  })

  function handleKeydown(event) {
    var isFocused = document.activeElement === el
    if (!isFocused) {
      return
    }
    if (event.key === 'ArrowLeft') {
      el.scrollLeft -= w
    }
    if (event.key === 'ArrowRight') {
      el.scrollLeft += w
    }
  }
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
  .day {
    height: 75px;
    width: 300px;
    min-width: 300px;
    max-width: 300px;
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
</style>

<svelte:window on:keydown={handleKeydown} />
<div class="col" on:click={() => el.focus()} tabindex="1">
  <div class="container shadow" on:scroll={onScroll} bind:this={el}>
    <div class="row grid" style="">
      <div class="day">monday</div>
      <div class="day">tuesday</div>
      <div class="day">wednesday</div>
      <div class="day">thursday</div>
      <div class="day">friday</div>
      <div class="day">saturday</div>
      <div class="day">sunday</div>
    </div>
  </div>
</div>
