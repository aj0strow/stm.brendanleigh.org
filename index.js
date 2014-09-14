$(function () {
  var $window = $(window)
  var $background = $('#background')
  var $container = $('#container')

  var $map = $('#map')

  $window.resize(resizeMap)
  resizeMap()
  $container.click(hideMap)
  $background.click(showMap)

  $map.click(function (ev) {
    var point = findTargetPoint(ev)
    if (point) { setPoint(point) }
  })

  function findTargetPoint (ev) {
    var delta = 30
    var point = findClosestPoint(ev)
    if (distance({ x: ev.offsetX, y: ev.offsetY }, toPixels(point)) < delta) {
      ev.preventDefault()
      ev.stopPropagation()
      return point
    } else {
      return null
    }
  }

  function findClosestPoint (ev) {
    var point = { x: ev.offsetX, y: ev.offsetY }
    return points.sort(function (a, b) {      
      var da = distance(point, toPixels(a))
      var db = distance(point, toPixels(b))

      if (da < db) { return -1 }
      if (da > db) { return 1 }
      return 0
    })[0]
  }

  function setPoint (point) {
    $background.show().css({
      'background-image': 'url("' + point.url + '")',
      'opacity': 1.0,
    })
    $('#metro').text(point.metro)
    $('.tipsy').remove()
    hideMap()
  }

  function hideMap () {
    $container.fadeOut()
  }

  function showMap () {
    $container.fadeIn()
  }

  function distance (p1, p2) {
    var dx = Math.abs(p1.x - p2.x)
    var dy = Math.abs(p1.y - p2.y)
    return Math.sqrt(dx * dx + dy * dy)
  }

  function toPixels (point) {
    var width = $map.width()
    var height = $map.height()
    return { x: point.x * width, y: point.y * height }
  }

  function toPct (point) {
    var width = $map.width()
    var height = $map.height()
    return { x: point.x / width, y: point.y / height }
  }

  function resizeMap () {
    // image is only 1027px tall
    var height = $window.height() * 1.2
    var width = height * (800 / 1027) * 1.2
    $map.height(Math.round(height))
    $map.width(Math.round(width))
    $('circle').remove()
    drawPoints()
  }

  function drawPoints () {
    var paper = Raphael($map[0], $map.width(), $map.height())
    var radius = 5
    points.forEach(function (point) {
      var coords = toPixels(point)
      var circle = paper.circle(coords.x, coords.y, radius)
      circle.node.dataset.name = point.metro
    })
    $('circle').tipsy({ gravity: 's', fade: true, title: 'data-name' })
  }
})
