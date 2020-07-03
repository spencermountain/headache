<script>
  import spacetime from 'spacetime'
  let now = spacetime.now()
  export let date = now
  console.log(now)
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
      fill: w.isSame(date, 'week'),
      colors: cols,
      opacity: w.isAfter(now) ? 0.2 : 0.7,
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
  .isNow {
    /* border-left: 2px solid white; */
    /* height: 20px; */
    /* padding-left: 30px; */
  }
  .mh1 {
    margin-left: 0.75rem;
    margin-right: 0.75rem;
  }
  .week {
    justify-content: center;
  }
</style>

<div class="col">
  <div class="year row nowrap">
    <div>&lt;</div>
    <div class="mh1">{s.year()}</div>
    <div>&gt;</div>
  </div>
  {#each weeks as w}
    <div class="row nowrap week" class:isNow={w.fill}>
      <div
        class="day"
        style="border:1px solid {w.colors[0]}; opacity:{w.opacity}; background-color:{w.fill ? w.colors[0] : 'none'};" />
      <div
        class="day"
        style="border:1px solid {w.colors[1]}; opacity:{w.opacity}; background-color:{w.fill ? w.colors[1] : 'none'};" />
      <div
        class="day"
        style="border:1px solid {w.colors[2]}; opacity:{w.opacity}; background-color:{w.fill ? w.colors[2] : 'none'};" />
      <div
        class="day"
        style="border:1px solid {w.colors[3]}; opacity:{w.opacity}; background-color:{w.fill ? w.colors[3] : 'none'};" />
      <div
        class="day"
        style="border:1px solid {w.colors[4]}; opacity:{w.opacity}; background-color:{w.fill ? w.colors[4] : 'none'};" />
      <div
        class="day"
        style="border:1px solid {w.colors[5]}; opacity:{w.opacity}; background-color:{w.fill ? w.colors[5] : 'none'};" />
      <div
        class="day"
        style="border:1px solid {w.colors[6]}; opacity:{w.opacity}; background-color:{w.fill ? w.colors[6] : 'none'};" />
    </div>
  {/each}
</div>
