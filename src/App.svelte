<script>
  import Pouch from './01-Pouch.svelte'
  import { user, pass } from './store'
  let tmpUser = $user
  let tmpPass = $pass
  // export let pass = ''
  let okgo = true
</script>

<style>
  .row-right {
    justify-content: flex-end;
  }
</style>

<div class="main">
  <div class="row row-right">
    <input class="m1 rounded" bind:value={tmpUser} placeholder="username" />
    <input class="m1 rounded" bind:value={tmpPass} placeholder="password" type="password" />
    <button
      class="rounded"
      on:click={() => {
        okgo = true
        $user = tmpUser
        $pass = tmpPass
      }}>
      go
    </button>
  </div>
  <div class="m3">
    {#if okgo}
      <Pouch bind:user={$user} />
    {/if}
  </div>

</div>
