var map = L.map("map", {
    attributionControl: false,
    zoomControl: false
}).setView(new L.LatLng(59.911111, 10.752778), 12);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    detectRetina: true,
    maxNativeZoom: 17
}).addTo(map);

var leafletView = new PruneClusterForLeaflet();

var size = 10000;
var markers = [];
for (var i = 0; i < size; ++i) {
    var marker = new PruneCluster.Marker(59.91111 + (Math.random() - 0.5) * Math.random() * 0.00001 * size, 10.752778 + (Math.random() - 0.5) * Math.random() * 0.00002 * size);

    markers.push(marker);
    leafletView.RegisterMarker(marker);
}

window.setInterval(function () {
    for (i = 0; i < size / 2; ++i) {
        var coef = i < size / 8 ? 10 : 1;
        var ll = markers[i].position;
        ll.lat += (Math.random() - 0.5) * 0.00001 * coef;
        ll.lng += (Math.random() - 0.5) * 0.00002 * coef;
    }

    leafletView.ProcessView();
}, 500);

map.addLayer(leafletView);

document.getElementById('delete').onclick = function () {
    if (size >= 1000) {
        var deleteList = markers.splice(0, 1000);
        leafletView.RemoveMarkers(deleteList);
        size -= 1000;
    }
    return false;
};