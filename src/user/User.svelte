<script>
  import Day from './Day.svelte'
  export let logout
  import { getUser, saveUser } from './couch/index.js'
  import { data, date, user, pass } from '../store'

  // listen for username changes
  user.subscribe(val => {
    getUser($user, $pass).then(doc => {
      $data = doc
    })
  })

  const writeNow = function() {
    saveUser($data, $pass)
  }

  const goBack = () => date.update(d => d.minus(1, 'day'))
  const goNext = () => date.update(d => d.add(1, 'day'))
</script>

<style>
  pre {
    color: white;
    max-width: 20rem;
  }
  .row-right {
    justify-content: flex-end;
  }
  #scroll {
    width: 200px;
    height: 100%;
    overflow-y: scroll;
    border: 1px solid white;
  }
  #write {
    flex-grow: 1;
  }
  #date {
    width: 200px;
    height: 100%;
  }
  .note {
    height: 150px;
    width: 100%;
    border: 1px solid white;
  }
  .container {
    align-items: flex-start;
  }
</style>

<div class="row container">
  <div id="scroll">
    {#each Object.keys($data.dates) as date}
      <div class="col note">
        <div class="left blue ulred">{date}</div>
        <div>{$data.dates[date]}</div>
      </div>
    {/each}
  </div>
  <div id="write">
    <!-- <pre>{JSON.stringify($data, null, 2)}</pre> -->
    <Day write={writeNow} />
  </div>
  <div id="date">
    <div class="row row-right">
      <button class="rounded" on:click={logout}>logout</button>
    </div>
    <div class="f2 blue">{$date.format('{month} {date-ordinal}')}</div>
  </div>

</div>
