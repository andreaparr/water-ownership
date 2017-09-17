(function() {

  // mapbox access token for aparr account
  L.mapbox.accessToken = 'pk.eyJ1IjoiYW5kcmVhcnBhcnIiLCJhIjoiY2o2NGJrODB0MG0weTJxbnp1M2h2cWppdyJ9.O4620rmp32gJntwavWnlaQ';

  // create the Leaflet map using mapbox.dark tiles
  var map = L.mapbox.map('map', 'mapbox.dark', {
    zoomSnap: .1,
    center: [39.82, -98.58], // center on the US
    zoom: 4,
    minZoom: 3,
    maxZoom: 12,
  });



  // load all the data here first
  $.when(
    $.getJSON('data/statesum.json'),
    $.getJSON('data/water.json')
  ).done(function(statesData, waterData) {

    // access data like so:
    console.log(statesData[0], waterData[0]);

    var stateLayer = L.geoJson(statesData[0], {
      style: function(feature) {
        return {
          color: '#dddddd',
          weight: 1,
          fillOpacity: .8,
        };
      }

    });
    drawInfo(stateLayer);
    drawMap(stateLayer);

    var waterLayer = L.geoJson(waterData[0], {
      pointToLayer: function(feature, coordinates) {
        var colors = {
            Private: '#ff4329',
            Public: '#1f78b4 ',
            Nonprofit: '#1f78b4' // for the purpose of this map, I'm not going to distinguish between public utilities and the three nonprofit utilities.
          };
        return L.circleMarker(coordinates, {
          color: colors[feature.properties.Owner],
          fillColor: colors[feature.properties.Owner],
          weight: 1,
          stroke: 1,
          fillOpacity: .2,
          radius: getRadius(feature.properties.Population),
        });
      },
    }).addTo(map);
    makePopup(waterLayer)

  });

  function drawInfo(stateLayer) {
    var info = L.control({position: 'bottomright'});
    info.onAdd = function(map) {
      var div = L.DomUtil.create('div', 'info');
      return div;
    }
    info.addTo(map);
    //$(".info").hide();
  }; // end drawInfo

  // this function is not working yet
  function updateInfo(layer) {

    var html = "<b>" + layer.feature.properties.name + "</b><br>" +
      "Total Population Served: " + layer.feature.properties.popserved + "<br>" +
      "Total Water Systems: " + layer.feature.properties.totalwatersystems + "<br>" +
      "Total Water Facilities: " + layer.feature.properties.totalwaterfacilities + "<br>" +
      "Percent served by private utilities: " + (layer.feature.properties.privateper * 100).toFixed(2) + "%" + "<br>" +
      "Percent served by public utilities: " + (layer.feature.properties.publicper * 100).toFixed(2) + "%" + "<br>" +
      "Average annual water bill: $" + layer.feature.properties.avgbill

    $(".info").html(html);
  }; // end updateInfo

  function drawMap(stateLayer) {

    var breaks = getClassBreaks(stateLayer);

    stateLayer.eachLayer(function(layer) {
      layer.setStyle({
        fillColor: getColor(layer.feature.properties.privateper, breaks)
      });
      layer.on('mouseover', function() {
        updateInfo(this);
      });
    }).addTo(map);
    drawLegend(breaks);

  }; // end drawMap

  function getClassBreaks(stateLayer) {

    var values = [];

    stateLayer.eachLayer(function(layer) {
      var value = layer.feature.properties.privateper
      values.push(value);
    });

    var clusters = ss.ckmeans(values, 6);

    var breaks = clusters.map(function(cluster) {
      return [cluster[0], cluster.pop()];
    });

    return breaks;

  }

  function getColor(d, breaks) {

    return d <= breaks[0][1] ? '#2166ac' :
      d <= breaks[1][1] ? '#67a9cf' :
      d <= breaks[2][1] ? '#d1e5f0' :
      d <= breaks[3][1] ? '#fddbc7' :
      d <= breaks[4][1] ? '#ef8a62' :
      '#b2182b';
  }

  function drawLegend(breaks) {

    var legend = L.control({
      position: 'topright'
    });

    legend.onAdd = function() {

      var div = L.DomUtil.create('div', 'legend');

      div.innerHTML = "<h3><b>Population Served by<br>Private Water Systems</b></h3>";

      // for each of our breaks
      for (var i = 0; i < breaks.length; i++) {
        // determine the color associated with each break value,
        // including the lower range value
        var color = getColor(breaks[i][0], breaks);
        // concatenate a <span> tag styled with the color and the range values
        // of that class and include a label with the low and a high ends of that class range
        div.innerHTML +=
          '<span style="background:' + color + '"></span> ' +
          '<label>' + (breaks[i][0].toLocaleString() * 100).toFixed(0) + '%' + ' &mdash; ' +
          (breaks[i][1].toLocaleString() * 100).toFixed(0) + '%' + '</label>';
      }

      div.innerHTML += "<h3><b>500 Largest Water Systems</b></h3>";
      div.innerHTML +="<body1>&#8226 Public Utility</body1><br><body2>&#8226 Private Utility</body2>"

      return div;
    };

    legend.addTo(map);
  };

  function getRadius(val) {
    var radius = Math.sqrt(val / Math.PI);
    return radius * .018;
  }

function makePopup(waterLayer) {
  waterLayer.eachLayer(function(layer) {
  layer.bindPopup("<b>Utility: " + layer.feature.properties.Utility + "</b><br>" +
    "Population Served: " + layer.feature.properties.Population + "<br>" +
    "Owner Type: " + layer.feature.properties.OwnerType + "<br>" +
    "Wholesaler: " + layer.feature.properties.Wholesaler + "<br>" +
    "Water Source: " + layer.feature.properties.Gwsw + "<br>" +
    "Average annual water bill: $" + layer.feature.properties.Bill + "<br>" +
    "Top 500 Rank by expense: " + layer.feature.properties.Rank)
})
};

})();
