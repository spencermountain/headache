<script>
  import Pouch from './Pouch.svelte'
  export let user = 'username'
  // export let pass = 'pass'
</script>

<style>

</style>

<div class="main">
  <!-- <div class="row">
    <input bind:value={user} placeholder="username" />
    <input bind:value={pass} placeholder="password" type="password" />
  </div> -->
  <div class="m3">
    <Pouch bind:user />
  </div>

</div>
