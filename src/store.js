import { writable, derived } from 'svelte/store'
import spacetime from 'spacetime'
import topk from './user/lib/topk'
import colors from './user/lib/colors'
let u = window.localStorage.getItem('user') || ''
let user = writable(u)
let p = window.localStorage.getItem('pass') || ''
let pass = writable(p)

let data = writable({
  _id: u,
  dates: {},
})

let date = writable(spacetime.today())

let parsed = derived(data, ($data) => {
  let days = {}
  let tags = []
  Object.keys($data.dates || {}).forEach((k) => {
    let txt = $data.dates[k]
    txt.split(/\n/).forEach((line) => {
      line = line.trim()
      let found = line.match(/^\.(\w+)/)
      if (found) {
        days[k] = days[k] || []
        days[k].push(found[1])
        tags.push(found[1])
      }
    })
  })
  let tagColors = {}
  tags = topk(tags).map((a, i) => {
    let c = colors[i] || 'steelblue'
    tagColors[a[0]] = c
    return {
      tag: a[0],
      count: a[1],
      color: c,
      checked: i === 0,
    }
  })

  return {
    days: days,
    tags: tags,
    colors: tagColors,
  }
})

export { data, date, user, pass, parsed }
