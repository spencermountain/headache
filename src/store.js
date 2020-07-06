import { writable } from 'svelte/store'
import spacetime from 'spacetime'

let data = writable({})

let fmt = spacetime.today().format('iso-short')
let date = writable(fmt)
export { data, date }
