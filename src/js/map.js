import CustomControls from 'js/customcontrols';
import Geolocation from 'js/geolocation';
import MapMarkers from 'js/mapmarkers';
import InfoWindows from "js/infowindows";
import Utils from 'js/utils';
import MapSearch from 'js/mapsearch';

"use strict";

$(function () {

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
    let mapStyle = [{
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
            UOY_MAP.setGoogleMapObj(map);
            UOY_MAP.plotPOIItems();

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

        // overlay our tiles
        function CoordMapType(tileSize) {
            this.tileSize = tileSize;
        }

        // WHat tiles do we have available?
        // e.g. zoom 13, x from 4069-4073, y from 2630-2633
        let limits = {
            13: {xMin: 4069, xMax: 4073, yMin: 2630, yMax: 2633},
            14: {xMin: 8139, xMax: 8146, yMin: 5260, yMax: 5266},
            15: {xMin: 16279, xMax: 16292, yMin: 10520, yMax: 10533},
            16: {xMin: 32558, xMax: 32585, yMin: 21040, yMax: 21067},
            17: {xMin: 65116, xMax: 65170, yMin: 42080, yMax: 42135},
            18: {xMin: 130233, xMax: 130341, yMin: 84161, yMax: 84271}
        };

        CoordMapType.prototype.getTile = function (coord, zoom, ownerDocument) {
            let span = ownerDocument.createElement('span');
            //if (1 == 1) return ownerDocument.createElement('span');
            // Find out if it's outside our limits
            if (!limits[zoom]) return span;
            if (coord.x > limits[zoom].xMax) return span;
            if (coord.x < limits[zoom].xMin) return span;
            if (coord.y > limits[zoom].yMax) return span;
            if (coord.y < limits[zoom].yMin) return span;
            let tile = ownerDocument.createElement('img');

            tile.src = 'https://www.york.ac.uk/static/maptiles/' + zoom + '/' + coord.x + '/' + coord.y + '.png';
            return tile;
        };

        map.overlayMapTypes.insertAt(0, new CoordMapType(new google.maps.Size(256, 256)));

        // add custom controls
        CustomControls.customFeedbackControl();
        CustomControls.customCampusControl();

        // Load GeoJSON.
        $.getJSON(GeoJSONFile).then(function (data) {
            cachedGeoJson = data; //save the geojson in case we want to update its values
            // Filter features that have contain certain terms
            cachedGeoJson.features = $.grep(data.features, function (feature) {
                let title = feature.properties.title;
                let filterPhrases = [
                    'DELETE',
                    'REMOVE',
                    'DOES NOT EXIST',
                    'no longer bookable',
                    'NO LONGER BOOKABLE',
                    'NOW A KITCHEN',
                    'USE248X'
                ];
                let r = -1;
                $.each(filterPhrases, function (i, phrase) {
                    let phraseIndex = title.indexOf(phrase);
                    if (phraseIndex > -1) {
                        r = phraseIndex;
                        return false;
                    }
                });
                if (r > -1) return true;
                // Check lat and long to see if it's 0,0 (fake data)
                if (feature.geometry.coordinates[0] === 0 || feature.geometry.coordinates[1] === 0) {
                    return true;
                }
            }, true); // Change to false to invert the filter i.e. show 'bad' results
            // Update some wayward locations
            $.each(cachedGeoJson.features, function (i, d) {
                if (d.properties.codes == 'O/EXT/P-temp') {
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
        }).fail(function (err) {
            console.log('The map data failed to load', err);
        });

        google.maps.event.addListener(map, 'idle', function () {
            google.maps.event.trigger(map, 'resize');
        });
        google.maps.event.addListener(map, 'tilesloaded', function(){

            // show the various feedback and map location buttons
            $('#control-feedback-div').removeClass('is-hidden');
            $('#control-campus-buttons').removeClass('is-hidden');
            $('#control-campus-div').removeClass('is-hidden');
        });

    } // end initMap

    initMap();

    $window.on('hashchange', Utils.checkHash());

    $('#drawerStatusButton').click(Utils.toggleDrawer);

    MapSearch.searchPlaceholderText();

    // respond to resizing
    $(window).resize(MapSearch.searchPlaceholderText);

    // User location
    Geolocation.init(map);
});

