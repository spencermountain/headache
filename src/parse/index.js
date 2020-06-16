const parse = function (txt) {
  let lines = txt.split(/\n/).map((text) => {
    let data = text.match(/\[.*?\]/g)
    data = data.map((part) => {
      let m = part.match(/\[(.*?):(.*?)\]/)
      return {
        key: m[1],
        val: m[2],
      }
    })
    return {
      text: text,
      data: data,
    }
  })
  return lines
}
module.exports = parse
