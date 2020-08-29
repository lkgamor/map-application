import {DOMStrings, DOMClasses, DOMIds, DOMElements, DOMEndpoints, DOMEvents} from '../custom/data.js';

'use strict';

const mapZoomLevel = 7;
const mapCenterLatitude = 7.9465;
const mapCenterLongitude = -1.0232;

const map = initMap();

function initMap() {
    return L.map(DOMStrings.map).setView([mapCenterLatitude, mapCenterLongitude], mapZoomLevel);
}

function initMapBoxMap() {
    L.tileLayer(`${DOMEndpoints.MapboxTileLayer}${MAP_KEY}`, {
        attribution: DOMEndpoints.MapboxAttribution,
        maxZoom: 18,
        id: DOMEndpoints.MapboxType,
        tileSize: 512,
        zoomOffset: -1,
        accessToken: MAP_KEY
    }).addTo(map);
}
initMapBoxMap();

function initOpenStreetMap() {
    L.tileLayer(DOMEndpoints.OSMTileLayer, {
		attribution: DOMEndpoints.OSMAttribution
	}).addTo(map);
}
//initOpenStreetMap();