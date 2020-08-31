import {DOMStrings, DOMClasses, DOMIds, DOMElements, DOMEndpoints, DOMEvents} from './data.js';
import {map, renderer, initMapBoxMap, initBingMap, initGoogleMap, initOpenStreetMap, persistMapTypeInIndexedDB} from './init.js'

'use strict';

const MARKER_ICON = L.icon({iconUrl: `${CONTEXT}assets/images/airport.svg`, iconSize: [28, 40]});

console.log(MARKER_ICON)

const getApiData = () => {
    $.ajax({
        url: DOMEndpoints.getAirports,
        beforeSend: ()=> {
            NProgress.start();
        },
        success: (airports)=> {
            
            plotDataOnMap(airports.data)
            
        },
        error: ()=> {
            console.log("Error...")
        },
        complete: ()=> {
            NProgress.done();
            NProgress.remove();				
        }
    });
};

const plotDataOnMap = (data) => {

    data.forEach((airport) => {
        const AIRPORT_NAME = airport.airport_name;
        const AIRPORT_LATITUDE = airport.latitude;
        const AIRPORT_LONGITUDE = airport.longitude;
        console.log(AIRPORT_NAME);
        console.log(AIRPORT_LATITUDE);
        console.log(AIRPORT_LONGITUDE);
        const airport_marker = L.marker(new Array(AIRPORT_LATITUDE, AIRPORT_LONGITUDE), {icon: MARKER_ICON})
					        	.bindPopup(AIRPORT_NAME)
					        	.addTo(map);
					        	
        /*L.circle(new Array(AIRPORT_LATITUDE, AIRPORT_LONGITUDE), {radius: 200})
        .bindPopup(AIRPORT_NAME)
        .addTo(map);*/
    });
};


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
    persistMapTypeInIndexedDB(`BING_TILE_LAYER`);
});

$(DOMIds.googleButton).on(DOMEvents.click, ()=> {
    initGoogleMap();
    persistMapTypeInIndexedDB(`GOOGLE_TILE_LAYER`);
});

$(DOMIds.openstreetButton).on(DOMEvents.click, ()=> {
    initOpenStreetMap();
    persistMapTypeInIndexedDB(`OPENSTREET_TILE_LAYER`);
});

$(DOMIds.mapboxButton).on(DOMEvents.click, ()=> {
    initMapBoxMap();
    persistMapTypeInIndexedDB(`MAPBOX_TILE_LAYER`);
});

getApiData();