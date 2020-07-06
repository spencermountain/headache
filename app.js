import App from './src/App.svelte'

// allow bookmarking user/pass
let u = undefined
let p = undefined

// wire-in query params
const URLSearchParams = window.URLSearchParams
if (typeof URLSearchParams !== undefined) {
  const urlParams = new URLSearchParams(window.location.search)
  let param = urlParams.get('u')
  if (param) {
    u = param
  }
  param = urlParams.get('p')
  if (param) {
    p = param
  }
}

const app = new App({
  target: document.body,
  props: { u: u, p: p },
})

export default app
