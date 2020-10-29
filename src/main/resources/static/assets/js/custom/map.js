/**
* @author Louis Gamor
**/

import {DOMStrings, DOMClasses, DOMIds, DOMElements, DOMEndpoints, DOMEvents} from './data.js';
import {map, initMapBoxMap, initBingMap, initGoogleMap, initOpenStreetMap, persistMapTypeInIndexedDB} from './init.js'

'use strict';

let markers = new Array();
let trackuPruneCluster = new PruneClusterForLeaflet();

const pi2 = Math.PI * 2;
const colors = ['#ff4b00', '#bac900', '#858584', '#1f3549', '#7d1e13', '#ada59a', '#ada59a', '#3e647e'];

L.Icon.MarkerCluster = L.Icon.extend({
    options: {
        iconSize: new L.Point(44, 44),
        className: `prunecluster leaflet-markercluster-icon ${DOMStrings.customTrackUVehicleMarkerClass}`
    },

    createIcon: function () {
        // based on L.Icon.Canvas from shramov/leaflet-plugins (BSD licence)
        let e = document.createElement('canvas');
        this._setIconStyles(e, 'icon');
        let s = this.options.iconSize;
        e.width = s.x;
        e.height = s.y;
        this.draw(e.getContext('2d'), s.x, s.y);
        return e;
    },

    createShadow: function () {
        return null;
    },

    draw: function(canvas, width, height) {

        let start = 0;
        for (let i = 0, l = colors.length; i < l; ++i) {

            let size = this.stats[i] / this.population;

            if (size > 0) {
                canvas.beginPath();
                canvas.moveTo(22, 22);
                canvas.fillStyle = colors[i];

                let from = start + 0.14;
                let to = start + size * pi2;

                if (to < from) {
                    from = start;
                }
                canvas.arc(22,22,22, from, to);

                start = start + size * pi2;
                canvas.lineTo(22,22);
                canvas.fill();
                canvas.closePath();
            }
        }

        canvas.beginPath();
        canvas.fillStyle = '#f7fcf8';
        canvas.arc(22, 22, 18, 0, Math.PI*2);
        canvas.fill();
        canvas.closePath();

        canvas.fillStyle = '#1f3549';
        canvas.textAlign = 'center';
        canvas.textBaseline = 'middle';
        canvas.font = 'bold 13px sans-serif';

        canvas.fillText(this.population, 22, 22, 40);
    }
});

trackuPruneCluster.BuildLeafletClusterIcon = function(cluster) {
    let e = new L.Icon.MarkerCluster();

    e.stats = cluster.stats;
    e.population = cluster.population;
    return e;
};

// trackuPruneCluster.PrepareLeafletMarker = function(vehicleMarker, data) {
   
//     vehicleMarker.on('click', function(){
//         console.log(`clicked on = ${data.id}`)
//     });

// };

const establishCentrifugoConnection = () => {
    //SET CENTRIFUGO CONNECTION INSTANCE
    const CENTRIFUGE = new Centrifuge(DOMStrings.centrifugoWebsocketUrl);
    //ADD HS256 ACCESS TOKEN FOR AUTHENTICATION
    CENTRIFUGE.setToken(DOMStrings.centrifugoToken);
    //SUBSCRIBE TO CHANNEL FOR RECEIVING PUBLISHED VEHICLES
    CENTRIFUGE.subscribe(DOMStrings.centrifugoChannel, (message)=> {
        //console.log(message.data);
        plotDataOnMap(message.data);
    });
    //ESTABLISH CONNECTION
    CENTRIFUGE.connect();
};
establishCentrifugoConnection();


const plotDataOnMap = (vehicle) => {
    
    /** Initialise all required vehicle data from {vehicle} response */
	const {vehicleId: VEHICLE_ID, latitude: VEHICLE_LATITUDE, longitude: VEHICLE_LONGITUDE, name: VEHICLE_NAME, typeName: VEHICLE_TYPE, presentSpeed: VEHICLE_SPEED, presentHeading: VEHICLE_HEADING, licensePlate: VEHICLE_PLATE, eventTime: VEHICLE_EVENT_TIME, fleetName: VEHICLE_FLEET = DOMStrings.notAvailable, model: VEHICLE_MODEL = DOMStrings.notAvailable, statusCodeDescription: VEHICLE_STATUS = DOMStrings.notAvailable} = vehicle;    
    
    /** Check if Vehicle Already Exists On Map */
    const markerAlreadyExists = checkIfMarkerExists(`${DOMStrings.customTrackUVehicleMarkerClass}${VEHICLE_ID}`);

    /** Get Vehicle Icon, Category & Weight */
    const VEHICLE_DATA = setVehicleMarkerIcon(VEHICLE_ID, VEHICLE_TYPE, VEHICLE_EVENT_TIME, VEHICLE_SPEED, VEHICLE_HEADING);

    /** Build Vehicle Popup Content */
    const MARKER_POPUP = createMarkerPopup(VEHICLE_NAME, VEHICLE_PLATE, VEHICLE_MODEL, VEHICLE_STATUS, VEHICLE_FLEET, VEHICLE_EVENT_TIME);

    switch (markerAlreadyExists) {
        case true:
            const existingMarker = getExistingMaker(`${DOMStrings.customTrackUVehicleMarkerClass}${VEHICLE_ID}`);     
            switch (validCoordinates(existingMarker.position.lat, existingMarker.position.lng)) {
                case true:
                    const markerId = `${DOMStrings.customTrackUVehicleMarkerClass}${VEHICLE_ID}`;
                    existingMarker.weight = VEHICLE_DATA.weight;
                    existingMarker.category = VEHICLE_DATA.category;
                    existingMarker.position.lat = VEHICLE_LATITUDE;
                    existingMarker.position.lng = VEHICLE_LONGITUDE;
                    existingMarker.data.popup = MARKER_POPUP;
                    existingMarker.data.icon = VEHICLE_DATA.icon;
                    existingMarker.data.rotationOrigin = 'center';
                    existingMarker.data.rotationAngle = VEHICLE_HEADING;
                    //console.log(existingMarker)
                    trackuPruneCluster.ProcessView();
                break;
                case false:
                    existingMarker.weight = VEHICLE_DATA.weight;
                    existingMarker.category = VEHICLE_DATA.category;
                    existingMarker.data.popup = MARKER_POPUP;
                    existingMarker.data.icon = VEHICLE_DATA.icon;
                    existingMarker.data.rotationOrigin = 'center';
                    existingMarker.data.rotationAngle = VEHICLE_HEADING;
                    trackuPruneCluster.ProcessView();
                break;
            }
        break;

        case false:
            switch (validCoordinates(VEHICLE_LATITUDE, VEHICLE_LONGITUDE)) {
                case true:       
                    const marker = new PruneCluster.Marker(VEHICLE_LATITUDE, VEHICLE_LONGITUDE, {
                        rotationAngle: VEHICLE_HEADING,
                        rotationOrigin: 'center',
                        popup: MARKER_POPUP,
                        icon: VEHICLE_DATA.icon
                    });
                    
                    marker.data.forceIconRedraw = true;
                    marker.data.id = `${DOMStrings.customTrackUVehicleMarkerClass}${VEHICLE_ID}`;
                    marker.category = VEHICLE_DATA.category;
                    marker.weight = VEHICLE_DATA.weight;
                    markers.push(marker);
                    trackuPruneCluster.RegisterMarker(marker);
                break;
                case false:
                    //Vehicle has invalid coordinates
                break;
            }
        break;
    
        default:
            //Do something to yourself if ${markerAlreadyExists} does not return a Boolean
        break;
    }
};


/**
 * FUNCTION TO BUILD THE POPUP WINDOW OF A VEHICLE-MARKER
 * ------------------------------------------------------
 * @param {String} vehicleName
 * @param {String} vehiclePlate
 * @param {String} vehicleModel
 * @param {String} vehicleStatus
 * @param {String} vehicleFleet
 * @param {String} vehicleEventTime
 */
const createMarkerPopup = (vehicleName, vehiclePlate, vehicleModel, vehicleStatus, vehicleFleet, vehicleEventTime) => {
    return `<div class="d-flex flex-column">
                <div class="h6 font-weight-bold ml-2 d-flex justify-content-between">
                    <span class="app-font-color">${vehicleName}</span>
                    <span class="vehicle-moving-status bg-secondary">${vehiclePlate}</span>
                </div>
                <div class="app-font-color border-secondary">
                    <span class="popup-info"><i class="fas fa-truck mr-1"></i>Model: <em class="text-uppercase">${vehicleModel}</em></span><br>
                    <span class="popup-info"><i class="fas fa-info-circle mr-1"></i> Status: <em class="text-uppercase">${vehicleStatus}</em></span><br>
                    <span class="popup-info"><i class="fas fa-layer-group mr-1"></i> Fleet: <em class="text-uppercase">${vehicleFleet}</em></span><br>
                    <span class="popup-info"><i class="fas fa-calendar mr-1"></i> Date: <em class="text-uppercase">${convertUTCDateToLocalDate(vehicleEventTime)}</em></span><br>
                    <span class="popup-info"><i class="fas fa-clock mr-1"></i> Updated: <em class="text-capitalize">${getUpdatesDuration(vehicleEventTime)}</em></span><br>
                </div>
            </div>`;
};


/**
 * FUNCTION TO CHECK IF A VEHICLE-MARKER EXISTS IN MARKER ARRAY
 * ------------------------------------------------------------
 * @param {String} vehicleId
 */
const checkIfMarkerExists = vehicleId => {
    let exists = false;
    for(const existingMarker of markers) {
        if (existingMarker.data.id === vehicleId) {
            exists = true;
        }
    }
    return exists;
};


/**
 * FUNCTION TO RETRIEVE AN EXISTING VEHICLE-MARKER FROM MARKER ARRAY
 * -----------------------------------------------------------------
 * @param {String} vehicleId
 */
const getExistingMaker = vehicleId => {
    let markerObject = new Object();
    for(const existingMarker of markers) {
        if (existingMarker.data.id === vehicleId) {
            markerObject = existingMarker;
        }
    }    
    return markerObject;
};

/**
 * FUNCTION TO CHECK IF COORDINATES PASSED ARE VALID.
 * -------------------------------------------------
 * @param latitude 
 * @param longitude
 * @return Boolean
 */
const validCoordinates = (latitude, longitude) => {
	if (latitude !== DOMStrings.notAvailable && longitude !== DOMStrings.notAvailable) {
		if (latitude && longitude) {
			return true;
		}
	} 
	return false;
};


/**
 * FUNCTION TO DETERMINE VEHICLE ICON 
 * ----------------------------------
 * 
 * @param {String} vehicleId
 * @param {String} vehicleType
 * @param {String} vehicleEventTime
 * @param {String} vehicleSpeed
 * @param {String} vehicleHeading
 * @return {L.icon} leaflet icon
 */
let setVehicleMarkerIcon = (vehicleId, vehicleType, vehicleEventTime, vehicleSpeed, vehicleHeading) => {
	if (vehicleType.toLowerCase().includes(`generator`)) {				
        if(vehicleUpdateDelayed(vehicleEventTime)) {
            return {
                'weight': parseInt(DOMStrings.CATEGORY_FAULTY),
                'category': parseInt(DOMStrings.CATEGORY_FAULTY),
                'icon': L.icon({iconUrl: `${CONTEXT}assets/images/gen_faulty.png`, iconSize: [25, 35], className: `${DOMStrings.customTrackUVehicleMarkerClass}${vehicleId}`})
            }
        } else {
            if (vehicleSpeed < 1)
                return {
                    'weight': parseInt(DOMStrings.CATEGORY_INACTIVE),
                    'category': parseInt(DOMStrings.CATEGORY_INACTIVE),
                    'icon': L.icon({iconUrl: `${CONTEXT}assets/images/gen_inactive.png`, iconSize: [25, 35], className: `${DOMStrings.customTrackUVehicleMarkerClass}${vehicleId}`})
                }
            return {
                'weight': parseInt(DOMStrings.CATEGORY_ACTIVE),
                'category': parseInt(DOMStrings.CATEGORY_ACTIVE),
                'icon': L.icon({iconUrl: `${CONTEXT}assets/images/gen_active.png`, iconSize: [25, 35], className: `${DOMStrings.customTrackUVehicleMarkerClass}${vehicleId}`})
            }
        }							
    } else {
        if(vehicleUpdateDelayed(vehicleEventTime)) {
            return {
                'weight': parseInt(DOMStrings.CATEGORY_FAULTY),
                'category': parseInt(DOMStrings.CATEGORY_FAULTY),
                'icon': L.icon({iconUrl: `${CONTEXT}assets/images/vehicle_faulty.png`, iconSize: [28, 42], className: `${DOMStrings.customTrackUVehicleMarkerClass}${vehicleId}`})
            }
        } else {
            if (vehicleSpeed < 1)
                return {
                    'weight': parseInt(DOMStrings.CATEGORY_INACTIVE),
                    'category': parseInt(DOMStrings.CATEGORY_INACTIVE),
                    'icon': L.icon({iconUrl: `${CONTEXT}assets/images/vehicle_stopped.png`, iconSize: [28, 42], className: `${DOMStrings.customTrackUVehicleMarkerClass}${vehicleId}`})
                }
            return {
                'weight': parseInt(DOMStrings.CATEGORY_ACTIVE),
                'category': parseInt(DOMStrings.CATEGORY_ACTIVE),
                'icon': L.icon({iconUrl: `${CONTEXT}assets/images/vehicle_moving.png`, iconSize: [28, 42], className: `${DOMStrings.customTrackUVehicleMarkerClass}${vehicleId}`})
            }
        }
    }
};


/**
 * FUNCTION TO CHECK IF VEHICLE UPDATE TIME HAS BEEN DELAYED
 * ---------------------------------------------------------
 * 
 * @param eventTime
 * @return Boolean
 */
let vehicleUpdateDelayed = eventTime => {
	
	//CURRENT DATE/TIME
    const CURRENT_TIME = moment(new Date()); 						
		
    //DEVICE UPDATE DATE/TIME
    const EVENT_TIME = moment(new Date(eventTime)); 				
    
    //DIFFERENCE BETWEEN BOTH DATE/TIMES
    const DIFFERENCE = moment.duration(CURRENT_TIME.diff(EVENT_TIME));				

    const DELAYED_UPDATE_TIME = DIFFERENCE._milliseconds;
    
    if(DELAYED_UPDATE_TIME >= 14400000)
        return true;
    return false;	
};


/**
 * FUNCTION TO CONVERT 'ZONED-DATE-TIME' TO 'DATE'
 * -----------------------------------------------
 * @param {String} eventDate
 */
let convertUTCDateToLocalDate = (eventDate) => {
	
	const DATE = new Date(eventDate);
	const NEW_DATE = new Date(DATE.getTime() + DATE.getTimezoneOffset()*60*1000);
	const OFFSET = DATE.getTimezoneOffset() / 60;
	const HOURS = DATE.getHours();

	NEW_DATE.setHours(HOURS - OFFSET);
	
	const FINAL_DATE = NEW_DATE.toLocaleString();
	return FINAL_DATE;  
};


/**
 * FUNCTION TO GET DURATION BETWEEN UPDATES
 * ----------------------------------------
 * @param String eventTime
 */
let getUpdatesDuration = (eventTime) => {

	let months, days, hours, mins, secs;
	const NOW = moment(new Date());							//CURRENT DATE/TIME
	const END = moment(new Date(eventTime));				//DEVICE UPDATE DATE/TIME	
	const DURATION = moment.duration(NOW.diff(END));		//DIFFERENCE BETWEEN BOTH DATE/TIMES

	if(DURATION._data.months > 0) {
		if(DURATION._data.months > 1)
			months = `${DURATION._data.months} months `;
		else
			months = `${DURATION._data.months} month `;
	}
	else
		months = '';

	if(DURATION._data.days > 0) {
		if(DURATION._data.days > 1)
			days = `${DURATION._data.days} days `;
		else
			days = `${DURATION._data.days} day `;
	}
	else
		days = '';

	if(DURATION._data.hours > 0) {
		if(DURATION._data.hours > 1)
			hours = `${DURATION._data.hours} hrs `;
		else
			hours = `${DURATION._data.hours} hr `;
	}
	else
		hours = '';

	if(DURATION._data.minutes > 0) {
		if(DURATION._data.minutes > 1)
			mins = `${DURATION._data.minutes} mins and `;
		else
			mins = `${DURATION._data.minutes} min and `;
	}
	else
		mins = ``;

	if(DURATION._data.seconds > 0) {
		if(DURATION._data.seconds > 1)
			secs = `a few secs`;
		else
			secs = `a second`;
	}
	else
		secs = `0 sec`;

	return `${months} ${days} ${hours} ${mins} ${secs} ago`;
};

map.addLayer(trackuPruneCluster);

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

$(document).on(DOMEvents.change, DOMElements.watchListCheckBox, function() {
    const CARD_VALUE = $(this).val();
    if(this.checked) {
        const BOTTOM_CONTAINER = document.querySelector(DOMClasses.bottomCardsContainer);
        const CARD = `<div class="map__body-card" id="bottom-card__${CARD_VALUE}">
                        <div class="map__body-card--left">
                            <div class="image"><img alt="Tesla" src="/assets/images/${CARD_VALUE}.jpg"></div>
                            <span class="hourly-rate">$35/hr</span>
                        </div>
                        <div class="map__body-card--right">
                            <h5 class="name">Jimmy Madla</h5>
                            <div class="role-duration">
                                <span class="role">Software Engineer</span>
                                <span class="duration">Hourly</span>
                            </div>
                            <div class="icon location">60 Spadina Avenue, Toronto, OS, Canada</div>
                        </div>
                    </div>`;
        BOTTOM_CONTAINER.insertAdjacentHTML(DOMStrings.beforeEnd, CARD);
    } else {
        $(`#bottom-card__${CARD_VALUE}`).fadeOut();
        setTimeout(()=> {
            $(`#bottom-card__${CARD_VALUE}`).remove();
        },500);
    }
});


/*
trackuPruneCluster.PrepareLeafletMarker  = function(leafletMarker, data) {
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

/*var L = global.L || require('leaflet');

var fs = require('fs');

var sources = {
	blank: 'data:image/png;base64,' + fs.readFileSync(__dirname + '/blank.png', 'base64'),
	sprite: 'data:image/png;base64,' + fs.readFileSync(__dirname + '/sprite.png', 'base64')
};
function css(string) {
	var tag = document.createElement('style');
	tag.innerHTML = string;
	document.getElementsByTagName("head")[0].appendChild(tag);
}

L.spriteIcon = function(color) {
  color = color || 'blue';
  return L.icon({
    className: "leaflet-sprite leaflet-sprite-" + color,
    iconSize: [24, 41],
    shadowsize: [41, 41],
    iconAnchor: [12, 41],
    iconUrl: sources.blank,
    shadowUrl: L.Icon.Default.imagePath + "/marker-shadow.png"
  });
};

var cssRegular = ".leaflet-sprite{background:url(" + sources.sprite + ") no-repeat top left;}\n.leaflet-sprite-blue{ background-position: 0 -132px; width: 41px; height: 41px; } \n.leaflet-sprite-green{ background-position: 0 -355px; width: 41px; height: 41px; } \n.leaflet-sprite-orange{ background-position: 0 -578px; width: 41px; height: 41px; } \n.leaflet-sprite-purple{ background-position: 0 -801px; width: 41px; height: 41px; } \n.leaflet-sprite-red{ background-position: 0 -1024px; width: 41px; height: 41px; } \n.leaflet-sprite-violet{ background-position: 0 -1247px; width: 41px; height: 41px; } \n.leaflet-sprite-yellow{ background-position: 0 -1470px; width: 41px; height: 41px; } ";

var cssRetina = ".leaflet-sprite{\nbackground:url(" + sources.sprite + ") no-repeat top left;\nbackground-size:41px, 41px\n}\n .leaflet-sprite-blue{ background-position: 0 0; width: 41px; height: 41px; } \n .leaflet-sprite-green{ background-position: 0 -111px; width: 41px; height: 41px; } \n .leaflet-sprite-orange{ background-position: 0 -223px; width: 41px; height: 41px; } \n .leaflet-sprite-purple{ background-position: 0 -334px; width: 41px; height: 41px; } \n .leaflet-sprite-red{ background-position: 0 -446px; width: 41px; height: 41px; } \n .leaflet-sprite-violet{ background-position: 0 -557px; width: 41px; height: 41px; } \n .leaflet-sprite-yellow{ background-position: 0 -669px; width: 41px; height: 41px; } ";

if (L.Browser.retina) {
  css(cssRetina);
} else {
  css(cssRegular);
}*/