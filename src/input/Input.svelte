<script>
  let text = ''
  import spacetime from 'spacetime'
  export let date = spacetime.now()
  import DayPick from '../../components/DayPick/DayPick.svelte'
  import HourPick from '../../components/HourPick/HourPick.svelte'
  import CodeMirror from '../../components/CodeMirror/CodeMirror.svelte'
  let render = null
  let input = null

  const highlight = function(str = '') {
    let matches = [...str.matchAll(/\.[^\s\.]+/g)]
    return matches.map(m => {
      return {
        start: m.index,
        end: m[0].length + m.index,
        tag: 'tag',
      }
    })
  }

  const onClick = function() {
    render.style.display = 'none'
    input.style.display = 'block'
    input.focus()
  }
  const focusout = function() {
    render.style.display = 'block'
    input.style.display = 'none'
  }
</script>

<style>
  .render {
    text-align: left;
    display: block;
  }
  .input {
    background-color: #3b4252 !important;
    border-left: 4px solid #51627e;
    color: white !important;
    max-width: 200px !important;
    min-width: 200px !important;
    margin: 0px !important;
    padding: 0px;
    padding-left: 1rem;
    display: none;
  }
  .row-middle {
    justify-content: center;
  }
</style>

<div>
  <div class="render" bind:this={render} on:click={onClick}>
    {date.format('{day-short} {month} {date-ordinal},  {hour}{ampm}')}
  </div>
  <input
    type="text"
    bind:this={input}
    class="input"
    on:focusout={focusout}
    value={date.format('{day-short} {month} {date-ordinal},  {hour}{ampm}')} />
  <CodeMirror bind:text {highlight} />
  <div class="row row-middle">
    <DayPick {date} callback={d => (date = d)} />
    <div class="m1">
      <HourPick {date} callback={d => (date = d)} />
    </div>
  </div>
</div>
