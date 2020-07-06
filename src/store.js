import { writable } from 'svelte/store'
import spacetime from 'spacetime'

let tmp = 'username'
let user = writable(tmp)
let pass = writable('foo')

let data = writable({
  _id: tmp,
  dates: {},
})

let date = writable(spacetime.today())

export { data, date, user, pass }
