$(function () {
  var UP = 38
  var DOWN = 40
  var LEFT  = 39
  var RIGHT = 37
  var ESCAPE = 27

  var $container = $('#container')
  var $background = $('#background')
  var $label = $('#metro')
  var $map = $('#map')
  var $paper = null
  var $line = null
  var $station = null
  var $history = []

  init()

  function init () {
    resize()
    $(window).resize($.debounce(500, resize))

    $('.stm-line').on('click', function (ev) {
      ev.stopPropagation()
      var data = ev.target.dataset
      $line = data.line
      navigate(window.stm[data.station])
    })

    $(document).keydown(function (ev) {
      var key = ev.which
      if (key == UP) {
        next('y', -1)
      } else if (key == DOWN) {
        next('y', 1)
      } else if (key == LEFT) {
        next('x', 1)
      } else if (key == RIGHT) {
        next('x', -1)
      } else if (key == ESCAPE) {
        map(true)
      }
      $('#copyright').hide()
    })

    $background.on('click', function (ev) {
      map(true)
      $('#copyright').hide()
    })

    $background.on('contextmenu', function (ev) {
      ev.preventDefault()
      $('#copyright').show()
    })

    $container.on('click', function (ev) {
      if (!$station) { navigate() }
      else { map(false) }
    })

    $map.on('click', '.stm-target', function (ev) {
      ev.stopPropagation()
      render(window.stm[ev.target.dataset.id])
      map(false)
      $('#copyright').hide()
    })
  }

  function next (property, sign) {
    if (!$station) { return navigate() }
    var line = $station.lines[$line]
    var stations = _.compact([ stm[line.next], stm[line.prev] ])

    function distance (stn) {
      return ($station.point[property] - stn.point[property]) * sign
    }

    var station = _.min(stations, distance)

    if (distance(station) > 6) {
      map(true)
    } else {
      navigate(station)
    }
  }

  function navigate (station) {
    if (!station) {
      var ids = Object.keys(window.stm)
      var index = Math.floor(Math.random() * ids.length)
      station = window.stm[ids[index]]
    }
    map(true)
    render(station) 
    var target = station.target.node
    target.setAttribute('class', 'stm-target active')   
    setTimeout(function () {
      target.setAttribute('class', 'stm-target')
      map(false)
    }, 800)
  }

  function resize () {
    // set map height
    var height = $(window).height() * 1.2
    var width = height * (800 / 1027) * 1.2
    $map.width(width).height(height)

    // draw points
    $paper = Raphael($map[0], width, height)
    $('circle', $map).remove()
    Object.keys(window.stm).forEach(function (id) {
      plot(window.stm[id])
    })
    tooltip()
  }

  function plot (station) {
    // pct to pixels
    var point = toPixels(station)
    station.point = point

    // draw visible point
    var circle = $paper.circle(point.x, point.y, 4)
    circle.attr('fill', '#eee')
    circle.attr('stroke', '#eee')
    station.circle = circle

    // draw invisible larger click area
    var target = $paper.circle(point.x, point.y, 10)
    target.node.dataset.id = station.id
    target.node.setAttribute('class', 'stm-target')
    station.target = target
  }

  function render (station) {
    remember(station)
    $label.text(station.id)
    $background.show().css({
      'background-image': 'url("' + station.url + '")',
    })
    station.circle.attr('fill', station.color)
    station.circle.attr('stroke', station.color)
  }

  function remember (station) {
    if (!$line || !station.lines[$line]) {
      $line = Object.keys(station.lines)[0]
    } 
    $history.push($station)
    $station = station
  }

  function tooltip () {
    $('.stm-target').tipsy({ gravity: 's', fade: true, title: 'data-id' })
  }

  function map (visible) {
    if (visible) {
      return $container.fadeIn()
    } else {
      $('.tipsy').remove()
      return $container.fadeOut()
    }
  }

  function toPixels (station) {
    var width = $map.width()
    var height = $map.height()
    return { x: station.x * width, y: station.y * height }
  }
})
