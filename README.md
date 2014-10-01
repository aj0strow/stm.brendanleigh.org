# Montreal Metro Project

```
ALL PHOTO URLS ARE COPYRIGHT. DONT STEAL THEM.
```

My friend Brendan Leigh is a talented photographer. For his first major project, kind of a graduation from taking Sucka Free club pictures, he went around to every metro station of Montreal capturing killer shots. He hit me up to turn the project into an interactive subway map.

We weren't really sure what an interactive map would look like, we just knew we wanted one. The first feature would be when you click a metro station, it shows the corresponding picture. 

### Subway Coordinates

To handle multiple screens and arbitrary resizing we needed the percentage coordinates for every metro station on the map. To begin we picked a large metro map from google images and centered it to fit the screen. One nasty bug we ran into was forgetting the doctype. I figured it didn't matter, but without the doctype the window object doesn't know it's own size and other quirky behavior. The doctype does matter. 

```html
<!-- index.html (incomplete) -->

<body>
  <div id="map">
    <img src="/metro-map.jpg">
  </div>
</body>
```

The map is set to the same size as the picture to be safe. Probably would get proper mouse click event offset coordinates without it. 

```css
#map {
  width: 800px;
  height: 1027px;
}
```

The stations were stored in a json array called `stm` on the window object. Each mouse click is captured and the position in json is logged to the console for copy paste purposes. 

```javascript
window.stm = [
  { id: 'name of metro', x: 32.2398479, y: 76.238491, url: 'url/to-his-photo' }
]

$(function () {
  $('#map').on('mousedown', function (ev) {
    var x = (ev.offsetX / 800) * 100
    var y = (ev.offsetY / 1027) * 100
    console.log('{ x: ' + x + ', y: ' + y + ', id: "", url: "" },')
  })
})
```
Brendan's a dedicated worker so I did dishes and he clicked every station and filled out the json array. To help him out each station is rendered as an "x" over the map to make sure the clicks were accurate.

```javascript
// quick stuff
function fmt(str) {
  var args = [].slice.call(arguments, 1)
  while (args.length) {
    str = str.replace(/\$[a-z]+/, args.shift())
  }
  return str
}

Object.keys(window.stm).forEach(function (key) {
  var station = window.stm[key]
  var marker = fmt('<span class="station" style="left: $x%; top: $y%;"></span>, station.x, station.y)
  $('#map').append(marker)
})
```

### Render Map

The next step was to render the map. Raphael is an svg drawing library that can handle circles, so we used that. I also added in underscore and Eric's css reset. 

```javascript
$(function () {
  var $map = $('#map')
  var $paper = null

  $(window).resize(_.debounce(resize, 500, false))
  resize()

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
  }
})  
```

The map looks pretty nice on a dark background. Very recognizable for people commuting in Montreal.

### Click A Station

The problem was that the dots were too small to click. At first I tried to do collision detection on each click, but a much better solution was to draw a transparent click-area circle over the visible dot. This is actually a common pattern.

```javascript
// inside plot function

    // draw invisible larger click area
    var target = $paper.circle(point.x, point.y, 10)
    $(target.node).attr({
      'class': 'stm-target',
      'data-id': station.id,
    })
    station.target = target
```

And some styling for css hover affects.

```css
.stm-target {
  z-index: 1;
  cursor: pointer;
  fill: transparent;
  stroke: transparent;
}

.stm-target:hover {
  fill: #fff;
}
```

The stations needed to be in an object by id, but now we could render the picture when the station was clicked. Important to use event delegation so the click handler is on the map instead of on points that can be removed and redrawn when the window is resized. 

```javascript
  // click a station
  $map.on('click', '.stm-target', function (ev) {
    ev.stopPropagation()
    var id = $(ev.target).attr('data-id')
    render(window.stm[id])
  })
```

The helper functions have global variables, nested functions, and other things that don't belong on a blog. 

### Background

The photos are rendered as a background image. Brendan didn't want any part of the image cut off so we opted for a 5px border and contain sizing. I tried preloading images but there's still a flicker due to the white background.

```css
background {
  /* full screen with border */
  position: fixed;
  top: 5px;
  left: 5px;
  bottom: 5px;
  right: 5px;

  /* fade in and out */
  transition: all .7s linear;

  /* dont resize */
  background-size: contain;
  background-position: center center;

  background-repeat: no-repeat;
  z-index: -1;
}
```

To discourage potential infringers, when you try to right-click the picture a little copyright notice is displayed in the middle of the screen. 

```javascript
  $background.on('contextmenu', function (ev) {
    ev.preventDefault()
    $copyright.show()
  })
```

The finished project has the ability to follow a line and colors in stations you've visited. Check it out [stm.brendanleigh.org](stm.brendanleigh.org).
