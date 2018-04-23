var data = [];

function getColor(entry) {
  if(entry.review) {
    return '6666FF';
  }
  if (entry.posterCount === 0) {
    return '666666';
  }
  if (entry.withoutAuthorization === true) {
    return '66FF66'
  }
  if (entry.withoutAuthorization === false) {
    return 'FFCC66'
  }
  return 'CC6666'
  // str = btoa(entry.gemeinde.gemeinde + entry.location.value);
  // var hex = '';
  // for (var i = 0; i < str.length; i++) {
  //   hex += '' + str.charCodeAt(i).toString(16);
  // }
  // return hex.substring(hex.length - 6).toUpperCase();
}

function refreshMap(filtered) {
  document.getElementById('map').innerHTML = 'Lade Karte ...';
  var vectorSource = new ol.source.Vector();
  for (var i = 0; i < data.length; i++) {
    if (data[i].location.coordinates === null || (filtered && data[i].posterCount === 0)) {
      continue;
    }
    var polygon = new ol.geom.Polygon(data[i].location.coordinates.map(function(coords) {
      return coords.split(' ').map(function(coord) {
        return coord.split(',').map(function(f) {
          return parseFloat(f);
        });
      });
    }));
    polygon.applyTransform(ol.proj.getTransform('EPSG:4326', 'EPSG:3857'));
    var feature = new ol.Feature(polygon);
    var rgb = getColor(data[i]),
      r = parseInt(rgb.substr(0, 2), 16),
      g = parseInt(rgb.substr(2, 2), 16),
      b = parseInt(rgb.substr(4, 2), 16);
    feature.setStyle(new ol.style.Style({
      fill: new ol.style.Fill({
        color: [r, g, b, 0.2]
      }),
      stroke: new ol.style.Stroke({
        color: [r, g, b, 0.6],
        width: 2
      }),
      text: new ol.style.Text({
        text: '' + data[i].posterCount,
        fill: new ol.style.Fill({
          color: "#000000"
        }),
        stroke: new ol.style.Stroke({
          color: "#FFFFFF",
          width: 2
        })
      })
    }));
    vectorSource.addFeature(feature);
  }
  var vectorLayer = new ol.layer.Vector({
    source: vectorSource
  });

  document.getElementById('map').innerHTML = '';
  var map = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      }),
      vectorLayer
    ],
    target: 'map',
    view: new ol.View({
      center: [1415887.1440500917, 6222030.408660727],
      zoom: 9
    })
  });
}

function refreshTable(filtered) {
  var listTarget = document.getElementById('list');
  listTarget.innerHTML = 'Lade Liste ...';
  var table = '<table cellspacing="0"><thead><tr>' +
    '<th>Landkreis</th>' +
    '<th>Gemeinde</th>' +
    '<th>Adresse</th>' +
    '<th>Kontakt</th>' +
    '<th>E-Mail-Adresse</th>' +
    '<th>Einwohner</th>' +
    '<th>Plakate (berechnet)</th>' +
    '<th>Genehmigungsfrei?</th>' +
    '<th>Regelungen</th>' +
    '<th>Plakatierungsbeginn</th>' +
    '<th>Plakatierungsende</th>' +
    '</tr></thead><tbody>';
  var lastLandkreis = '';
  var emailMap = {};
  for (var i = 0; i < data.length; i++) {
    if (filtered && data[i].posterCount === 0) {
      continue;
    }
    table += '<tr class="' +
      (data[i].posterCount > 0 ? '' : 'no-poster') +
      (data[i].location.duplicate ? ' duplicate' : '') +
      (data[i].location.notFound ? ' not-found' : '') + '">';
    table += '<td class="' +
      (data[i].gemeinde.landkreis === null ? 'kreisfrei ' : '') +
      (data[i].gemeinde.landkreis !== null && lastLandkreis === data[i].gemeinde.landkreis ? 'not-first-of-lkr' : 'first-of-lkr') +
      '">' + (data[i].gemeinde.landkreis === null ? 'Kreisfrei' : data[i].gemeinde.landkreis) + '</td>';
    lastLandkreis = data[i].gemeinde.landkreis;
    table += `<td class="col-gemeinde" style="background: #${getColor(data[i])};">${data[i].gemeinde.gemeinde}</td>`;
    table += `<td>${data[i].gemeinde.adresse.replace('\n','<br>')}</td>`;
    table += `<td>${data[i].gemeinde.kontakt.replace('\n','<br>')}</td>`;
    var cellStyle = data[i].gemeinde.email && data[i].gemeinde.email.replace(/\s+/, '').length ? '' : 'background: red;';
    var emailDuplicateInfo = data[i].gemeinde.email != null && emailMap[data[i].gemeinde.email] ? ' (<span title="' + emailMap[data[i].gemeinde.email].join(', ') + '">bereits verwendet</span>)' : ''
    emailMap[data[i].gemeinde.email || 'null'] = emailMap[data[i].gemeinde.email || 'null'] || [];
    emailMap[data[i].gemeinde.email || 'null'].push(data[i].gemeinde.gemeinde);
    table += `<td style="${cellStyle}">${data[i].gemeinde.email || ''} ${emailDuplicateInfo}</td>`;
    table += `<td>${data[i].location.value}</td>`;
    table += `<td>${data[i].posterCount}</td>`;
    table += `<td>${data[i].withoutAuthorization === true ? 'Ja' : (data[i].withoutAuthorization === true ? 'Nein' : 'Unbekannt')}</td>`;
    table += `<td>${data[i].rules || ''}</td>`;
    table += `<td>${data[i].before || ''}</td>`;
    table += `<td>${data[i].after || ''}</td>`;
    table += '</tr>';
  }
  table += '</tbody></table>';
  listTarget.innerHTML = table;

  var textarea = document.getElementById('csv-textarea');
  var lineNumber = 0;
  textarea.value = 'NR;EMAIL;ORT\n';
  for (var email in emailMap) {
    if (emailMap.hasOwnProperty(email)) {
      textarea.value += (++lineNumber) + ';"' + email + '";"' + emailMap[email].join(', ').replace('"', '""') + '"\n';
    }
  }
}

fetch('data.json').then(d => d.json()).then(d => {
  data = d;
  refreshMap(checkbox.checked);
  refreshTable(checkbox.checked);
});
var checkbox = document.getElementById('filter-checkbox');
checkbox.onchange = function() {
  refreshMap(checkbox.checked);
  refreshTable(checkbox.checked);
}
