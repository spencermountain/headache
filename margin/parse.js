const MarginItem = require('./MarginParser')
const TreeModel = require('./TreeModel')
class MarginTree extends TreeModel {}

const parse = function (txt) {
  var sampleTree = new MarginTree()
  let item = new MarginItem(txt)
  var res = sampleTree.parse(item).model
  return res
}

export default parse
// let txt = 'i am [key: val] trying this out'
// console.log(parse(txt))
