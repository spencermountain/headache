<script>
  import { getContext } from 'svelte'
  import { onMount } from 'svelte'
  import { data } from './store'
  import resizable from './_resizable'
  import debounce from 'lodash/debounce'
  import spacetime from 'spacetime'
  export let write = () => {}
  export let date = ''
  let d = spacetime(date)
  let value = 'empty'

  // make it resizable
  let el
  onMount(() => {
    el.focus()
    resizable(el)
  })
  data.subscribe(val => {
    console.log('subscribed-change', val.dates[date])
    value = val.dates[date]
  })

  // send update to server
  const didChange = debounce(e => {
    console.log('debounce')
    data.update(val => {
      val.dates[date] = value
      write()
      return val
    })
    // data.dates[date] = value
    // write(data)
  }, 750)
</script>

<style>
  .container {
    color: white;
  }
</style>

<div class="container">
  <div class="title">{d.format('{day-short} {month-short} {date}')}</div>
  <textarea class="textarea" spellcheck="false" resizable="false" bind:value on:input={didChange} bind:this={el} />

</div>
