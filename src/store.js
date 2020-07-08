import { writable } from 'svelte/store'
import spacetime from 'spacetime'

let u = window.localStorage.getItem('user') || ''
let user = writable(u)
let p = window.localStorage.getItem('pass') || ''
let pass = writable(p)

let data = writable({
  _id: u,
  dates: {},
})

let date = writable(spacetime.today())

export { data, date, user, pass }
