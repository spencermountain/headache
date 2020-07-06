import { writable } from 'svelte/store'
import spacetime from 'spacetime'

let data = writable({})

let date = writable(spacetime.today())

let user = writable('username')
let pass = writable('')

export { data, date, user, pass }
