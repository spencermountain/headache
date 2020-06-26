<script>
  import spacetime from 'spacetime'
  export let date = spacetime.now()
  let s = date.startOf('year')
  let weeks = s.every('week', s.endOf('year'))
  let colors = ['#3E7995', '#6E9588', '#87B0B7', '#8797B7', '#B0BC93']
  weeks = weeks.map((w, i) => {
    let cols = w.every('day', w.endOf('week').add(1, 'second')).map(d => {
      return colors[d.month() % colors.length]
    })
    return {
      month: w.month(),
      iso: w.format('iso-short'),
      colors: cols,
    }
  })
  console.log(weeks)
</script>

<style>
  .day {
    border: 1px solid white;
    width: 8px;
    height: 8px;
    /* margin: 2px; */
    opacity: 0.6;
  }
  .year {
    font-size: 1rem;
  }
</style>

<div class="col">
  <div class="year">{s.year()}</div>
  {#each weeks as w}
    <div class="row nowrap week">
      <div class="day" style="border:1px solid {w.colors[0]};" />
      <div class="day" style="border:1px solid {w.colors[1]};" />
      <div class="day" style="border:1px solid {w.colors[2]};" />
      <div class="day" style="border:1px solid {w.colors[3]};" />
      <div class="day" style="border:1px solid {w.colors[4]};" />
      <div class="day" style="border:1px solid {w.colors[5]};" />
      <div class="day" style="border:1px solid {w.colors[6]};" />
    </div>
  {/each}
</div>
