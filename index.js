$(function () {
  var $container = $('#container')
  var $background = $('#background')
  var $label = $('#metro')
  var $map = $('#map')
  var $paper = null
  var $index = -1

  init()

  function init () {
    resize()
    $(window).resize($.debounce(500, resize))

    $(document).keydown(function (ev) {
      if (ev.keyCode == 39) {
        next()
      } else if (ev.keyCode == 37) {
        prev()
      }
    })

    $background.click(function () {
      map(true)
    })

    $container.click(function () {
      map(false)
    })

    $map.on('click', '.stm-target', function (ev) {
      ev.stopPropagation()
      render(ev.target.dataset)
    })
  }

  function next () {
    $index ++
    if (!points[$index]) {
      $index = 0
    }
    navigate(points[$index])
  }

  function prev () {
    $index --
    if (!points[$index]) {
      $index = points.length - 1
    }
    navigate(points[$index])
  }

  function navigate (point) {
    map(true)
    point.target.node.setAttribute('class', 'stm-target active')    
    setTimeout(function () {
      point.target.node.setAttribute('class', 'stm-target')
      render(point)
    }, 1000)
  }

  function resize () {
    // set map height
    var height = $(window).height() * 1.2
    var width = height * (800 / 1027) * 1.2
    $map.width(width).height(height)

    // draw points
    $paper = Raphael($map[0], width, height)
    $('circle', $map).remove()
    points.forEach(plot)
    tooltip()
  }

  function plot (point) {
    // pct to pixels
    var coords = toPixels(point)

    // draw visible point
    var circle = $paper.circle(coords.x, coords.y, 4)
    circle.node.setAttribute('class', 'stm-point')

    // draw invisible larger click area
    var target = $paper.circle(coords.x, coords.y, 10)
    target.node.dataset.metro = point.metro
    target.node.dataset.url = point.url
    target.node.setAttribute('class', 'stm-target')

    point.target = target
  }

  function render (data) {
    $label.text(data.metro)
    $background.show().css({
      'background-image': 'url("' + data.url + '")',
    })
    map(false)
  }

  function tooltip () {
    $('.stm-target').tipsy({ gravity: 's', fade: true, title: 'data-metro' })
  }

  function map (visible) {
    if (visible) {
      return $container.fadeIn()
    } else {
      $('.tipsy').remove()
      return $container.fadeOut()
    }
  }

  function toPixels (point) {
    var width = $map.width()
    var height = $map.height()
    return { x: point.x * width, y: point.y * height }
  }
})
