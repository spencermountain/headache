<script>
  import { onMount } from 'svelte'
  import { data, date } from '../store'
  import debounce from './lib/debounce'
  import DayPick from './DayPick.svelte'
  import spacetime from 'spacetime'
  import resizable from './lib/_resizable'
  export let write = () => {}
  let value = 'empty'
  let fmt = $date.format('iso-short')
  // make it resizable
  let el = null
  onMount(() => {
    // resizable(el)
    el.focus()
  })

  // when the date changes
  date.subscribe(d => {
    fmt = $date.format('iso-short')
    value = $data.dates[fmt]
  })
  // when the dataset changes
  data.subscribe(val => {
    if (val && val.dates) {
      value = val.dates[fmt]
    } else {
      value = ''
    }
  })

  // send update to server
  const didChange = debounce(e => {
    data.update(val => {
      val.dates = val.dates || {}
      val.dates[fmt] = value
      if (value === '') {
        delete val.dates[fmt]
      }
      write()
      return val
    })
  }, 750)
</script>

<style>
  .container {
    color: white;
    position: relative;
  }
  .note {
    max-height: 100px;
    min-height: 100px;
    background-color: #51627e;
    color: white;
    border-left: 4px solid lightsteelblue;
    border-bottom: none;
    resize: none;
  }
  .picker {
    position: relative;
    top: -20px;
    margin-left: -175px;
    z-index: 4;
  }
</style>

<div class="f1" style="text-align:left;">{spacetime($date).format('{day-short} {month} {date}')}</div>
<div class="container row">
  <textarea
    class="note"
    spellcheck="false"
    resizable="false"
    bind:value={$data.dates[fmt]}
    on:input={didChange}
    bind:this={el} />
  <div class="picker">
    <DayPick bind:date={$date} />
  </div>
</div>
