<script>
  import Input from './Input.svelte'
  import Scroll from './Scroll.svelte'
  import DayPick from './DayPick.svelte'
  import Vertical from '../../components/Vertical.svelte'
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

  // const goBack = () => date.update(d => d.minus(1, 'day'))
  // const goNext = () => date.update(d => d.add(1, 'day'))
</script>

<style>
  .row-right {
    justify-content: flex-end;
  }

  #write {
    flex-grow: 1;
  }
  #date {
    width: 200px;
    height: 100%;
  }

  .container {
    align-items: flex-start;
    height: 100%;
  }
</style>

<div class="row container">
  <Scroll />
  <div id="write">
    <!-- <pre>{JSON.stringify($data, null, 2)}</pre> -->
    <Input write={writeNow} />
    <!-- <Vertical /> -->
  </div>
  <div id="date">
    <div class="row row-right">
      <button class="rounded" on:click={logout}>logout</button>
    </div>
    <div class="f2 blue">{$date.format('{month} {date-ordinal}')}</div>
    <div class="mt3">
      <!-- <DayPick /> -->
    </div>
  </div>

</div>
