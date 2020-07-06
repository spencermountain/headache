<script>
  import Day from './Day.svelte'
  import { setContext } from 'svelte'
  import { read, write } from './01-couch'
  import { writable } from 'svelte/store'
  import spacetime from 'spacetime'
  export let user = 'username'
  // export let pass = ''

  export let data = writable({
    _id: user,
  })

  // import './02-encrypt.js'

  read(user).then(doc => {
    // console.log(doc)
    $data = doc
  })
  // initial set data

  const onClick = function() {
    console.log('change')
    $data.heyya = Math.random()
  }
  const writeNow = async function() {
    data.update(val => {
      // console.log(val)
      let res = write(val)
      console.log('wrote')
      console.log(res)
      return val
    })
  }
  // })
  let date = spacetime.today().format('iso-short')
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
    <Day {date} />
  </div>
</div>
