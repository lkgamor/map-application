/**
* @author Louis Gamor
**/

import {DOMStrings, DOMClasses, DOMIds, DOMElements, DOMEndpoints, DOMEvents} from './data.js';
import {map, initMapBoxMap, initBingMap, initGoogleMap, initOpenStreetMap, persistMapTypeInIndexedDB} from './init.js'

'use strict';

let markers = new Array();
let trackuPruneCluster = new PruneClusterForLeaflet();

const pi2 = Math.PI * 2;
const FALUTY_CATEGORY_COLOR = '#7d1e13';
const INACTIVE_CATEGORY_COLOR = '#858584';
const ACTIVE_CATEGORY_COLOR = '#1f3549';
const PLACES_CATEGORY_COLOR = '#bac900';
const CLUSTER_CATEGORY_COLORS = [FALUTY_CATEGORY_COLOR, FALUTY_CATEGORY_COLOR, INACTIVE_CATEGORY_COLOR, ACTIVE_CATEGORY_COLOR, PLACES_CATEGORY_COLOR];

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
        for (let i = 0, l = CLUSTER_CATEGORY_COLORS.length; i < l; ++i) {

            let size = this.stats[i] / this.population;

            if (size > 0) {
                canvas.beginPath();
                canvas.moveTo(22, 22);
                canvas.fillStyle = CLUSTER_CATEGORY_COLORS[i];

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

trackuPruneCluster.PrepareLeafletMarker = function(vehicleMarker, data, category) {
    
    const TRACKING_MODE = localStorage.getItem(DOMStrings.trackingMode);
    if (data.icon) {
        if (typeof data.icon === 'function') {
            vehicleMarker.setIcon(data.icon(data, category));
        }
        else {
            vehicleMarker.setIcon(data.icon);
        }
    }

    /**
     * @author Louis Gamor
     * Using the leaflet.tooltip UI layer instead of the default leaflet.popup UI layer built into the
     * PrunCluster library.
     */
    if (data.tooltip) {
        var content = typeof data.tooltip === 'function' ? data.tooltip(data, category) : data.tooltip;
        if (vehicleMarker.getTooltip()) {
            vehicleMarker.setTooltipContent(content, data.tooltipOptions);
        }
        else {
            vehicleMarker.bindTooltip(content, data.tooltipOptions);
        }
    }

    /**
     * @author Louis Gamor
    * The 2 conditions below were originally not included in this library.
    * They will only work if the `leaflet.rotatedMarker.js` library is included from `https://github.com/bbecquet/Leaflet.RotatedMarker`
    * It has to be included before the `Prune.js` library in the project.
    * 
    * <p> The `if(data.rotationAngle)` condition verifies if the current marker has a rotationAngle passed as a parameter.
    *      In which case the .setRotationAngle function that is native to the leaflet.rotatedMarker.js is invoked.
    * <p> The `if(data.rotationOrigin)` condition verifies if the current marker has a rotationOrigin passed as a parameter.
    *      In which case the .setRotationOrigin function that is native to the leaflet.rotatedMarker.js is invoked.
    */
    if (data.rotationAngle) {
        vehicleMarker.setRotationAngle(data.rotationAngle);
    }
    if (data.rotationOrigin) {
        vehicleMarker.setRotationOrigin(data.rotationOrigin);
    }

    if (TRACKING_MODE === `true`) {
        //HIDE VEHICLE-MARKER WHEN IN TRACKING MODE			
        $(DOMClasses.customTrackUVehicleMarkerClass).hide();
    } else {
        //ENABLE VEHICLE-MARKER CLICK EVENT ON MAP ONLY WHEN NOT IN TRACKING MODE
        vehicleMarker.off(DOMEvents.click).on(DOMEvents.click, (event) => {           
            console.log(`Clicked on [${data.name}] with clientId [${data.clientId}]`)
            //showVehicleDetails(vehicleId, clientId);
            return;
        });
    }
};

trackuPruneCluster.BuildLeafletCluster = function(cluster, position) {
    
    var _this = this;
    var m = new L.Marker(position, {
        icon: this.BuildLeafletClusterIcon(cluster)
    });

    m._leafletClusterBounds = cluster.bounds;
    m.on(DOMEvents.click, function () {
        var cbounds = m._leafletClusterBounds;
        var markersArea = _this.Cluster.FindMarkersInArea(cbounds);
        var b = _this.Cluster.ComputeBounds(markersArea);
        if (b) {
            var bounds = new L.LatLngBounds(new L.LatLng(b.minLat, b.maxLng), new L.LatLng(b.maxLat, b.minLng));
            var zoomLevelBefore = _this._map.getZoom(), zoomLevelAfter = _this._map.getBoundsZoom(bounds, false, new L.Point(20, 20));
            if (zoomLevelAfter === zoomLevelBefore) {
                var filteredBounds = [];
                for (var i = 0, l = _this._objectsOnMap.length; i < l; ++i) {
                    var o = _this._objectsOnMap[i];
                    if (o.data._leafletMarker !== m) {
                        if (o.bounds.minLat >= cbounds.minLat &&
                            o.bounds.maxLat <= cbounds.maxLat &&
                            o.bounds.minLng >= cbounds.minLng &&
                            o.bounds.maxLng <= cbounds.maxLng) {
                            filteredBounds.push(o.bounds);
                        }
                    }
                }
                if (filteredBounds.length > 0) {
                    var newMarkersArea = [];
                    var ll = filteredBounds.length;
                    for (i = 0, l = markersArea.length; i < l; ++i) {
                        var markerPos = markersArea[i].position;
                        var isFiltered = false;
                        for (var j = 0; j < ll; ++j) {
                            var currentFilteredBounds = filteredBounds[j];
                            if (markerPos.lat >= currentFilteredBounds.minLat &&
                                markerPos.lat <= currentFilteredBounds.maxLat &&
                                markerPos.lng >= currentFilteredBounds.minLng &&
                                markerPos.lng <= currentFilteredBounds.maxLng) {
                                isFiltered = true;
                                break;
                            }
                        }
                        if (!isFiltered) {
                            newMarkersArea.push(markersArea[i]);
                        }
                    }
                    markersArea = newMarkersArea;
                }
                if (markersArea.length < 200 || zoomLevelAfter >= _this._map.getMaxZoom()) {
                    _this._map.fire('overlappingmarkers', {
                        cluster: _this,
                        markers: markersArea,
                        center: m.getLatLng(),
                        marker: m
                    });
                }
                else {
                    zoomLevelAfter++;
                }
                _this._map.setView(m.getLatLng(), zoomLevelAfter);
            }
            else {
                _this._map.fitBounds(bounds);
            }
        }
    });

    m.on(DOMEvents.mouseover, function() {

        const clusterTooltip = buildClusterTooltip(cluster.stats);        
        m.bindTooltip(clusterTooltip).openTooltip();
    });

    return m;
};

const establishCentrifugoConnection = () => {
    //SET CENTRIFUGO CONNECTION INSTANCE
    const CENTRIFUGE = new Centrifuge(DOMStrings.centrifugoWebsocketUrl);
    //ADD HS256 ACCESS TOKEN FOR AUTHENTICATION
    CENTRIFUGE.setToken(DOMStrings.centrifugoToken);
    //SUBSCRIBE TO CHANNEL FOR RECEIVING PUBLISHED VEHICLES
    CENTRIFUGE.subscribe(DOMStrings.centrifugoChannel, (message)=> {
        /** 
         * Callback to process vehicle updates received from Backend 
         */
        processDeviceForPlotting(message.data);
    });
    //ESTABLISH CONNECTION
    CENTRIFUGE.connect();
};
establishCentrifugoConnection();


/**
 * FUNCTION TO PLOT VEHICLE-MARKER ON MAP
 * --------------------------------------
 * @param {Object} vehicle
 */
const processDeviceForPlotting = (vehicle) => {
    
    /** Initialise all required vehicle data from {vehicle} response */
    const {
        vehicleId: VEHICLE_ID, 
        name: VEHICLE_NAME, 
        typeName: VEHICLE_TYPE, 
        clientId: VEHICLE_CLIENT_ID, 
        latitude: VEHICLE_LATITUDE, 
        longitude: VEHICLE_LONGITUDE, 
        licensePlate: VEHICLE_PLATE, 
        presentSpeed: VEHICLE_SPEED, 
        presentHeading: VEHICLE_HEADING, 
        presentEventTime: VEHICLE_EVENT_TIME, 
        fleetName: VEHICLE_FLEET = DOMStrings.notAvailable, 
        model: VEHICLE_MODEL = DOMStrings.notAvailable, 
        statusCodeDescription: VEHICLE_STATUS = DOMStrings.notAvailable
    } = vehicle;    
    
    /** Returns a Boolean value of whether Vehicle-Marker already exists on map */
    const markerAlreadyExists = checkIfVehicleMarkerExistsOnMap(`${DOMStrings.customTrackUVehicleMarkerClass}${VEHICLE_ID}`);

    /** Returns a Vehicle Icon Object containing the Icon-Image, Icon-Category & Icon-Weight */
    const VEHICLE_DATA = buildMarkerIconData(VEHICLE_ID, VEHICLE_TYPE, VEHICLE_EVENT_TIME, VEHICLE_SPEED);

    /** Returns an HTML Element to build the Vehicle-Marker Tooltip Content */
    const MARKER_TOOLTIP = buildMarkerTooltip(VEHICLE_NAME, VEHICLE_PLATE, VEHICLE_MODEL, VEHICLE_STATUS, VEHICLE_FLEET, VEHICLE_EVENT_TIME);

    switch (markerAlreadyExists) {
        case true:
            const existingMarker = getExistingVehicleMarker(`${DOMStrings.customTrackUVehicleMarkerClass}${VEHICLE_ID}`);     
            switch (validCoordinates(existingMarker.position.lat, existingMarker.position.lng)) {
                case true:

                    /**
                     * Return a promise that updates vehicle-marker tooltip and location on the map
                     * 
                     * <em> If this promise is resolved, return the new bearing of the vehicle.
                     * <em> If this promise is rejected, do not return anything.
                     * 
                     * The importance of this logic is to limit how often a vehicle-marker is removed from the map. 
                     */
                    const updateVehiclePromise = new Promise((resolve, reject)=> {
                        existingMarker.position.lat = VEHICLE_LATITUDE;
                        existingMarker.position.lng = VEHICLE_LONGITUDE;                        
                        existingMarker.category = VEHICLE_DATA.category;
                        existingMarker.weight = VEHICLE_DATA.weight;
                        existingMarker.data.name = VEHICLE_NAME;
                        existingMarker.data.tooltip = MARKER_TOOLTIP;
                        existingMarker.data.clientId = VEHICLE_CLIENT_ID;
                        trackuPruneCluster.ProcessView();

                        resolve(VEHICLE_HEADING);
                    });

                    /**
                     * If this promise is resolved, return the new bearing of the vehicle:
                     * 
                     * <em> If this new bearing is similar to the previous bearing of the vehicle (i.e vehicle has not changed its direction), 
                     *      DO NOTHING.
                     * <em> However if the new bearing is different from the previous bearing (i.e vehicle has changed its direction)
                     *      REMOVE VEHICLE-MARKER FROM MAP AND PLOT A NEW ONE USING THE NEW BEARING.
                     * 
                     * If this promise is rejected:
                     *      REMOVE VEHICLE-MARKER FROM MAP ANYWAY, AND PLOT A NEW ONE USING THE NEW BEARING.
                     *      (this is to ensure that the vehicle is updated on the map regardless)
                     */
                    updateVehiclePromise.then((heading)=> {
                        if (existingMarker.data.rotationAngle !== heading) {               
                            trackuPruneCluster.RemoveMarkers([existingMarker]);             
                            const updatedVehicleMarker = generateVehicleMarker(VEHICLE_CLIENT_ID, VEHICLE_ID, VEHICLE_NAME, VEHICLE_LATITUDE, VEHICLE_LONGITUDE, VEHICLE_HEADING, MARKER_TOOLTIP, VEHICLE_DATA);
                            markers.push(updatedVehicleMarker);
                            trackuPruneCluster.RegisterMarker(updatedVehicleMarker);
                            return;
                        }
                    }).catch(()=> {
                        trackuPruneCluster.RemoveMarkers([existingMarker]);             
                            const updatedVehicleMarker = generateVehicleMarker(VEHICLE_CLIENT_ID, VEHICLE_ID, VEHICLE_NAME, VEHICLE_LATITUDE, VEHICLE_LONGITUDE, VEHICLE_HEADING, MARKER_TOOLTIP, VEHICLE_DATA);
                            markers.push(updatedVehicleMarker);
                            trackuPruneCluster.RegisterMarker(updatedVehicleMarker);
                            return;
                    });

                break;
                case false:
                    //Vehicle has invalid coordinates
                break;
            }
        break;

        case false:
            switch (validCoordinates(VEHICLE_LATITUDE, VEHICLE_LONGITUDE)) {
                case true:       
                    const newVehicleMarker = generateVehicleMarker(VEHICLE_CLIENT_ID, VEHICLE_ID, VEHICLE_NAME, VEHICLE_LATITUDE, VEHICLE_LONGITUDE, VEHICLE_HEADING, MARKER_TOOLTIP, VEHICLE_DATA);
                    markers.push(newVehicleMarker);
                    trackuPruneCluster.RegisterMarker(newVehicleMarker);
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
 * FUNCTION TO BUILD A VEHICLE-MARKER
 * ----------------------------------
 * @param {UUID} clientId
 * @param {UUID} vehicleId
 * @param {String} vehicleName
 * @param {Double} vehicleLatitude
 * @param {Double} vehicleLongitude
 * @param {Integer} vehicleHeading
 * @param {HTML} popupBody
 * @param {Object} markerData
 * @returns Object
 */
const generateVehicleMarker = (clientId, vehicleId, vehicleName, vehicleLatitude, vehicleLongitude, vehicleHeading, toolTipBody, markerData) => {
    const marker = new PruneCluster.Marker(vehicleLatitude, vehicleLongitude, {
        rotationAngle: vehicleHeading,
        rotationOrigin: 'center',
        tooltip: toolTipBody,
        icon: markerData.icon
    });
    
    marker.category = markerData.category;
    marker.weight = markerData.weight;
    marker.data.name = vehicleName;
    marker.data.clientId = clientId;
    marker.data.forceIconRedraw = true;
    marker.data.tooltipOptions = {sticky: true, opacity: 1};
    marker.data.id = `${DOMStrings.customTrackUVehicleMarkerClass}${vehicleId}`;
    return marker;
};


/**
 * FUNCTION TO DETERMINE VEHICLE ICON 
 * ----------------------------------
 * @param {String} vehicleId
 * @param {String} vehicleType
 * @param {String} vehicleEventTime
 * @param {String} vehicleSpeed
 * @return {L.icon} leaflet icon
 */
let buildMarkerIconData = (vehicleId, vehicleType, vehicleEventTime, vehicleSpeed) => {
	if (vehicleType.toLowerCase().includes(`generator`)) {				
        if(vehicleUpdateDelayed(vehicleEventTime)) {
            return {
                'weight': parseInt(DOMStrings.CATEGORY_FAULTY),
                'category': parseInt(DOMStrings.CATEGORY_FAULTY),
                'icon': L.icon({iconUrl: `${CONTEXT}assets/images/gen_faulty.png`, iconSize: [22, 25], className: `${DOMStrings.customTrackUVehicleMarkerClass}${vehicleId}`})
            }
        } else {
            if (vehicleSpeed < 1)
                return {
                    'weight': parseInt(DOMStrings.CATEGORY_INACTIVE),
                    'category': parseInt(DOMStrings.CATEGORY_INACTIVE),
                    'icon': L.icon({iconUrl: `${CONTEXT}assets/images/gen_inactive.png`, iconSize: [22, 25], className: `${DOMStrings.customTrackUVehicleMarkerClass}${vehicleId}`})
                }
            return {
                'weight': parseInt(DOMStrings.CATEGORY_ACTIVE),
                'category': parseInt(DOMStrings.CATEGORY_ACTIVE),
                'icon': L.icon({iconUrl: `${CONTEXT}assets/images/gen_active.png`, iconSize: [22, 25], className: `${DOMStrings.customTrackUVehicleMarkerClass}${vehicleId}`})
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
 * @param eventTime
 * @return Boolean
 */
let vehicleUpdateDelayed = eventTime => {
    return moment(new Date()).diff(moment(new Date(eventTime)), 'hours') >= 4;
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
const buildMarkerTooltip = (vehicleName, vehiclePlate, vehicleModel, vehicleStatus, vehicleFleet, vehicleEventTime) => {
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
 * FUNCTION TO BUILD THE POPUP WINDOW OF A CLUSTER
 * -----------------------------------------------
 * @param {Object} clusterStatisticsData
 */
const buildClusterTooltip = clusterStatisticsData => {

    let faulty = '', inactive = '', active = '';
    const {1: FAULTY_CATEGORY, 2: INACTIVE_CATEGORY, 3: ACTIVE_CATEGORY} = clusterStatisticsData;
    if (FAULTY_CATEGORY > 0)
        faulty = `<span class="popup-info"><i class="fas fa-chart-pie text-danger mr-1"></i> Faulty Devices: ${FAULTY_CATEGORY}</span><br>`;    
    else
        faulty = '';
    if (INACTIVE_CATEGORY > 0)
        inactive = `<span class="popup-info"><i class="fas fa-chart-pie text-secondary mr-1"></i> Inactive Devices: ${INACTIVE_CATEGORY}</span><br>`; 
    else
        inactive = '';   
    if (ACTIVE_CATEGORY > 0)
        active = `<span class="popup-info"><i class="fas fa-chart-pie app-font-color mr-1"></i> Active Devices: ${ACTIVE_CATEGORY}</span><br>`;
    else
        active = '';
    
    return `<div class="d-flex flex-column">
                <div class="text-center">
                    <span class="vehicle-moving-status font-weight-bold">CLUSTER STATISTICS</span>
                </div>
                <hr class="mt-1 mb-2">
                <div class="app-font-color border-secondary">
                    ${faulty}
                    ${inactive}
                    ${active}
                </div>
            </div>`;
};


/**
 * FUNCTION TO CHECK IF A VEHICLE-MARKER EXISTS IN MARKER ARRAY
 * ------------------------------------------------------------
 * @param {String} vehicleId
 */
const checkIfVehicleMarkerExistsOnMap = vehicleId => {
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
const getExistingVehicleMarker = vehicleId => {
    let markerObject = new Object();
    for(const existingMarker of markers) {
        if (existingMarker.data.id === vehicleId) {
            markerObject = existingMarker;
        }
    }    
    return markerObject;
};

/**
 * FUNCTION TO CHECK IF COORDINATES ARE VALID.
 * -------------------------------------------
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
 * FUNCTION TO CONVERT 'ZONED-DATE-TIME' TO 'DATE'
 * -----------------------------------------------
 * @param {String} eventDate
 */
let convertUTCDateToLocalDate = (eventDate) => {
	
	const date = new Date(eventDate);

	let year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate(),
	  	hour = date.getHours(),
	  	minutes = date.getMinutes();

	if(day < 10)
	    day = '0' + day;
	if(month < 10)
		month = '0' + month;
	if(hour < 10)
		hour = '0' + hour;
	if(minutes < 10)
		minutes = '0' + minutes;

	return day + '-' + month + '-' + year + " " + hour + ":" + minutes;
};


/**
 * FUNCTION TO GET DURATION BETWEEN UPDATES
 * ----------------------------------------
 * @param String eventTime
 */
let getUpdatesDuration = (eventTime) => {

	let months, days, hours, mins, secs;
	const START = moment(new Date());							//CURRENT DATE/TIME
	const END = moment(new Date(eventTime));				//DEVICE UPDATE DATE/TIME	
	const DURATION = moment.duration(START.diff(END));		//DIFFERENCE BETWEEN BOTH DATE/TIMES

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
		mins = '';

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