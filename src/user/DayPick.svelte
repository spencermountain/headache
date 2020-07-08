<script>
  import { onMount } from 'svelte'
  import spacetime from 'spacetime'
  const h = 75
  let el

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

  export let date = spacetime.today()
  let index = days[date.format('day')]

  function debounce(func, wait, immediate) {
    let timeout
    return function() {
      let context = this,
        args = arguments
      let later = function() {
        timeout = null
        if (!immediate) func.apply(context, args)
      }
      let callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func.apply(context, args)
    }
  }

  const onScroll = debounce(function(e) {
    let y = el.scrollTop
    index = y / h
  }, 300)

  onMount(() => {
    el.scrollTop = index * h
  })
</script>

<style>
  .container {
    border: 2px solid white;
    border-radius: 5px;
    scroll-snap-type: y mandatory;
    height: 75px;
    overflow-y: scroll;
    overflow-x: hidden;
    min-width: 300px;
  }
  section {
    height: 75px;
    width: 100%;
    scroll-snap-align: start;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>

<!-- <svelte:window bind:scrollY={y} /> -->
<div class="container" on:scroll={onScroll} bind:this={el}>

  <section>monday</section>
  <section>tuesday</section>
  <section>wednesday</section>
  <section>thurs</section>
  <section>friday</section>
  <section>saturday</section>
  <section>sunday</section>
</div>
<div>{index}</div>
