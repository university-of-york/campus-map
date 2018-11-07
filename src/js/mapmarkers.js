import InfoWindows from 'js/infowindows';
import MapAnalytics from 'js/analytics';
import Utils from "./utils";

const MapMarkers = (function() {

    // Variable definitions
    let _gmap = null;
    let _markerGroups = {};
    let _markerFeatures = {};
    let _markers = [];
    let $selectables = $('.c-btn--selectable');
    let $facilityAnchors = $('.c-anchor--facility');
    let _cachedGeoJson = {};

    // Private functions
    function showMarkers($s) {
        let selectableCategory = $s.attr('id');
        let thisGroup = {};

        Object.entries(_markerGroups).forEach(function(keyValuePair) {
            if(keyValuePair[0] === selectableCategory) {
                thisGroup = keyValuePair[1];
            }
        });

        // add the geoJson to the markerFeatures object
        _markerFeatures[selectableCategory] = _gmap.data.addGeoJson(thisGroup);

        _gmap.data.addListener('click', InfoWindows.popupAction);
        _gmap.data.addListener('mouseover', InfoWindows.popupAction);
        _gmap.data.setStyle(function(feature) {
            let featureCategory = feature.getProperty('category').toLowerCase().replace(/\s+/g, '-');
            let icon = {
                url: 'img/markers/' + featureCategory + '.svg',
                anchor: new google.maps.Point(10, 10),
                scaledSize: new google.maps.Size(22, 22)
            };
            return {
                icon: icon,
                optimized: false,
                zIndex: 999
            };
        });
        // Send facilities event to GA
        MapAnalytics.addAnalyticsEvent('Show facilities', selectableCategory);
    }

    // find the target checkbox and trigger the 'check' function
    const triggerFacilitiesClick = function(facilityId) {
        let selectable = $('#' + facilityId);

        if(Utils.isObjectReady(selectable)) {
            selectable.trigger('click');
        }
    };

    const setAnchorLinks = function() {
        $facilityAnchors.click(function(e) {
            e.preventDefault();

            triggerFacilitiesClick($this.data('selectable-id'));
        })
    };

    // Setters
    const setMap = function(map) {
        _gmap = map;
    };

    // Public functions
    const deleteMarkers = function() {
        //Loop through all the markers and remove
        //console.log(markers);
        for (let i = 0; i < _markers.length; i++) {
            _markers[i].setMap(null);
            // Remove snazzy window
            if (_markers[i].snazzy) {
                _markers[i].snazzy.destroy();
            }
        }
        _markers = [];
    };

    // add groups of markers based on selectable categories
    const addMarkers = function() {
        // Make arrays of markers for each category

        $selectables.each(function() {
            let $selectable = $(this);
            let selectableCategory = $selectable.attr('id');
            // 'Clone' new GeoJSON file for each category
            _markerGroups[selectableCategory] = JSON.parse(JSON.stringify(_cachedGeoJson));
            _markerGroups[selectableCategory].features = $.grep(_cachedGeoJson.features, function(feature) {
                let featureCategory = feature.properties.category.toLowerCase().replace(/\s+/g, '-');
                return featureCategory === selectableCategory;
            });
        });

        $selectables.click(function() {
            let $selectable = $(this),
                selectableCategory = $selectable.attr('id');

            if ($selectable.is(':checked')) {
                showMarkers($selectable);
            } else {
                $.each(_markerFeatures[selectableCategory], function(i, feature) {
                    _gmap.data.remove(feature);
                });
                // Send facilities event to GA
                MapAnalytics.addAnalyticsEvent('Hide facilities', selectableCategory);
            }
        });

        // If there are any selectables selected on load, show the icons on the map
        // This happens when navigating away, then back
        $selectables.each(function(i, v) {
            let $v = $(v);
            if ($v.prop('checked') === true) {
                showMarkers($v);
            }
        });
    };

    // show the set of facilities belonging to the selectable id passed in
    const showFacilities = function(facilityId) {
        triggerFacilitiesClick(facilityId);
    };

    const addMarkerToCollection = function(newMarker) {
        _markers.push(newMarker);
    };

    const init = function(geoJson) {
        _cachedGeoJson = geoJson;
        setAnchorLinks();

        // if someone has visited via a facilities link, get it and show
        // the relevant facilities.
        const facilityId = Utils.getQuerystringValue('facility');

        if(Utils.isObjectReady(facilityId)) {
            showFacilities(facilityId);
        }
    };


    return {
        deleteMarkers,
        addMarkers,
        setMap,
        init,
        addMarkerToCollection,
        showFacilities
    };
}());
export default MapMarkers;