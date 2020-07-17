<script>
  import Input from './Input.svelte'
  import Output from './output/Output.svelte'
  import TagList from './TagList.svelte'
  import Today from './Today.svelte'
  export let logout
  import { getUser, saveUser } from './couch/index.js'
  import { data, date, user, pass } from '../store'

  // listen for username changes
  user.subscribe(val => {
    getUser($user, $pass).then(doc => {
      $data = doc
    })
  })

  const save = function() {
    saveUser($data, $pass)
  }

  // const goBack = () => date.update(d => d.minus(1, 'day'))
  // const goNext = () => date.update(d => d.add(1, 'day'))
</script>

<style>
  .page {
    display: flex;
    min-height: 97vh;
    flex-direction: column;
  }
  .container {
    align-items: flex-start;
    justify-content: flex-start;
    height: 100%;
    background-color: #3b4252;
  }

  .row-right {
    justify-content: flex-end;
  }
  .toprow {
    margin-top: 5rem;
    margin-bottom: 5rem;
  }

  .footer {
    width: 98%;
  }

  .middle {
    justify-content: middle;
    flex-grow: 1;
  }
  .button {
    background-color: lightgrey;
  }
</style>

<div class="page">

  <div class="row container">
    <div class="col middle">
      <div class="toprow">
        <Input {save} />
      </div>
      <Today />
      <TagList />
      <Output />
    </div>
  </div>

</div>
<div class="footer">
  <div class="row row-right">
    <button class="button rounded" on:click={logout}>logout</button>
  </div>
</div>
