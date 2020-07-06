import { read, write } from './01-crud'
import { encryptObj, decryptObj } from './02-encrypt'

// fetch all data for username, and decrypt it
export const getUser = function (user, pass) {
  return read(user).then((doc) => {
    doc = decryptObj(doc, pass)
    return doc
  })
}

export const saveUser = function (obj, pass) {
  let tmp = Object.assign({}, obj)
  tmp = encryptObj(tmp, pass)
  write(tmp)
}
