<script>
  import User from './user/User.svelte'
  import Login from './Login.svelte'
  import { user, pass, data } from './store'
  const logout = function() {
    $user = ''
    $pass = ''
    localStorage.setItem('user', '')
    localStorage.setItem('pass', '')
    $data = {}
  }
</script>

{#if !$user}
  <Login />
{:else}
  <User {logout} />
{/if}
