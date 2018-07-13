import MapAnalytics from 'js/analytics';
import InfoWindows from 'js/infowindows';
import MapMarkers from "js/mapmarkers";

const Utils = (function(){

    // Variable declaration
    let $panel = $('.panel');
    let $icon = $('.c-icon', '#drawerStatusButton');
    let _cachedGeoJson;
    let _gmap = null;

    // Private functions
    const snazzyOptionsAfterOpen_handler = function(opts) {
        $('.si-content-more-link').click(function () {
            let $infoPanelContent = $('.infoPanel__content');
            let $closeInfoPanel = $('.closeInfoPanel');
            let html = '<h3>' + opts.title + '</h3>';

            html += (opts.subtitle) ? '<h4>' + opts.subtitle + '</h4>' : '';
            html += (opts.shortdesc) ? '<p>' + opts.shortdesc + '</p>' : '';
            html += (opts.longdesc) ? '<p>' + opts.longdesc + '</p>' : '';

            $infoPanelContent.html(html);

            MapMarkers.openInfoPanel();
            toggleDrawer('close');
            $closeInfoPanel.click(MapMarkers.closeInfoPanel);

            // Send popup interaction event to GA
            MapAnalytics.addAnalyticsEvent('Popup interaction', opts.title + ' (more information)');
            $infoPanelContent.find('a').not('.locationMarker').click(function () {
                let $this = $(this);
                // Send panel interaction event to GA
                MapAnalytics.addAnalyticsEvent('Panel interaction', $this.text() + '(' + $this.attr('href') + ')');
            });
        });
    };

    const snazzyOptionsAfterClose_handler = function() {
        //affects hover popup
        //closeInfoPanel();
    };

    // Setters
    const setMap = function (map) {
        _gmap = map;
    };

    // Public functions

    // make a URL hash-friendly value from str
    const makeHash = function(str) {
        // Lower case
        // Replace all spaces with '-'
        // Remove all non-word or non-- chars ([^a-zA-Z0-9_-])
        // Encode as URI, just in case
        return encodeURI(str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, ''));
    };

    // Open/Close the drawer
    // Can call with argument 'open' or 'close'
    const toggleDrawer = function(e) {
        let overwrite;
        if (e === 'open') overwrite = 'open';
        if (e === 'close') overwrite = 'close';
        if ($panel.hasClass('is-open') || overwrite === 'close') {
            $icon.removeClass('c-icon--chevron-down').addClass('c-icon--chevron-up');
            $panel.removeClass('is-open');
        } else {
            $icon.removeClass('c-icon--chevron-up').addClass('c-icon--chevron-down');
            $panel.addClass('is-open');
        }
    };

    // Check whether there is a location hash,
    // and drop pin/open info panel for relevant location
    const checkHash = function() {
        let thisHash = document.location.hash.substr(1);
        let content;
        let selectedFeature;
        let location;

        if (thisHash === '' || _cachedGeoJson === undefined) {
            return false;
        }

        // Search GeoJSON for matching location
        selectedFeature = $.grep(_cachedGeoJson.features, function (feature) {
            return makeHash(feature.properties.title) === thisHash;
        });

        if (selectedFeature.length === 0) {
            return false;
        }

        content = '<h4>' + selectedFeature[0].properties.title + '</h4>';
        content += (selectedFeature[0].properties.longdesc !== undefined) ?
            '<p><a class=\'si-content-more-link\'>More information</a></p>' : '';

        location = {
            title: selectedFeature[0].properties.title,
            subtitle: selectedFeature[0].properties.subtitle,
            category: selectedFeature[0].properties.category,
            latlng: new google.maps.LatLng(parseFloat(selectedFeature[0].geometry.coordinates[1]), parseFloat(selectedFeature[0].geometry.coordinates[0])),
            shortdesc: selectedFeature[0].properties.shortdesc || false,
            longdesc: selectedFeature[0].properties.longdesc || false,
            content: content,
            zoom: parseInt(selectedFeature[0].properties.zoom, 10) || 16
        };

        // Drop pin and infoWindow on map
        if (location.category === 'Room') {
            InfoWindows.createInfoPanel(location);
        } else {
            InfoWindows.createInfoWindow(location);
            _gmap.panTo(location.latlng);
        }
    };



    const snazzyOptions = function(opts) {
        return {
            marker: opts.marker,
            panOnOpen: false,
            content: opts.content,
            placement: 'top',
            showCloseButton: true,
            closeOnMapClick: false,
            padding: '24px 18px',
            backgroundColor: 'rgba(15, 61, 76, 0.9)',
            border: false,
            borderRadius: '0.4rem',
            shadow: false,
            fontColor: '#fff',
            maxWidth: 320,
            closeWhenOthersOpen: true,
            offset: {
                top: '-8px',
                left: '2px'
            },
            callbacks: {
                afterOpen: snazzyOptionsAfterOpen_handler(opts),
                afterClose: snazzyOptionsAfterClose_handler
            }
        };
    };

    const init = function(geoJson) {
        _cachedGeoJson = geoJson;
    };

    return {
        toggleDrawer: toggleDrawer,
        snazzyOptions: snazzyOptions,
        checkHash: checkHash,
        makeHash: makeHash,
        setMap: setMap,
        init: init
    };
})();
export default Utils;