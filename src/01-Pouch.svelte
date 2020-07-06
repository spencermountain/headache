<script>
  import Day from './02-Day.svelte'
  import { getUser, saveUser } from './couch/index.js'
  import { data, date, user, pass } from './store'

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
</style>

<div>
  <pre>{JSON.stringify($data, null, 2)}</pre>
  <div class="m3 row nowrap">
    <button on:click={goBack}>&lt;</button>
    <Day write={writeNow} />
    <button on:click={goNext}>&gt;</button>
  </div>
</div>
