import MapMarkers from 'js/mapmarkers';
import Utils from 'js/utils';
import MapAnalytics from 'js/analytics';

const InfoWindows = (function(){

    // Variable declaration
    let _gmap = null;

    // Private methods
    const locationMarker_ClickHandler = function(infoPanel, location, linkText) {
        console.log('click handler fired');

        createInfoWindow(location);
        //Close infoPanel on mobile
        if (infoPanel.outerWidth() === $(window).width()) {
            closeInfoPanel();
        }
        // Pan to location
        _gmap.setZoom(location.zoom);
        _gmap.panTo(location.latlng);

        // Send panel interaction event to GA
        MapAnalytics.addAnalyticsEvent('Panel interaction', linkText + ' (show location)');
    };

    // Setters
    const setMap = function(map) {
        _gmap = map;
    };

    // Public methods
    const closeInfoPanel = function() {
        let $infoPanel = $('.infoPanel.is-open');
        if ($infoPanel.length > 0) {
            $infoPanel.removeClass('is-open');
        }
    };

    const openInfoPanel = function() {
        let $infoPanel = $('.infoPanel').not('.is-open');
        if ($infoPanel.length > 0) {
            $infoPanel.addClass('is-open');
        }
    };

    const createInfoWindow = function(location) {
        // Everything must have a title!
        if (!location.title) {
            return false;
        }
        let title = location.title;
        let subTitle = location.subtitle || false;
        let subCategory = location.subcategory || false;
        let category = location.category || false;
        let shortdesc = location.shortdesc || false;
        let longdesc = location.longdesc || false;
        let zoom = location.zoom || 16;
        let content;
        let marker = new google.maps.Marker({
            position: location.latlng,
            map: _gmap,
            title: title,
            subtitle: subTitle,
            subCategory: subCategory,
            category: category,
            zoom: zoom
        });
        let snazzyMapOptions = {
            title: title,
            subtitle: subTitle,
            subCategory: subCategory,
            category: category,
            marker: marker,
            shortdesc: shortdesc,
            longdesc: longdesc,
            content: ''
        };
        let thisOptions;
        let snazzy;

        if (category === 'Room') {
            content = '<h4>' + title + '</h4>';
            content += '<p>Approximate location only</p>';
            content += '<p>Please allow yourself time to locate the room</p>';
        } else {
            content = location.content;
        }

        MapMarkers.deleteMarkers();
        snazzyMapOptions.content = content;
        thisOptions = Utils.snazzyOptions(snazzyMapOptions);

        // Set up the snazzy map element
        snazzy = new SnazzyInfoWindow(thisOptions);
        snazzy.open(_gmap, marker);

        // Add the snazzy window to the marker (so can be removed)
        marker.snazzy = snazzy;
        MapMarkers.addMarkerToCollection(marker);

        // hide the red marker
        marker.setVisible(false);

        return marker;
    };

    //what to do when a marker is hovered over or clicked
    const popupAction = function(event) {
        let location = {
            title: event.feature.getProperty('title'),
            subtitle: event.feature.getProperty('subtitle'),
            latlng: event.feature.getGeometry().get(),
            category: event.feature.getProperty('category'),
            subcategory: event.feature.getProperty('subcategory'),
            shortdesc: event.feature.getProperty('shortdesc') || '',
            longdesc: event.feature.getProperty('longdesc') || '',
            content: ''
        };

        location.content = '<h4>' + location.title + '</h4>' + location.shortdesc;
        // don't add the 'more information' link if there's no long desc
        location.content += (location.longdesc !== '') ? '<p><a class=\'si-content-more-link\'>More information</a></p>' : '';

        event.feature.marker = createInfoWindow(location);

        // Send marker event to GA
        MapAnalytics.addAnalyticsEvent('Select marker', location.title);
    };

    const createInfoPanel = function(location) {
        let $infoPanel = $('.infoPanel');
        let html = '<h3>' + location.title + '</h3>';
        let locationLinkText = location.subtitle.replace(/\b(, Campus West|, Campus East|, King's Manor)\b/gi, '');

        html += (location.subtitle !== false) ? '<h4>' + location.subtitle + '</h4>' : '';
        html += (location.shortdesc !== false) ? '<p>' + location.shortdesc + '</p>' : '';
        html += (location.longdesc !== false) ? '<p>' + location.longdesc + '</p>' : '';
        html += (location.latlng !== '0,0') ? '<p><a class=\'locationMarker\'><i class=\'c-icon c-icon--map-marker\' aria-hidden=\'true\'></i></a>&nbsp;<a class=\'locationMarker\'>' + locationLinkText + '</a></p>' : '';

        $('.infoPanel__content').html(html);
        openInfoPanel();

        $('.closeInfoPanel').click(closeInfoPanel);
        $('.locationMarker').click(locationMarker_ClickHandler($infoPanel, location, locationLinkText));

        // $('.locationMarker').click(function(){
        //     console.log('click handler fired');
        //
        //     createInfoWindow(location);
        //     //Close infoPanel on mobile
        //     if ($infoPanel.outerWidth() === $(window).width()) {
        //         closeInfoPanel();
        //     }
        //     // Pan to location
        //     _gmap.setZoom(location.zoom);
        //     _gmap.panTo(location.latlng);
        //
        //     // Send panel interaction event to GA
        //     MapAnalytics.addAnalyticsEvent('Panel interaction', locationLinkText + ' (show location)');
        // });
    };

    return {
        closeInfoPanel: closeInfoPanel,
        openInfoPanel: openInfoPanel,
        popupAction: popupAction,
        createInfoWindow: createInfoWindow,
        createInfoPanel: createInfoPanel,
        setMap: setMap
    };
})();
export default InfoWindows;