<script>
  import { onMount } from 'svelte'
  import { data, date } from './store'
  import resizable from './_resizable'
  import debounce from 'lodash/debounce'
  import spacetime from 'spacetime'
  export let write = () => {}
  let value = 'empty'

  // make it resizable
  let el
  onMount(() => {
    resizable(el)
    el.focus()
  })

  data.subscribe(val => {
    value = val.dates[$date]
  })
  date.subscribe(d => {
    value = $data.dates[d]
  })

  // send update to server
  const didChange = debounce(e => {
    data.update(val => {
      val.dates[$date] = value
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
  <div class="title">{spacetime($date).format('{day-short} {month-short} {date}')}</div>
  <textarea
    class="textarea"
    spellcheck="false"
    resizable="false"
    bind:value={$data.dates[$date]}
    on:input={didChange}
    bind:this={el} />

</div>
