<script>
  import User from './user/User.svelte'
  import Login from './Login.svelte'
  import CodeMirror from '../components/CodeMirror/CodeMirror.svelte'
  import { user, pass, data } from './store'
  const logout = function() {
    $user = ''
    $pass = ''
    localStorage.setItem('user', '')
    localStorage.setItem('pass', '')
    $data = {}
  }
  const submit = () => {}
  const highlight = function(str = '') {
    let matches = [...str.matchAll(/\.[^\s\.]+/g)]
    return matches.map(m => {
      return {
        start: m.index,
        end: m[0].length + m.index,
        tag: 'tag',
      }
    })
  }
  let text = 'in the .town where i was born.. there liv.ed a man'
</script>

<CodeMirror bind:text {highlight} />
{text}
{#if !$user}
  <!-- <Login /> -->
{:else}
  <!-- <User {logout} /> -->
{/if}
