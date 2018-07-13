import MapAnalytics from 'js/analytics';
import InfoWindows from 'js/infowindows';
import MapMarkers from 'js/mapmarkers';
import Utils from 'js/utils';

const MapSearch = (function(){

    // Variable declaration
    let $searchForm = $('#map-search-form');
    let $searchQuery = $('#map-search-query');
    let _cachedGeoJson;
    let _gmap = null;

    // Private functions
    const searchQuery_ClickHandler = function(e) {
        let $this = $(this);
        let searchTerm = $searchQuery.val();
        $this.select();
        if (searchTerm != '') {
            // run the search
            $this.trigger('keyup');
        }
    };

    const searchForm_SubmitHandler = function (e) {
        e.preventDefault();
        return false;
    };

    const map_ClickHandler = function (e) {
        let searchTerm = $searchQuery.val();
        if (searchTerm !== '') {
            // Send 'no selection' event to GA
            MapAnalytics.addAnalyticsEvent('Search', 'No selection (query: ' + searchTerm + ')');
        } else {
            // Send click event to GA
            MapAnalytics.addAnalyticsEvent('Click', e.latLng.lat() + ',' + e.latLng.lng());
        }
    };

    const handleMapPins = function(location) {
        // Drop pin and infoWindow on map
        if (location.category === 'Room') {
            InfoWindows.createInfoPanel(location);
        } else {
            InfoWindows.closeInfoPanel();
            InfoWindows.createInfoWindow(location);
            // move viewport to correct location and zoom - not working
            //map.setZoom(location.zoom);
            _gmap.panTo(location.latlng);
        }
    };

    const initMapPanorama = function() {
        let mapPanorama = _gmap.getStreetView();
        mapPanorama.addListener('visible_changed', function () {
            let pos = mapPanorama.getPosition();
            // Send click event to GA
            MapAnalytics.addAnalyticsEvent('Show StreetView', pos.lat() + ',' + pos.lng());
        });
    };

    const initAutocomplete = function(fuseInstance) {
        const fuse = fuseInstance;

        new window.AUTOCOMPLETE({
            input: $('#map-search-query'),
            results: function (searchTerm, onComplete) {
                let fuseResult = fuse.search(searchTerm);

                if (fuseResult.length === 0) {
                    // Send 'no results' event to GA
                    MapAnalytics.addAnalyticsEvent('Search', 'No results (query: ' + searchTerm + ')');
                    return false;
                }

                if (fuseResult.length > 10) {
                    // Cut down to first 10
                    fuseResult.length = 10;
                }

                $.each(fuseResult, function (i, feature) {
                    // Add title, subtitle, link fields
                    fuseResult[i].item.title = feature.item.properties.title;
                    fuseResult[i].item.subtitle = feature.item.properties.subtitle;
                    fuseResult[i].item.link = '#' + Utils.makeHash(feature.item.properties.title);
                    if (i === fuseResult.length - 1) {
                        onComplete(fuseResult);
                    }
                });
            },
            followLinks: true
        });
    };

    // Submit the form using the is-selected item
    const submitForm = function () {
        let $autocompleteItems = $('.c-autocomplete__item', $autocompleteList);
        let selectedItem = $autocompleteItems.filter('.is-selected');
        let selectedLink = selectedItem.children('.c-autocomplete__link');
        let selectedTitle = selectedLink.children('.c-autocomplete__title').text();
        let selectedSubtitle = selectedLink.children('.c-autocomplete__subtitle').text();
        let selectedHash = selectedLink.attr('href');
        let searchQueryText = $searchQuery.val();
        let selectedIndex = $autocompleteItems.index(selectedItem) + 1;
        let selectedFeature;
        let content = '<h4>' + selectedTitle + '</h4>';
        let location;

        if (selectedItem.length === 0) {
            return false;
        }

        // Add is-selected value to search query
        $searchQuery.val(selectedTitle);

        // Update hash
        if (history.pushState) {
            history.pushState(null, null, selectedHash);
        } else {
            window.location.hash = selectedHash;
        }

        // Get rest of details from cachedGeoJson
        selectedFeature = $.grep(_cachedGeoJson.features, function (feature) {
            return feature.properties.title === selectedTitle;
        });

        // Is there more than one with this title? Check against subtitle
        // Should really use a unique ID
        if (selectedFeature.length > 1 && selectedSubtitle != '') {
            selectedFeature = $.grep(selectedFeature, function (feature) {
                return feature.properties.subtitle === selectedSubtitle;
            });
        }

        content += (selectedFeature[0].properties.longdesc !== undefined) ?
            '<p><a class=\'si-content-more-link\'>More information</a></p>' : '';

        location = {
            title: selectedTitle,
            subtitle: selectedSubtitle,
            latlng: new google.maps.LatLng(parseFloat(selectedFeature[0].geometry.coordinates[1]), parseFloat(selectedFeature[0].geometry.coordinates[0])),
            category: selectedFeature[0].properties.category || false,
            subcategory: selectedFeature[0].properties.subcategory || false,
            shortdesc: selectedFeature[0].properties.shortdesc || false,
            longdesc: selectedFeature[0].properties.longdesc || false,
            content: content,
        };

        MapMarkers.deleteMarkers();
        handleMapPins(location);

        // Send query event to GA
        MapAnalytics.addAnalyticsEvent('Search', selectedTitle + ' (query: ' + searchQueryText + ')', selectedIndex);
    };

    // Initialise search functionality
    const initSearch = function() {

        let fuseOptions = {
            keys: [{
                name: 'properties.title',
                weight: 0.6
            }, {
                name: 'properties.subtitle',
                weight: 0.3
            }, {
                name: 'properties.codes',
                weight: 0.7
            }],
            threshold: 0.4,
            includeScore: true,
            includeMatches: true,
            tokenize: true,
            //location:0,
            minMatchCharLength: 3
        };
        let noSearchCategories = [
            'Post boxes',
            'Printers',
            'Bus stops',
            'Study spaces'
        ];
        let searchGeoJson = JSON.parse(JSON.stringify(_cachedGeoJson));
        let fuse;

        searchGeoJson.features = $.grep(_cachedGeoJson.features, function (feature) {
            return $.inArray(feature.properties.category, noSearchCategories) === -1;
        });

        fuse = new window.FUSE(searchGeoJson.features, fuseOptions);

        initAutocomplete(fuse);

        // Select all text when you click the input (much easier than deleting existing value)
        // Also re-searches if there is content
        // TODO: move this to pattern lib
        $searchQuery.on('focus click', searchQuery_ClickHandler);

        // Prevent form submit
        $searchForm.on('submit', searchForm_SubmitHandler);

        // Clicking on map closes autocomplete
        _gmap.addListener('click', map_ClickHandler);

        initMapPanorama();
    }; // end initSearch

    // Setters
    const setMap = function (map) {
        _gmap = map;
    };

    // Public functions

    // Update placeholder text
    const searchPlaceholderText = function() {
        let placeholderText = ($(window).width() < 1024) ? 'Search the map' : 'Search for buildings, departments and rooms';
        $('input').attr('placeholder', placeholderText);
    };

    const init = function(geoJson) {
        _cachedGeoJson = geoJson;
        initSearch();
    };

    return {
        searchPlaceholderText: searchPlaceholderText,
        init: init,
        setMap: setMap
    };
})();
export default MapSearch;