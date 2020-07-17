<script>
  import spacetime from 'spacetime'
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
  const submit = () => {}

  let text = 'in the .town where i was born.. there liv.ed a man'
  let date = spacetime.now()
</script>

{#if !$user}
  <Login />
{:else}
  <User {logout} />
{/if}
