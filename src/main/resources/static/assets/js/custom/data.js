let DOMStrings = {
	map: 'map'
}

let DOMClasses = {
	
}

let DOMIds = {
	map: '#map'
}

let DOMElements = {
	mapElement: '<nav id="map"></nav>'
}

let DOMEndpoints = {
	OSMTileLayer: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	OSMAttrbution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
	MapboxType: 'mapbox/light-v10',
	MapboxTileLayer: 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=',
	MapboxAttribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
}

let DOMEvents = {
	click: 'click',
	checked: 'checked'
}

let DOMHTTPMethods = {
	postMethod : 'POST',
	getMethod : 'GET',
	deleteMethod : 'DELETE',
	putMethod: 'PUT'
}
export {DOMStrings, DOMClasses, DOMIds, DOMElements, DOMEndpoints, DOMEvents, DOMHTTPMethods};