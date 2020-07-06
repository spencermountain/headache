<script>
  import Pouch from './01-Pouch.svelte'
  export let u
  import { user, pass, data } from './store'
  if (u) {
    $user = u
  }
  let tmpUser = $user
  let tmpPass = $pass

  const handleSubmit = function(e) {
    $user = tmpUser
    $pass = tmpPass
    e.preventDefault()
    return false
  }
</script>

<style>
  .row-right {
    justify-content: flex-end;
  }
  .main {
    color: #c7cdd8;
  }
</style>

<div class="main">
  <div class="row row-right">
    <form>
      <input class="m1 rounded" bind:value={tmpUser} placeholder="username" />
      <input class="m1 rounded" bind:value={tmpPass} placeholder="password" type="password" />
      <button type="submit" on:submit|preventDefault={handleSubmit} class="rounded" on:click={handleSubmit}>go</button>
    </form>
  </div>

  <div class="m3">
    {#if $data !== null}
      <Pouch bind:user={$user} />
    {:else}
      <div>sign in ^</div>
    {/if}
  </div>

</div>
