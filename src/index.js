var request = require('superagent')
var spacetime = require('spacetime')
var d3Scale = require('d3-scale')

const API_KEY = 'd15db3dda663a76c0a93fad2037e0deb' //make your own, i don't care.
const latlng = '43.6529,-79.3849' //toronto
const timezone = 'Canada/Eastern'
const hours = 4 //duration to look back

const average = 1016
const deviation = 18 //highest=1034, lowest=998
const scale = d3Scale
  .scaleLinear()
  .domain([average - deviation, average + deviation])
  .range([0, 100])

const inScale = function(pressure) {
  return parseInt(scale(pressure))
}

const comparison = function(now, then, hours) {
  let time = spacetime
    .now(timezone)
    .subtract(hours, 'hours')
    .time()
  let diff = inScale(now) - inScale(then)
  let opacity = diff / 100 * 2
  if (opacity < 0.3) {
    opacity = 0.3
  }
  if (opacity > 1) {
    opacity = 1
  }
  let color = '#DE6169'
  if (diff > 0) {
    color = '#198E3B'
    diff = '+' + diff
  }
  let html = `<span style="font-size:50px; color:lightgrey;"><b style="opacity:${opacity}; font-size:90px; color:${color};">${diff}</b>%</span>`
  html += '<div style="font-size:36px; margin-left:20%; color:lightgrey;">since ' + time + '</div>'
  html = '<p style="margin:12px;">' + html + '</p>'
  return html
}

const main = function(req, res) {
  let current = spacetime.now(timezone).epoch
  current = parseInt(current / 1000)
  let before = spacetime.now(timezone).subtract(hours, 'hours')
  let thenTime = before.time()
  before = parseInt(before.epoch / 1000)
  const url = `https://api.darksky.net/forecast/${API_KEY}/${latlng},${before}?exclude=daily,flags,alerts`
  request.get(url, function(err, response) {
    let r = JSON.parse(response.text)
    let html = `<div style="font-size:35px; text-align:center; margin-top:7%; font-family:'Montserrat', sans-serif;">`
    html += '<i style="color:#DBADB4;">currently</i>'
    html += `<div style="color:#D49558; font-size:75px;">`
    html += `<span style="font-size:120px; ">${inScale(r.currently.pressure)}</span>`
    html += `%</div>`
    html += '<div style="color:#DBADB4;">the pressure in Toronto changed:</div>'
    html += comparison(r.currently.pressure, r.hourly.data[0].pressure, 4)
    html += comparison(r.currently.pressure, r.hourly.data[2].pressure, 2)
    html += '</div>'
    // res.status(200)
    html =
      '<head><link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet"></head><body>' +
      html +
      '</body>'
    res.send(html)
  })
}
module.exports = {
  main: main
}
