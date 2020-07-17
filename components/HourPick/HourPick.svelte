<script>
  import { onMount } from 'svelte'
  import spacetime from 'spacetime'
  import debounce from './debounce'
  export let callback = () => {}
  export let date = null
  date = spacetime(date)
  const h = 50
  let el
  let topLeft = date.clone().time('6:00am')

  let hours = [
    '6am',
    '7am',
    '8am',
    '9am',
    '10am',
    '11am',
    'noon',
    '1pm',
    '2pm',
    '3pm',
    '4pm',
    '5pm',
    '6pm',
    '7pm',
    '8pm',
    '9pm',
    '10pm',
    '11pm',
    'midnight',
  ]
  let hour = date.format('{hour}{ampm}')
  let yIndex = hours.indexOf(hour)
  console.log(hour, yIndex)

  let onScroll = () => {}
  onMount(() => {
    el.scrollTop = yIndex * h
    onScroll = debounce(function(e) {
      yIndex = Math.round(el.scrollTop / h)
      date = topLeft.add(yIndex, 'hours')
      callback(date)
    }, 300)
  })

  function handleKeydown(event) {
    var isFocused = document.activeElement === el
    if (!isFocused) {
      return
    }
    el.style['scroll-snap-type'] = 'none'
    if (event.key === 'ArrowUp') {
      el.scrollTop -= 15
    }
    if (event.key === 'ArrowDown') {
      el.scrollTop += 15
    }
    el.style['scroll-snap-type'] = 'y mandatory'
    el.scrollTop += 1
  }

  const handle_pointerdown = e => {
    const start_x = e.clientX
    el.style['scroll-snap-type'] = 'none'
    const handle_pointermove = e2 => {
      const delta = e2.clientX - start_x
      el.scrollTop += delta
    }
    const handle_pointerup = e3 => {
      el.style['scroll-snap-type'] = 'y mandatory'
      el.scrollTop += 1
      window.removeEventListener('pointermove', handle_pointermove)
      window.removeEventListener('pointerup', handle_pointerup)
    }
    window.addEventListener('pointermove', handle_pointermove)
    window.addEventListener('pointerup', handle_pointerup)
  }
</script>

<style>
  .container {
    border: 1px solid #a2a8b3;
    border-radius: 5px;
    scroll-snap-type: y mandatory;
    overflow-y: scroll;
    overflow-x: hidden;
    height: 50px;
    min-width: 75px;
    max-width: 75px;
    background-color: #4a638a;
  }
  .hour {
    height: 50px;
    width: 75px;
    min-width: 75px;
    max-width: 75px;
    scroll-snap-align: start;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: move;
  }
  .grid {
    flex-wrap: nowrap !important;
    justify-content: stretch;
  }
</style>

<svelte:window on:keydown={handleKeydown} />

<div class="col" on:click={() => el.focus()} on:pointerdown={handle_pointerdown}>
  <div class="container shadow" on:scroll={onScroll} bind:this={el}>
    <div class="col grid" style="">
      {#each hours as h}
        <div class="hour">{h}</div>
      {/each}
    </div>
  </div>
</div>
