window.global = window
let db = new PouchDB('http://34.86.136.15:5984/headache') //eslint-disable-line

const read = async function (id) {
  return await db.get(id)
}

// 'upsert'
const write = async function (obj) {
  if (!obj._id) {
    console.warn('object needs a _id')
    return new Promise()
  }
  let doc = {}
  let latest = null
  try {
    doc = await db.get(obj._id)
    latest = doc._rev
    console.log('updating date')
  } catch (e) {
    console.log('inserting new date')
  }
  obj = Object.assign(doc, obj)
  obj._rev = latest
  let res = await db.put(obj)
  return res
}

export { read, write }
