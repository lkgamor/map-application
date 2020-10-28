/**
* @author Louis Gamor
**/

const DOMStrings = {
	map: 'map',
	beforeEnd: 'beforeend',
	afterBegin: 'afterbegin',
	notAvailable: 'N/A',
	customTrackUVehicleMarkerClass: 'tracku__vehicle-marker',
	CATEGORY_GENERATOR_FAULTY: 1,
	CATEGORY_GENERATOR_INACTIVE: 2,
	CATEGORY_GENERATOR_ACTIVE: 3,
	CATEGORY_VEHICLE_FAULTY: 1,
	CATEGORY_VEHICLE_STOPPED: 2,
	CATEGORY_VEHICLE_MOVING: 3,
}

const DOMClasses = {
	watchListCard: '.watchlist__card',
	bottomCardsContainer: '.map__body--bottom-container'
}

const DOMIds = {
	map: '#map',
	googleButton: '#google-button',
	mapboxButton: '#mapbox-button',
	bingButton: '#bing-button',
	openstreetButton: '#openstreet-button',
	totalWatchList: '#total-watchlist'
}

const DOMElements = {
	watchListCheckBox: 'input.watchlist__checkbox',
	mapElement: '<nav id="map"></nav>'
}

const DOMEndpoints = {
	GoogleTileLayer: '//{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
	GoogleAttribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, Imagery © <a href="https://www.maps.google.com/">Google Maps</a>',
	OSMTileLayer: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	OSMAttrbution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
	MapboxType: 'mapbox/light-v10',
	MapboxTileLayer: 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=',
	MapboxAttribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	getAirports: 'http://api.aviationstack.com/v1/airports?access_key=283154d03b07b51c5bf161f3461a59d6'
}

const DOMEvents = {
	click: 'click',
	checked: 'checked',
	change: 'change'
}

const DOMHTTPMethods = {
	postMethod : 'POST',
	getMethod : 'GET',
	deleteMethod : 'DELETE',
	putMethod: 'PUT'
}

export {DOMStrings, DOMClasses, DOMIds, DOMElements, DOMEndpoints, DOMEvents, DOMHTTPMethods};