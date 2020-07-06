<script>
  import Day from './02-Day.svelte'
  import { read, write } from './lib/01-couch'
  import spacetime from 'spacetime'
  import { data, date, user } from './store'

  $data = {
    _id: $user,
    dates: {},
  }

  read($user).then(doc => {
    $data = doc
  })

  // listen for username changes
  user.subscribe(val => {
    console.log(val)
    read(val).then(doc => {
      $data = doc
    })
  })

  const writeNow = async function() {
    data.update(val => {
      let res = write(val)
      console.log('wrote')
      console.log(res)
      return val
    })
  }

  const goBack = function() {
    date.update(d => {
      return d.minus(1, 'day')
    })
  }
  const goNext = function() {
    date.update(d => {
      return d.add(1, 'day')
    })
  }
</script>

<style>
  pre {
    color: white;
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
