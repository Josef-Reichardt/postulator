var data = [];

function getColor(entry, stroke) {
    if (stroke !== true && entry.review) {
        return '6666FF';
    }
    if (stroke !== true && (entry.posterCount === 0 || entry.posterCount2 === 0)) {
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

function refreshMap(hideWithoutPoster, hideAuthorizationRequired) {
    document.getElementById('map').innerHTML = 'Lade Karte ...';
    var vectorSource = new ol.source.Vector();
    for (var i = 0; i < data.length; i++) {
        if (data[i].location.coordinates === null || (hideWithoutPoster && (data[i].posterCount === 0 || data[i].posterCount2 === 0))
            || (hideAuthorizationRequired && data[i].withoutAuthorization !== true)) {
            continue;
        }
        var polygon = new ol.geom.Polygon(data[i].location.coordinates.map(function (coords) {
            return coords.split(' ').map(function (coord) {
                return coord.split(',').map(function (f) {
                    return parseFloat(f);
                });
            });
        }));
        polygon.applyTransform(ol.proj.getTransform('EPSG:4326', 'EPSG:3857'));
        var feature = new ol.Feature(polygon);
        var rgbFill = getColor(data[i], false),
            rFill = parseInt(rgbFill.substr(0, 2), 16),
            gFill = parseInt(rgbFill.substr(2, 2), 16),
            bFill = parseInt(rgbFill.substr(4, 2), 16),
            rgbStroke = getColor(data[i], true),
            rStroke = parseInt(rgbStroke.substr(0, 2), 16),
            gStroke = parseInt(rgbStroke.substr(2, 2), 16),
            bStroke = parseInt(rgbStroke.substr(4, 2), 16);
        feature.setStyle(new ol.style.Style({
            fill: new ol.style.Fill({
                color: [rFill, gFill, bFill, 0.2]
            }),
            stroke: new ol.style.Stroke({
                color: [rStroke, gStroke, bStroke, 0.6],
                width: 2
            }),
            text: new ol.style.Text({
                text: '' + data[i].posterCount2,
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

function refreshTable(hideWithoutPoster, hideAuthorizationRequired) {
    var listTarget = document.getElementById('list');
    listTarget.innerHTML = 'Lade Liste ...';
    var table = '<table cellspacing="0"><thead><tr>' +
        '<th>Landkreis</th>' +
        '<th>Gemeinde</th>' +
        '<th>Adresse</th>' +
        '<th>Kontakt</th>' +
        '<th>E-Mail-Adresse</th>' +
        '<th>Einwohner</th>' +
        // '<th>Plakate (berechnet Phase 1)</th>' +
        '<th>Genehmigungsfrei?</th>' +
        '<th>Regelungen / Kommentare</th>' +
        '<th>Plakatierungsbeginn</th>' +
        '<th>Plakatierungsende</th>' +
        // '<th>Plakate (berechnet Phase 2)</th>' +
        '<th>Plakate (manuell)</th>' +
        '</tr></thead><tbody>';
    var lastLandkreis = '';
    var emailMap = {};
    var locationsSum = 0;
    var posterSum = 0;
    for (var i = 0; i < data.length; i++) {
        if ((hideWithoutPoster && (data[i].posterCount === 0 || data[i].posterCount2 === 0))
            || (hideAuthorizationRequired && data[i].withoutAuthorization !== true)) {
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
        table += `<td>${data[i].gemeinde.adresse.replace('\n', '<br>')}</td>`;
        table += `<td>${data[i].gemeinde.kontakt.replace('\n', '<br>')}</td>`;
        var cellStyle = data[i].gemeinde.email && data[i].gemeinde.email.replace(/\s+/, '').length ? '' : 'background: red;';
        var emailDuplicateInfo = data[i].gemeinde.email != null && emailMap[data[i].gemeinde.email] ? ' (<span title="' + emailMap[data[i].gemeinde.email].join(', ') + '">bereits verwendet</span>)' : ''
        emailMap[data[i].gemeinde.email || 'null'] = emailMap[data[i].gemeinde.email || 'null'] || [];
        emailMap[data[i].gemeinde.email || 'null'].push(data[i].gemeinde.gemeinde);
        table += `<td style="${cellStyle}">${data[i].gemeinde.email || ''} ${emailDuplicateInfo}</td>`;
        table += `<td>${data[i].location.value}</td>`;
        table += `<!--<td>${data[i].posterCount}</td>-->`;
        table += `<td>${data[i].withoutAuthorization === true ? 'Ja' : (data[i].withoutAuthorization === false ? 'Nein' : 'Unbekannt')}</td>`;
        table += `<td>${data[i].rules || ''}</td>`;
        table += `<td>${data[i].before || ''}</td>`;
        table += `<td>${data[i].after || ''}</td>`;
        table += `<!--<td>${data[i].posterCount2}</td>-->`;
        table += `<td>${data[i].posterCount3 || ''}</td>`;
        table += '</tr>';
        locationsSum++;
        posterSum += data[i].posterCount2;
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

    document.getElementById('posterSum').innerHTML = '' + posterSum;
    document.getElementById('locationsSum').innerHTML = '' + locationsSum;
    document.getElementById('locationsCount').innerHTML = '' + data.length;
}

function refreshHash(withoutPoster, authorizationRequired) {
    var hash = [];
    if (withoutPoster) {
        hash.push('withoutPoster');
    }
    if (authorizationRequired) {
        hash.push('authorizationRequired');
    }
    location.hash = hash.join(',');
}

var withoutPoster = document.getElementById('filter-checkbox-without-poster'),
    authorizationRequired = document.getElementById('filter-checkbox-authorization-required'),
    hash = location.hash ? location.hash.replace(/^#/, '').split(',') : [];
withoutPoster.checked = hash.indexOf('withoutPoster') > -1;
authorizationRequired.checked = hash.indexOf('authorizationRequired') > -1;
fetch('data.json').then(d => d.json()).then(d => {
    data = d;

    var orderedByEinwohner = Array.prototype.slice.call(data)
        .sort((a, b) => b.location.value - a.location.value);
    var topTenNdb = orderedByEinwohner.slice(0, 10);
    var topTenDeg = orderedByEinwohner.filter(d => d.gemeinde.landkreis === 'Landkreis Deggendorf').slice(0, 10);

    for (var i = 0; i < data.length; i++) {
        if (topTenDeg.indexOf(data[i]) >= 0) {
            data[i].posterCount2 = parseInt(data[i].posterCount * 1.5 / 4) * 4;
        } else if (topTenNdb.indexOf(data[i]) >= 0) {
            data[i].posterCount2 = parseInt(data[i].posterCount * 0.8 / 4) * 4;
        } else {
            data[i].posterCount2 = 0;
        }
    }

    refreshHash(withoutPoster.checked, authorizationRequired.checked);
    refreshMap(withoutPoster.checked, authorizationRequired.checked);
    refreshTable(withoutPoster.checked, authorizationRequired.checked);
});
withoutPoster.onchange = function () {
    refreshHash(withoutPoster.checked, authorizationRequired.checked);
    refreshMap(withoutPoster.checked, authorizationRequired.checked);
    refreshTable(withoutPoster.checked, authorizationRequired.checked);
};
authorizationRequired.onchange = function () {
    refreshHash(withoutPoster.checked, authorizationRequired.checked);
    refreshMap(withoutPoster.checked, authorizationRequired.checked);
    refreshTable(withoutPoster.checked, authorizationRequired.checked);
};
