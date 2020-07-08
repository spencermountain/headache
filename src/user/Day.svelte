<script>
  import { onMount } from 'svelte'
  import { data, date } from '../store'
  import debounce from 'lodash/debounce'
  import spacetime from 'spacetime'
  import resizable from './lib/_resizable'
  export let write = () => {}
  let value = 'empty'
  let fmt = $date.format('iso-short')

  // make it resizable
  let el = null
  onMount(() => {
    resizable(el)
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
      write()
      return val
    })
  }, 750)
</script>

<style>
  .container {
    color: white;
  }
</style>

<div class="container">
  <div class="title row">{spacetime($date).format('{day-short} {month} {date}')}</div>
  <textarea
    class="textarea"
    spellcheck="false"
    resizable="false"
    bind:value={$data.dates[fmt]}
    on:input={didChange}
    bind:this={el} />

</div>
