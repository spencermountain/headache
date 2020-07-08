var CryptoJS = require('crypto-js')

// Encrypt
const encrypt = function (str, pass) {
  return CryptoJS.AES.encrypt(str, pass).toString()
}

// Decrypt
const decrypt = function (str, pass) {
  var bytes = CryptoJS.AES.decrypt(str, pass)
  var text = bytes.toString(CryptoJS.enc.Utf8)
  return text
}

const validate = function (obj) {
  obj = Object.assign({}, obj)
  obj.dates = obj.dates || {}
  obj.dates = Object.assign({}, obj.dates)
  return obj
}

const encryptObj = function (obj, pass) {
  obj = validate(obj)
  Object.keys(obj.dates).forEach((k) => {
    obj.dates[k] = encrypt(obj.dates[k], pass)
  })
  return obj
}
const decryptObj = function (obj, pass) {
  console.log(pass)
  obj = validate(obj)
  Object.keys(obj.dates).forEach((k) => {
    obj.dates[k] = decrypt(obj.dates[k], pass)
  })
  return obj
}

export { encryptObj, decryptObj }
