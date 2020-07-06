window.global = window
let db = new PouchDB('http://34.86.136.15:5984/headache') //eslint-disable-line

const read = async function (id) {
  try {
    return await db.get(id)
  } catch (e) {
    console.log(e)
    return { username: id, dates: {} }
  }
}

// 'upsert'
const write = async function (obj) {
  if (!obj._id) {
    console.warn('object needs a _id')
    return {}
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
