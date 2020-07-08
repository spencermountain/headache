<script>
  import { user, pass, data } from './store'
  let tmpUser = $user
  let tmpPass = $pass

  const handleSubmit = function(e) {
    $user = tmpUser
    $pass = tmpPass
    localStorage.setItem('user', tmpUser)
    localStorage.setItem('pass', tmpPass)
    e.preventDefault()
    return false
  }
</script>

<style>
  .container {
    color: white;
  }
  .button {
    color: steelblue;
    padding: 1rem;
  }
</style>

<div class="main container">
  <div class="row nowrap">
    headache
    <span class="f3">📉</span>
  </div>
  <form class="col">
    <input class="input m1 rounded" bind:value={tmpUser} placeholder="username" />
    <input class="input m1 rounded" bind:value={tmpPass} placeholder="password" type="password" />
    <button
      type="submit"
      on:submit|preventDefault={handleSubmit}
      class="button rounded f2 shadow"
      on:click={handleSubmit}>
      login
    </button>
  </form>
</div>
