var map = L.map("map", {
    attributionControl: false,
    zoomControl: false
}).setView(new L.LatLng(59.911111, 10.752778), 7);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    detectRetina: true,
    maxNativeZoom: 17
}).addTo(map);

var leafletView = new PruneClusterForLeaflet();

var icon = L.icon({
    iconUrl: '../img/helicopter.png',
    iconSize: [25, 25]
});

var size = 100;
var markers = [];


for (var i = 0; i < size; ++i) {
    var marker = new PruneCluster.Marker(59.91111 + (Math.random() - 0.5) * 0.1 * size, 10.752778 + (Math.random() - 0.5) * 0.2 * size, {
        popup: "<div class='marker__tooltip'>Louis is no_ </div>" + i,
        icon: L.icon({
            iconUrl: Math.random() > 0.5 ? '../img/helicopter.png' : '../img/airplane.png',
            iconSize: [48, 48]
        })
    });

    markers.push(marker);
    leafletView.RegisterMarker(marker);
}

/*
leafletView.PrepareLeafletMarker  = function(leafletMarker, data) {
    leafletMarker.setIcon(
        L.icon({
            iconUrl: data.iconUrl,
            iconSize: [48, 48]
        })
    );
    if (leafletMarker.getPopup()) {
        leafletMarker.setPopupContent(data.popup);
    } else {
        leafletMarker.bindPopup(data.popup);
    }
}*/

window.setInterval(function () {
    for (i = 0; i < size / 2; ++i) {
        var coef = i < size / 8 ? 10 : 1;
        var ll = markers[i].position;
        ll.lat += (Math.random() - 0.5) * 0.0001 * coef;
        ll.lng += (Math.random() - 0.5) * 0.0002 * coef;
    }

    leafletView.ProcessView();
}, 500);

map.addLayer(leafletView);