const topk = function (arr) {
  let obj = {}
  arr.forEach((a) => {
    obj[a] = obj[a] || 0
    obj[a] += 1
  })
  let res = Object.keys(obj).map((k) => [k, obj[k]])
  return res.sort((a, b) => (a[1] > b[1] ? -1 : 0)).reverse()
}
export default topk
