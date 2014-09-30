$(function () {

  // constants

  var UP = 38
  var DOWN = 40
  var LEFT  = 39
  var RIGHT = 37
  var ESCAPE = 27

  // globals

  var $container = $('#container')
  var $background = $('#background')
  var $label = $('#metro')
  var $map = $('#map')
  var $copyright = $('#copyright')
  var $paper = null
  var $line = null
  var $station = null
  var $history = []
  var $preload = []

  // ui handlers

  $(window).resize(_.debounce(resize, 500, false))

  $(document).keydown(_.debounce(keydown, 300, true))

  $background.on('click', function (ev) {
    map(true)
  })

  $background.on('contextmenu', function (ev) {
    ev.preventDefault()
    $copyright.show()
  })

  $container.on('click', function (ev) {
    if (!$station) { navigate() }
    else { map(false) }
  })

  // click ride a line
  $('.stm-line').on('click', function (ev) {
    ev.stopPropagation()
    var target = $(ev.target)
    $line = target.attr('data-line')
    var id = target.attr('data-station')
    navigate(window.stm[id])
  })

  // click a station
  $map.on('click', '.stm-target', function (ev) {
    ev.stopPropagation()
    var id = $(ev.target).attr('data-id')
    render(window.stm[id])
    map(false)
  })

  // init

  resize()

  // lib

  function keydown (ev) {
    switch (ev.which) {
    case UP:
      next('y', -1)
      break
    case DOWN:
      next('y', 1)
      break
    case LEFT:
      next('x', 1)
      break
    case RIGHT:
      next('x', -1)
      break
    case ESCAPE:
      map(true)
      break
    }
  }

  function next (property, sign) {
    if (!$station) { return navigate() }
    var line = $station.lines[$line]
    var stations = _.compact([ stm[line.next], stm[line.prev] ])

    function distance (stn) {
      return ($station.point[property] - stn.point[property]) * sign
    }

    var station = _.min(stations, distance)

    if (distance(station) < 0) {
      navigate(station)
    } else if (stations.length < 2) {
      map(true)
    } else {
      station = _.find(stations, function (stn) {
        return stn != _.last($history)
      })
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
    $(station.target.node).attr('class', 'stm-target active')
    render(station)
    setTimeout(function () {
      $(station.target.node).attr('class', 'stm-target')
      map(false)
    }, 800)
  }

  function resize () {
    // the ratio 800x1027 is from metro-map.png
    // magic number 1.2 determined experimentally
    var height = $(window).height() * 1.2
    var width = height * (800 / 1027) * 1.2
    $map.width(width).height(height)

    // remove old canvase
    if ($paper) { $paper.remove() }

    // draw new points
    $paper = Raphael($map[0], width, height)
    _.each(window.stm, plot)
    tooltip(true)
  }

  function plot (station) {
    // pct to pixels
    var point = {
      x: station.x * $map.width(),
      y: station.y * $map.height(),
    }
    station.point = point

    // draw visible point
    var circle = $paper.circle(point.x, point.y, 4)
    circle.attr('fill', '#ddd')
    circle.attr('stroke', '#ddd')
    station.circle = circle

    // draw invisible larger click area
    var target = $paper.circle(point.x, point.y, 10)
    $(target.node).attr({
      'class': 'stm-target',
      'data-id': station.id,
    })
    station.target = target
  }

  function render (station) {
    // history
    if (!$line || !station.lines[$line]) {
      $line = _.first(_.keys(station.lines))
    }
    $history.push($station)
    $station = station

    // visible change
    $label.text(station.id)
    $background.show().css({
      'background-image': 'url("' + station.url + '")',
    })
    station.circle.attr('fill', station.color)
    station.circle.attr('stroke', station.color)

    // preload next stations
    var line = station.lines[$line]
    var ids = _.compact([ line.next, line.prev ])
    _.each(ids, function (id) {
      $.get(window.stm[id].url)
    })
  }

  function tooltip (yes) {
    if (yes) {
      $('.stm-target').tipsy({ gravity: 's', fade: true, title: 'data-id' })
    } else {
      $('.tipsy').remove()
    }
  }

  function map (yes) {
    if (yes) {
      $copyright.hide()
      $container.fadeIn()
    } else {
      tooltip(false)
      $container.fadeOut()
    }
  }
})
