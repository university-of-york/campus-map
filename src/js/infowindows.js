import MapMarkers from 'js/mapmarkers';
import Utils from 'js/utils';
import MapAnalytics from 'js/analytics';

const InfoWindows = (function() {

    // Variable declaration
    let _gmap = null;

    // Private methods
    const locationMarkerClickHandler = function(options) {
        let data = options.data;

        createInfoWindow(data.location);

        //Close infoPanel on mobile
        if (data.infoPanel.outerWidth() === $(window).width()) {
            closeInfoPanel();
        }

        // Pan to location
        _gmap.setZoom(data.location.zoom);
        _gmap.panTo(data.location.latlng);

        // Send panel interaction event to GA
        MapAnalytics.addAnalyticsEvent('Panel interaction', data.linkText + ' (show location)');
    };

    function buildRoomHtml(isARoom, title, defaultContent) {
        let content = '<h4>' + title + '</h4><p>Approximate location only</p><p>Please allow yourself time to locate the room</p>';

        return isARoom ? content : defaultContent;
    }

    function buildInfoPanelHtml(location) {
        let html = '<h3>' + location.title + '</h3>';
        let locationLinkText = location.subtitle.replace(/\b(, Campus West|, Campus East|, King's Manor)\b/gi, '');

        html += (location.subtitle !== false) ? '<h4>' + location.subtitle + '</h4>' : '';
        html += (location.shortdesc !== false) ? '<p>' + location.shortdesc + '</p>' : '';
        html += (location.longdesc !== false) ? '<p>' + location.longdesc + '</p>' : '';
        html += (location.latlng !== '0,0') ? '<p><a class=\'locationMarker\'><i class=\'c-icon c-icon--map-marker\' aria-hidden=\'true\'></i></a>&nbsp;<a class=\'locationMarker\'>' + locationLinkText + '</a></p>' : '';

        return html;
    }

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
            content: buildRoomHtml(category === 'Room', title, location.content)
        };
        let thisOptions;
        let snazzy;

        MapMarkers.deleteMarkers();
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
        let html = buildInfoPanelHtml(location);
        let locationLinkText = location.subtitle.replace(/\b(, Campus West|, Campus East|, King's Manor)\b/gi, '');

        $('.infoPanel__content').html(html);
        openInfoPanel();

        $('.closeInfoPanel').click(closeInfoPanel);
        $('.locationMarker').click({
                infoPanel: $infoPanel,
                location: location,
                linkText: locationLinkText
            },
            locationMarkerClickHandler
        );
    };

    return {
        closeInfoPanel,
        openInfoPanel,
        popupAction,
        createInfoWindow,
        createInfoPanel,
        setMap
    };
}());
export default InfoWindows;