(function() {

  // mapbox access token for aparr account
  L.mapbox.accessToken = 'pk.eyJ1IjoiYW5kcmVhcnBhcnIiLCJhIjoiY2o2NGJrODB0MG0weTJxbnp1M2h2cWppdyJ9.O4620rmp32gJntwavWnlaQ';

  // create the Leaflet map using mapbox.light tiles
  var map = L.mapbox.map('map', 'mapbox.dark', {
    zoomSnap: .1,
    center: [39.82, -98.58],
    zoom: 4,
    minZoom: 3,
    maxZoom: 12,
  });

  //load geojson files
  // var waterLayer = omnivore.geojson('data/water.geojson')
  //   .on('ready', function() {
  //     map.fitBounds(waterLayer.getBounds());
  //       waterLayer.eachLayer(function(layer){
  //         layer.bindPopup(layer.feature.properties.Utility);
  //       });
  //   })
  //   .addTo(map);
  //
  // var stateLayer = omnivore.geojson('data/statesummary.geojson')
  //   .on('ready', function() {
  //     map.fitBounds(stateLayer.getBounds());
  //       stateLayer.eachLayer(function(layer){
  //         layer.bindPopup(layer.feature.properties.popserved);
  //       });
  //   })
  //   .addTo(map)

  $.getJSON('data/statesum.json', function(data) {

    var stateLayer = L.geoJson(data, {
      style: function(feature) {
        return {
          color: '#dddddd',
          weight: 1,
          fillOpacity: .75,
        };
      }

    }).addTo(map);

    drawMap(stateLayer);
  });

  function drawMap(stateLayer) {

    var breaks = getClassBreaks(stateLayer);

    stateLayer.eachLayer(function(layer) {
      layer.setStyle({
        fillColor: getColor(layer.feature.properties.privateper, breaks)
      });
      layer.bindPopup("<b>" + layer.feature.properties.name + "</b><br>" +
        "Total Population Served: " + layer.feature.properties.popserved + "<br>" +
        "Total Water Systems: " + layer.feature.properties.totalwatersystems + "<br>" +
        "Total Water Facilities: " + layer.feature.properties.totalwaterfacilities + "<br>" +
        "Percent served by private utilities: " + (layer.feature.properties.privateper * 100).toFixed(2) + "%" + "<br>" +
        "Percent served by public utilities: " + (layer.feature.properties.publicper * 100).toFixed(2) + "%" + "<br>" +
        "Average annual water bill: $" + layer.feature.properties.avgbill)
    });

    drawLegend(breaks);

  }

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

    return d <= breaks[0][1] ? '#edf8fb' :
      d <= breaks[1][1] ? '#bfd3e6' :
      d <= breaks[2][1] ? '#9ebcda' :
      d <= breaks[3][1] ? '#8c96c6' :
      d <= breaks[4][1] ? '#8856a7' :
      '#810f7c';
  }

  function drawLegend(breaks) {

    var legend = L.control({
      position: 'topleft'
    });

    legend.onAdd = function() {

      var div = L.DomUtil.create('div', 'legend');

      div.innerHTML = "<h3><b>Pop Served by Private Water Systems</b></h3>";

      // for each of our breaks
                for (var i = 0; i < breaks.length; i++) {
                    // determine the color associated with each break value,
                    // including the lower range value
                    var color = getColor(breaks[i][0], breaks);
                    // concatenate a <span> tag styled with the color and the range values
                    // of that class and include a label with the low and a high ends of that class range
                    div.innerHTML +=
                        '<span style="background:' + color + '"></span> ' +
                        '<label>' + (breaks[i][0].toLocaleString()*100).toFixed(2) + '%' + ' &mdash; ' +
                        (breaks[i][1].toLocaleString()*100).toFixed(2) + '%' +'</label>';
                }

      return div;
    };

    legend.addTo(map);
  }


})();
