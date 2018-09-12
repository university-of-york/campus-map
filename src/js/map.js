import CustomControls from 'js/customcontrols';
import Geolocation from 'js/geolocation';
import MapMarkers from 'js/mapmarkers';
import InfoWindows from 'js/infowindows';
import Utils from 'js/utils';
import MapSearch from 'js/mapsearch';
import MapTiles from 'js/maptiles';

'use strict';

$(function() {

    // defaults
    const GeoJSONFile = UOY_MAP.getConfig().geoJSONFile; // loads the geoJson file from the mapconfig.json file
    let cachedGeoJson = {};
    let map;
    let maxZoom = 18,
        minZoom = 8,
        defaultZoom = 14;
    let heslington = {
        lat: 53.9504,
        lng: -1.0660
    };
    // Google maps style that roughly matches our tiles
    let mapStyle = [
        {
            'featureType': 'landscape.man_made',
            'elementType': 'geometry.fill',
            'stylers': [
                {
                    'color': '#eeeeee'
                }
            ]
        },
        {
            'featureType': 'landscape.natural',
            'elementType': 'geometry.fill',
            'stylers': [
                {
                    'color': '#E7ECB1'
                }
            ]
        },
        {
            'featureType': 'water',
            'elementType': 'geometry.fill',
            'stylers': [
                {
                    'color': '#7599a2'
                }
            ]
        },
        {
            'featureType': 'poi',
            'stylers': [
                {
                    'visibility': 'off'
                }
            ]
        }];
    let $window = $(window);


    // load the map
    function loadMap() {
        return new google.maps.Map(document.getElementById('map'), {
            zoom: defaultZoom,
            maxZoom: maxZoom,
            minZoom: minZoom,
            center: heslington,
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            },
            scaleControl: true,
            streetViewControl: true,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            },
            fullscreenControl: false,
            disableDefaultUI: true,
            gestureHandling: 'greedy',
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: mapStyle
        });
    }


    // initialise the map
    function initMap() {

        // load the map
        map = loadMap();

        // pass the map object into our global uoy_map object for its use(s)
        try {
            UOY_MAP.setMap(map);
            UOY_MAP.plotPOIItems();

            MapTiles.setMap(map);
            Utils.setMap(map);
            InfoWindows.setMap(map);
            CustomControls.setMap(map);
            MapMarkers.setMap(map);
            MapSearch.setMap(map);
        } catch (e) {
            console.log(e);
        }

        // fit to campuses
        CustomControls.setBounds();

        // initialise our custom map tiles
        MapTiles.init();

        // add custom controls
        CustomControls.customFeedbackControl();
        CustomControls.customCampusControl();

        // Load GeoJSON.
        $.getJSON(GeoJSONFile).then(function(data) {
            cachedGeoJson = data; //save the geojson in case we want to update its values

            if(!Utils.isObjectReady(data.features)) {
                return false;
            }

            // Filter features that have contain certain terms
            // NOTE: this feature has been moved to the custom_groovy file direct at Funnelback

            // Update some wayward locations
            $.each(cachedGeoJson.features, function(i, d) {
                if (d.properties.codes === 'O/EXT/P-temp') {
                    cachedGeoJson.features[i].geometry.coordinates = [-1.051738, 53.9417839];
                    cachedGeoJson.features[i].properties.subtitle = 'Adjacent to Pavilion, Campus West';
                }
            });

            // initialise our map markers, search and Utils
            Utils.init(cachedGeoJson);
            Utils.checkHash();

            MapMarkers.init(cachedGeoJson);
            MapMarkers.addMarkers();

            MapSearch.init(cachedGeoJson);

            // For testing purposes
            // window.cachedGeoJson = cachedGeoJson;
        }).fail(function(err) {
            console.log('The map data failed to load', err);
        });

        google.maps.event.addListener(map, 'idle', function() {
            google.maps.event.trigger(map, 'resize');
        });
        google.maps.event.addListener(map, 'tilesloaded', function() {

            // show the various feedback and map location buttons
            $('#control-feedback-div').removeClass('is-hidden');
            $('#control-campus-buttons').removeClass('is-hidden');
            $('#control-campus-div').removeClass('is-hidden');
        });

    } // end initMap

    initMap();

    $window.on('hashchange', Utils.checkHash);

    $('#drawerStatusButton').click(Utils.toggleDrawer);

    MapSearch.searchPlaceholderText();

    // respond to resizing
    $(window).resize(MapSearch.searchPlaceholderText);

    // User location
    Geolocation.init(map);
});

