<script>
  let text = ''
  import spacetime from 'spacetime'
  export let date = spacetime.now()
  import { data } from '../store'
  export let save = () => {}
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
    date = spacetime(input.value)
    let d = new Date()
    date = date.minutes(d.getMinutes()).seconds(d.getSeconds())
  }
  const onEnter = function() {
    let fmt = date.format('iso')
    let str = text
    data.update(val => {
      val.dates = val.dates || {}
      val.dates[fmt] = text
      if (text === '') {
        delete val.dates[fmt]
      }
      save()
      return val
    })

    console.log('save')
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
  <CodeMirror bind:text {highlight} {onEnter} />
  <div class="row row-middle">
    <DayPick {date} callback={d => (date = d)} />
    <div class="m1">
      <HourPick {date} callback={d => (date = d)} />
    </div>
  </div>
</div>
