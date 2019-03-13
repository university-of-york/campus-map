import MapAnalytics from 'js/analytics';
import InfoWindows from 'js/infowindows';

const Utils = (function() {

    // Variable declaration
    let $panel = $('.panel');
    let $icon = $('.c-icon', '#drawerStatusButton');
    let _cachedGeoJson;
    let _map = null;
    let _urlParams = {};

    // Private functions

    // Open/Close the drawer
    // Can call with argument 'open' or 'close'
    const toggleDrawer = function(e) {
        let panelOpen = $panel.hasClass('is-open') || e === 'close',
            iconRemoveClass = panelOpen ? 'c-icon--chevron-down' : 'c-icon--chevron-up',
            iconAddClass = panelOpen ? 'c-icon--chevron-up' : 'c-icon--chevron-down';

        $icon.removeClass(iconRemoveClass).addClass(iconAddClass);

        if (panelOpen) {
            $panel.removeClass('is-open');
        } else {
            $panel.addClass('is-open');
        }
    };

    const snazzyOptionsAfterOpenHandler = function(opts) {
        $('.si-content-more-link').click(function() {
            let $infoPanelContent = $('.infoPanel__content');
            let $closeInfoPanel = $('.closeInfoPanel');
            let html = '<h3>' + opts.title + '</h3>';

            html += (opts.subtitle) ? '<h4>' + opts.subtitle + '</h4>' : '';
            html += (opts.shortdesc) ? '<p>' + opts.shortdesc + '</p>' : '';
            html += (opts.longdesc) ? '<p>' + opts.longdesc + '</p>' : '';

            $infoPanelContent.html(html);

            InfoWindows.openInfoPanel();
            toggleDrawer('close');
            $closeInfoPanel.click(InfoWindows.closeInfoPanel);

            // Send popup interaction event to GA
            MapAnalytics.addAnalyticsEvent('Popup interaction', opts.title + ' (more information)');
            $infoPanelContent.find('a').not('.locationMarker').click(function() {
                let $this = $(this);
                // Send panel interaction event to GA
                MapAnalytics.addAnalyticsEvent('Panel interaction', $this.text() + '(' + $this.attr('href') + ')');
            });
        });
    };

    const snazzyOptionsAfterCloseHandler = function() {
        //affects hover popup
        //closeInfoPanel();
    };

    const getUrlParameterFallback = function(name) {
        let regex,
            results;

        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        results = regex.exec(location.search);

        return results === null ? false : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };


    // Getters
    //


    // Setters
    const setMap = function(map) {
        _map = map;
    };


    // Public functions
    const isObjectReady = function(obj) {

        return typeof obj !== 'undefined';

        // return (
        //     obj === null ||
        //     !obj ||
        //     typeof obj === 'undefined'
        // );
    };

    // make a URL hash-friendly value from str
    const makeHash = function(str) {
        // Lower case
        // Replace all spaces with '-'
        // Remove all non-word or non-- chars ([^a-zA-Z0-9_-])
        // Encode as URI, just in case
        if(!isObjectReady(str)) {
            return encodeURI('');
        }
        return encodeURI(str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, ''));
    };

    const buildLocationObject = function(feature, title, subtitle) {
        return {
            title: title || feature.properties.title,
            subtitle: subtitle || feature.properties.subtitle,
            category: feature.properties.category,
            latlng: new google.maps.LatLng(
                parseFloat(feature.geometry.coordinates[1]),
                parseFloat(feature.geometry.coordinates[0])
            ),
            shortdesc: feature.properties.shortdesc || false,
            longdesc: feature.properties.longdesc || false,
            content: '',
            zoom: parseInt(feature.properties.zoom, 10) || 16,
            locationid: feature.properties.locationid || title || feature.properties.title
        };
    };

    const buildLocationContent = function(feature, title) {
        let titleToUse = title || feature.properties.title;
        let content = '<h4>' + titleToUse + '</h4>';

        if(typeof(feature.properties.longdesc) !== 'undefined') {
            content += '<p><a class=\'si-content-more-link\'>More information</a></p>';
        }

        return content;
    };

    const buildSelectedFeature = function(thisHash) {
        let useLocationId = thisHash.indexOf('locid') >= 0, // check for location id usage first
            selectedFeature;

        if(!isObjectReady(_cachedGeoJson) &&
            !isObjectReady(_cachedGeoJson.features)) {
            return false;
        }

        // Search GeoJSON for matching location
        selectedFeature = $.grep(_cachedGeoJson.features, function(feature) {
            // try location id usage first, fallback to title.
            let locationId = useLocationId ? feature.properties.locationid : feature.properties.title;
            return makeHash(locationId) === thisHash;
        });

        return selectedFeature;
    };

    const recenterMap = function(location) {
        if (location.category === 'Room') {
            InfoWindows.createInfoPanel(location);
            return;
        }

        InfoWindows.createInfoWindow(location);
        _map._gmap.panTo(location.latlng);
    };

    const strReplace = function(input, strToFind, replaceValue) {
        if(input && input !== '' && input.length > 0) {
            return input.replace(strToFind, replaceValue);
        }

        return '';
    };

    // Check whether there is a location hash,
    // and drop pin/open info panel for relevant location
    const checkHash = function() {
        let thisHash = document.location.hash.substr(1);
        let selectedFeature = buildSelectedFeature(thisHash);
        let location;

        if (thisHash === '' ||
            !Utils.isObjectReady(thisHash) ||
            !Utils.isObjectReady(_cachedGeoJson) ||
            selectedFeature.length === 0) {
            return false;
        }

        location = buildLocationObject(selectedFeature[0]);
        location.content = buildLocationContent(selectedFeature[0]);

        // Drop pin and infoWindow on map
        recenterMap(location);
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
                afterOpen: () => { snazzyOptionsAfterOpenHandler(opts); },
                afterClose: snazzyOptionsAfterCloseHandler
            }
        };
    };

    const getQuerystringValue = function(valueToFind) {
        if(_urlParams !== false) {
            return  _urlParams.has(valueToFind) ? _urlParams.get(valueToFind) : false;
        }

        // use the fallback instead
        return getUrlParameterFallback(valueToFind);
    };

    const init = function(geoJson) {
        _cachedGeoJson = geoJson;

        // check for querystring values
        (window.onpopstate = function() {

            if(typeof URLSearchParams !== 'function') {
                _urlParams = false;
            } else {
                _urlParams = new URLSearchParams(window.location.search);
            }
        })();
    };

    return {
        isObjectReady,
        buildLocationObject,
        buildLocationContent,
        buildSelectedFeature,
        strReplace,
        recenterMap,
        toggleDrawer,
        snazzyOptions,
        checkHash,
        makeHash,
        setMap,
        getQuerystringValue,
        init
    };
}());
export default Utils;