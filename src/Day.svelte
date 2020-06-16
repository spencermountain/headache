<script>
  import { onMount } from 'svelte'
  import spacetime from 'spacetime'
  import parse from './parse'
  export let value = ''
  export let date = ''
  export let onInput = () => {
    let res = parse(value)
    callback(res)
  }
  let now = spacetime.now()
  let isToday = date.isSame(now, 'day')
  let isBefore = date.isBefore(now) && !isToday
  let el

  onMount(() => {
    if (isToday) {
      el.focus()
    }
  })
</script>

<style>
  .container {
    position: relative;
  }
  .textarea {
    flex: 1;
    margin-bottom: 0.5rem;
    min-width: 90%;
    min-height: 4rem;
    font-size: 1.5rem;
    padding-top: 2rem;
    border-radius: 5px;
    resize: none;
    color: #a6a6a6;
  }
  .textarea:focus {
    color: #4d4d4d;
  }
  .title {
    position: absolute;
    top: 0px;
    left: 10px;
    padding-left: 0.3rem;
    box-shadow: 1px 1px 4px 0 rgba(0, 0, 0, 0.2);
    padding-right: 0.3rem;
    padding-top: 0rem;
    padding-bottom: 0rem;
    font-size: 10px;
    background-color: #b0c4de;
    color: #fbfbfb;
    border-radius: 2px;
    font-family: 'Courier New', Courier, monospace;
  }
  .today {
    background-color: #d68881;
  }
  .before {
    background-color: #e6b3bc;
  }
</style>

<div class="container">
  <div class="title shadow" class:today={isToday} class:before={isBefore}>
    {date.format('{day-short} {date-ordinal}')}
  </div>
  <textarea class="textarea" resizable="false" bind:value on:input={onInput} bind:this={el} />
  {#if date.dayName() === 'friday'}
    <hr style="margin-top:10px; background-color:lightgrey;" />
  {/if}
</div>
