import {DOMStrings, DOMClasses, DOMIds, DOMElements, DOMEndpoints, DOMEvents} from '../custom/data.js';

'use strict';

const mapZoomLevel = 7;
const mapCenterLatitude = 7.9465;
const mapCenterLongitude = -1.0232;

const BING_TILE_LAYER = L.tileLayer.bing({
    bingMapsKey: BINGMAP_KEY,
    imagerySet: 'CanvasGray'
});

const GOOGLE_TILE_LAYER = L.tileLayer(DOMEndpoints.GoogleTileLayer, {
    attribution: DOMEndpoints.GoogleAttribution,
    maxZoom: 18,
    subdomains:['mt0','mt1','mt2','mt3']
});

const MAPBOX_TILE_LAYER = L.tileLayer(`${DOMEndpoints.MapboxTileLayer}${MAPBOX_KEY}`, {
    attribution: DOMEndpoints.MapboxAttribution,
    maxZoom: 18,
    id: DOMEndpoints.MapboxType,
    tileSize: 512,
    zoomOffset: -1,
    accessToken: MAPBOX_KEY
});

const OPENSTREET_TILE_LAYER = L.tileLayer(DOMEndpoints.OSMTileLayer, {
    attribution: DOMEndpoints.OSMAttribution
});

const map = initMap();

function initMap() {
    return L.map(DOMStrings.map).setView([mapCenterLatitude, mapCenterLongitude], mapZoomLevel);
}

function setTotalWatchList() {
    $(DOMIds.totalWatchList).text($(DOMClasses.watchListCard).length);
}

function initMapBoxMap() {
    map.removeLayer(BING_TILE_LAYER);
    map.removeLayer(GOOGLE_TILE_LAYER);
    map.removeLayer(OPENSTREET_TILE_LAYER);
    MAPBOX_TILE_LAYER.addTo(map);
}

function initOpenStreetMap() {
    map.removeLayer(BING_TILE_LAYER);
    map.removeLayer(GOOGLE_TILE_LAYER);
    map.removeLayer(MAPBOX_TILE_LAYER);
    OPENSTREET_TILE_LAYER.addTo(map);
}

function initBingMap() {
    map.removeLayer(GOOGLE_TILE_LAYER);
    map.removeLayer(MAPBOX_TILE_LAYER);
    map.removeLayer(OPENSTREET_TILE_LAYER);
    BING_TILE_LAYER.addTo(map);
}

function initGoogleMap() {
    map.removeLayer(BING_TILE_LAYER);
    map.removeLayer(OPENSTREET_TILE_LAYER);
    map.removeLayer(MAPBOX_TILE_LAYER);
    GOOGLE_TILE_LAYER.addTo(map);
}

$(document).on(DOMEvents.change, DOMElements.watchListCheckBox, function() {
    const CARD_VALUE = $(this).val();
    if(this.checked) {
        const BOTTOM_CONTAINER = document.querySelector(DOMClasses.bottomCardsContainer);
        const CARD = `<div class="map__body-card" id="bottom-card__${CARD_VALUE}"></div>`;
        BOTTOM_CONTAINER.insertAdjacentHTML(DOMStrings.afterBegin, CARD);
    } else {
        $(`#bottom-card__${CARD_VALUE}`).fadeOut();
        setTimeout(()=> {
            $(`#bottom-card__${CARD_VALUE}`).remove();
        },500);
    }
});

$(DOMIds.bingButton).on(DOMEvents.click, ()=> {
    initBingMap();
});

$(DOMIds.googleButton).on(DOMEvents.click, ()=> {
    initGoogleMap();
});

$(DOMIds.openstreetButton).on(DOMEvents.click, ()=> {
    initOpenStreetMap();
});

$(DOMIds.mapboxButton).on(DOMEvents.click, ()=> {
    initMapBoxMap();
});

initOpenStreetMap();
setTotalWatchList();