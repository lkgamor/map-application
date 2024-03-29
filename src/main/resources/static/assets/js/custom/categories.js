var map = L.map("map", {
    attributionControl: false,
    zoomControl: false
}).setView(new L.LatLng(59.911111, 10.752778), 12);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    detectRetina: true,
    maxNativeZoom: 17
}).addTo(map);

var leafletView = new PruneClusterForLeaflet();

leafletView.BuildLeafletClusterIcon = function(cluster) {
    var e = new L.Icon.MarkerCluster();

    e.stats = cluster.stats;
    e.population = cluster.population;
    return e;
};

var colors = ['#ff4b00', '#bac900', '#EC1813', '#55BCBE', '#D2204C', '#FF0000', '#ada59a', '#3e647e'],
    pi2 = Math.PI * 2;

L.Icon.MarkerCluster = L.Icon.extend({
    options: {
        iconSize: new L.Point(44, 44),
        className: 'prunecluster leaflet-markercluster-icon'
    },

    createIcon: function () {
        // based on L.Icon.Canvas from shramov/leaflet-plugins (BSD licence)
        var e = document.createElement('canvas');
        this._setIconStyles(e, 'icon');
        var s = this.options.iconSize;
        e.width = s.x;
        e.height = s.y;
        this.draw(e.getContext('2d'), s.x, s.y);
        return e;
    },

    createShadow: function () {
        return null;
    },

    draw: function(canvas, width, height) {

        var lol = 0;

        var start = 0;
        for (var i = 0, l = colors.length; i < l; ++i) {

            var size = this.stats[i] / this.population;


            if (size > 0) {
                canvas.beginPath();
                canvas.moveTo(22, 22);
                canvas.fillStyle = colors[i];
                var from = start + 0.14,
                    to = start + size * pi2;

                if (to < from) {
                    from = start;
                }
                canvas.arc(22,22,22, from, to);

                start = start + size*pi2;
                canvas.lineTo(22,22);
                canvas.fill();
                canvas.closePath();
            }

        }

        canvas.beginPath();
        canvas.fillStyle = 'white';
        canvas.arc(22, 22, 18, 0, Math.PI*2);
        canvas.fill();
        canvas.closePath();

        canvas.fillStyle = '#555';
        canvas.textAlign = 'center';
        canvas.textBaseline = 'middle';
        canvas.font = 'bold 12px sans-serif';

        canvas.fillText(this.population, 22, 22, 40);
    }
});



var size = 10000;
var markers = [];
for (var i = 0; i < size; ++i) {
    var marker = new PruneCluster.Marker(59.91111 + (Math.random() - 0.5) * Math.random() * 0.00001 * size, 10.752778 + (Math.random() - 0.5) * Math.random() * 0.00002 * size);

    // This can be a string, but numbers are nice too
    marker.category = Math.floor(Math.random() * Math.random() * colors.length);

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
