import App from './src/App.svelte'

let u = undefined
// wire-in query params
const URLSearchParams = window.URLSearchParams
if (typeof URLSearchParams !== undefined) {
  const urlParams = new URLSearchParams(window.location.search)
  const myParam = urlParams.get('u')
  if (myParam) {
    u = myParam
  }
}

const app = new App({
  target: document.body,
  props: { u: u },
})

export default app
