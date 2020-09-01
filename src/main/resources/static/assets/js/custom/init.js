/**
* @author Louis Gamor
**/

import {DOMStrings, DOMClasses, DOMIds, DOMEndpoints} from './data.js';

'use strict';

let mapIndexedDB;

NProgress.configure({showSpinner: false});

const mapZoomLevel = 7;
const mapCenterLatitude = 7.9465;
const mapCenterLongitude = -1.0232;
const map = initMap();
const renderer = L.canvas({ padding: 0.5 });

const DATABASE_VERSION = 1;
const DATABASE_NAME = `${APPLICATION_NAME}_DB`;
const DATABASE_STORE_PREFERENCES = `Preferences`;

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

/**
 * FUNCTION TO INITIALIZE BASE MAP
 * -------------------------------
 */
function initMap() {
    return L.map(DOMStrings.map, {renderer: L.canvas()}).setView([mapCenterLatitude, mapCenterLongitude], mapZoomLevel);
};

/**
 * FUNCTION TO SET TOTAL WATCHLISTS ON SIDEBAR
 * -------------------------------------------
 */
const setTotalWatchList = () => {
    $(DOMIds.totalWatchList).text($(DOMClasses.watchListCard).length);
};

/**
 * FUNCTION TO INITIALIZE MAPBOX-MAP
 * ---------------------------------
 */
const initMapBoxMap = () => {
    map.removeLayer(BING_TILE_LAYER);
    map.removeLayer(GOOGLE_TILE_LAYER);
    map.removeLayer(OPENSTREET_TILE_LAYER);
    MAPBOX_TILE_LAYER.addTo(map);

    $(DOMIds.bingButton).removeClass(`selected-map`);
    $(DOMIds.googleButton).removeClass(`selected-map`);
    $(DOMIds.openstreetButton).removeClass(`selected-map`);
    $(DOMIds.mapboxButton).addClass(`selected-map`);
};

/**
 * FUNCTION TO INITIALIZE OPENSTREET-MAP
 * -------------------------------------
 */
const initOpenStreetMap = () => {
    map.removeLayer(BING_TILE_LAYER);
    map.removeLayer(GOOGLE_TILE_LAYER);
    map.removeLayer(MAPBOX_TILE_LAYER);
    OPENSTREET_TILE_LAYER.addTo(map);

    $(DOMIds.bingButton).removeClass(`selected-map`);
    $(DOMIds.googleButton).removeClass(`selected-map`);
    $(DOMIds.mapboxButton).removeClass(`selected-map`);
    $(DOMIds.openstreetButton).addClass(`selected-map`);
};

/**
 * FUNCTION TO INITIALIZE BING-MAP
 * -------------------------------
 */
const initBingMap = () => {
    map.removeLayer(GOOGLE_TILE_LAYER);
    map.removeLayer(MAPBOX_TILE_LAYER);
    map.removeLayer(OPENSTREET_TILE_LAYER);
    BING_TILE_LAYER.addTo(map);

    $(DOMIds.googleButton).removeClass(`selected-map`);
    $(DOMIds.mapboxButton).removeClass(`selected-map`);
    $(DOMIds.openstreetButton).removeClass(`selected-map`);
    $(DOMIds.bingButton).addClass(`selected-map`);
};

/**
 * FUNCTION TO INITIALIZE GOOGLE-MAP
 * ---------------------------------
 */
const initGoogleMap = () => {
    map.removeLayer(BING_TILE_LAYER);
    map.removeLayer(OPENSTREET_TILE_LAYER);
    map.removeLayer(MAPBOX_TILE_LAYER);
    GOOGLE_TILE_LAYER.addTo(map);

    $(DOMIds.bingButton).removeClass(`selected-map`);
    $(DOMIds.mapboxButton).removeClass(`selected-map`);
    $(DOMIds.openstreetButton).removeClass(`selected-map`);
    $(DOMIds.googleButton).addClass(`selected-map`);
};

/**
 * FUNCTION TO INITIALIZE APP INDEXEDDB
 * ------------------------------------
 */
const initMapIndexedDB = () => {
	/**
	 * Check if browser supports indexedDB
	 */
	if (window.indexedDB) {
		
		/**
		 * Create ${DATABASE_NAME} if database doesn't already exist.
		 */
		const mapDBRequest = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
		mapDBRequest.onupgradeneeded = event => {
			/**
			 * Set 'mapIndexedDB' variable to database so it can be used
			 */
			mapIndexedDB = event.target.result;
			
			/**
			 * Create ${DATABASE_STORE_PREFERENCES}' object stores
			 */
			if (!mapIndexedDB.objectStoreNames.contains(`${DATABASE_STORE_PREFERENCES}`)) {
				mapIndexedDB.createObjectStore(`${DATABASE_STORE_PREFERENCES}`);
			}
		}
		
		mapDBRequest.onsuccess = event => {
			mapIndexedDB = event.target.result;
			
			mapIndexedDB.onversionchange = () => {
				mapIndexedDB.close();				
            }			
            getPreferencesFromIndexedDB();
		}
		
		mapDBRequest.onblocked = event => {
            //	
		}
		
		mapDBRequest.onerror = event => {

		}
	} else {

	}
};

/**
 * FUNCTION TO FETCH ALL PERSISTED PREFERENCES FROM INDEXEDDB
 * ----------------------------------------------------------
 */
const getPreferencesFromIndexedDB = () => {
	if (mapIndexedDB) {
		
		const transactionRequest = mapIndexedDB.transaction(`${DATABASE_STORE_PREFERENCES}`).objectStore(`${DATABASE_STORE_PREFERENCES}`);
		const request = transactionRequest.get(`MAP_PREFERENCE`);
		
		request.onsuccess = event => {			
			const preference = event.target.result;
			
			/**
			 * If there are preferences in the 'DATABASE_STORE_PREFERENCES' store...
			 */
			if(preference) {	
                switch (preference) {
                    case `MAPBOX_TILE_LAYER`:
                        initMapBoxMap();
                    break;
                    case `OPENSTREET_TILE_LAYER`:
                        initOpenStreetMap();
                    break;
                    case `BING_TILE_LAYER`:
                        initBingMap();
                    break;
                    case `GOOGLE_TILE_LAYER`:
                        initGoogleMap();
                    break;
                    default:
                        initOpenStreetMap();
                    break;
                }
			} else {
                initOpenStreetMap();
            }
		}
		
		request.onerror = event => {
            console.log(`error -> ${event}`)
		}
		
	} else {
        console.log(`IndexedDB not initialized`)
	}
};


/**
 * FUNCTION TO PERSIST MAP PREFERENCE IN INDEXEDDB
 * -----------------------------------------------
 * @param {String} mapType
 */
const persistMapTypeInIndexedDB = (mapType) => {	
	const transactionRequest = mapIndexedDB.transaction(`${DATABASE_STORE_PREFERENCES}`, `readwrite`).objectStore(`${DATABASE_STORE_PREFERENCES}`);	
	let saveRequest = transactionRequest.put(mapType, 'MAP_PREFERENCE');
	saveRequest.onsuccess = ()=> {

    };
	
	saveRequest.onerror = ()=> {

    };
};

(()=> {
    initMapIndexedDB();
    setTotalWatchList();
})();

export {map, renderer, mapZoomLevel, mapCenterLatitude, mapCenterLongitude, persistMapTypeInIndexedDB, initMapBoxMap, initBingMap, initGoogleMap, initOpenStreetMap, BING_TILE_LAYER, GOOGLE_TILE_LAYER, MAPBOX_TILE_LAYER, OPENSTREET_TILE_LAYER};