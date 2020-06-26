<script>
  import { onMount } from 'svelte'
  import spacetime from 'spacetime'
  import parse from './parse'
  import { getContext } from 'svelte'
  export let date = ''
  let allData = getContext('data') || {}
  let now = spacetime.now()
  let iso = date.format('iso-short')
  let value = allData[iso] || ''

  export let onInput = () => {
    let res = parse(value)
    callback(res)
  }
  let isToday = date.isSame(now, 'day')
  // let isBefore = date.isBefore(now) && !isToday
  let isWeekend = date.dayName() === 'saturday' || date.dayName() === 'sunday'
  let el

  function resize({ target }) {
    target.style.height = '1px'
    target.style.height = +target.scrollHeight + 'px'
  }

  export function text_area_resize(el) {
    resize({ target: el })
    el.style.overflow = 'hidden'
    el.addEventListener('input', resize)

    return {
      destroy: () => el.removeEventListener('input', resize),
    }
  }

  onMount(() => {
    if (isToday) {
      console.log('here')
      el.focus()
    }
    text_area_resize(el)
  })
</script>

<style>
  .container {
    position: relative;
    text-align: left;
  }
  .textarea {
    flex: 1;
    margin-bottom: 0.5rem;
    border-left: 3px solid steelblue;
    border-bottom: none;
    min-width: 90%;
    min-height: 3rem;
    font-size: 1.2rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-radius: 5px;
    margin-left: 2.5rem;
    margin-bottom: 1rem;
    resize: none;
    background-color: #3b4252;
    box-shadow: none;
    color: #a6a6a6;
    border-radius: 0px;
    /* color: #c7cdd8; */
    /* color: #c4cad5 !important; */
  }
  .textarea:focus {
    color: #c4cad5;
    opacity: 1;
  }
  .title {
    /* color: #7896b5; */
    color: #577c97;
    margin: 1rem;
    display: inline;
    font-family: 'Courier New', Courier, monospace;
  }
  .today {
    /* border-bottom: 1px solid #d68881;
    display: inline; */
    color: white;
  }
  .weekend {
    border-left: 2px solid #d68881;
  }
</style>

<div class="container">
  <div class="title" class:today={isToday}>{date.format('{day-short} {date-ordinal}')}</div>
  <textarea
    class="textarea"
    class:weekend={isWeekend}
    spellcheck="false"
    resizable="false"
    bind:value
    on:input={onInput}
    bind:this={el} />

</div>
