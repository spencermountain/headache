<script>
  import Day from './Day.svelte'
  import { read, write } from './01-couch'
  import spacetime from 'spacetime'
  export let user = 'username'
  import { data, date } from './store'
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

  const goBack = function() {
    date.update(fmt => {
      let d = spacetime(fmt).minus(1, 'day')
      return d.format('iso-short')
    })
  }
  const goNext = function() {
    date.update(fmt => {
      let d = spacetime(fmt).add(1, 'day')
      return d.format('iso-short')
    })
  }
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
  <div class="m3 row nowrap">
    <button on:click={goBack}>&lt;</button>
    <Day write={writeNow} />
    <button on:click={goNext}>&gt;</button>
  </div>
</div>
