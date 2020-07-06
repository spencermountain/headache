<script>
  import { onMount } from 'svelte'
  import resizable from './_resizable'
  import debounce from 'lodash/debounce'
  import spacetime from 'spacetime'

  export let date = ''
  let d = spacetime(date)
  let value = ''

  // make it resizable
  let el
  onMount(() => {
    el.focus()
    resizable(el)
  })

  // send update to server
  const didChange = debounce(e => {
    console.log('did change')
    console.log(val)
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
