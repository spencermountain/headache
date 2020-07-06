<script>
  import Day from './Day.svelte'
  import { read, write } from './01-couch'
  import spacetime from 'spacetime'
  export let user = 'username'
  import { data } from './store'
  // export let pass = ''

  $data = {
    _id: user,
    dates: {},
  }

  // import './02-encrypt.js'

  read(user).then(doc => {
    $data = doc
  })
  // initial set data

  const onClick = function() {
    console.log('change')
    $data.heyya = Math.random()
  }
  const writeNow = async function() {
    data.update(val => {
      let res = write(val)
      console.log('wrote')
      console.log(res)
      return val
    })
  }

  data.subscribe(val => {
    // console.log('-subscribe-')
    // writeNow()
  })

  let date = spacetime.today().format('iso-short')

  const goBack = function() {}
  const goNext = function() {}
</script>

<style>
  pre {
    color: white;
  }
</style>

<div>
  <button on:click={onClick}>update</button>
  <pre>{JSON.stringify($data, null, 2)}</pre>
  <button on:click={writeNow}>writeNow</button>
  <div class="m3">
    <button on:click={goBack}>&lt;</button>
    <Day {date} write={writeNow} />
    <button on:click={goNext}>&gt;</button>
  </div>
</div>
