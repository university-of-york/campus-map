import MapAnalytics from 'js/analytics';
import Utils from 'js/utils';
import MapMarkers from './mapmarkers';

const MapSearch = (function() {

    // Variable declaration
    let $searchForm = $('#map-search-form');
    let $searchQuery = $('#map-search-query');
    let _cachedGeoJson;
    let _gmap = null;
    let _fuseOptions = {
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
    let _noSearchCategories = [
        'Post boxes',
        'Printers',
        'Bus stops',
        'Study spaces'
    ];

    // Private functions
    const submitForm = function() {
        let $autocompleteItems = $('.c-autocomplete__item');
        let selectedItem = $autocompleteItems.filter('.is-selected');
        let selectedLink = selectedItem.children('.c-autocomplete__link');
        let selectedTitle = selectedLink.children('.c-autocomplete__title').text();
        let selectedSubtitle = selectedLink.children('.c-autocomplete__subtitle').text();
        let selectedHash = selectedLink.attr('href').replace('#', '');
        let searchQueryText = $searchQuery.val();
        let selectedIndex = $autocompleteItems.index(selectedItem) + 1;
        let selectedFeature;
        let location;

        if (selectedItem.length === 0) {
            return false;
        }

        // Add is-selected value to search query
        $searchQuery.val(selectedTitle);
        selectedFeature = Utils.buildSelectedFeature(selectedHash);
        location = Utils.buildLocationObject(selectedFeature[0], selectedTitle, selectedSubtitle);
        location.content = Utils.buildLocationContent(selectedFeature[0]);
        MapMarkers.deleteMarkers();

        // Drop pin and infoWindow on map
        Utils.recenterMap(location);

        // Send query event to GA
        MapAnalytics.addAnalyticsEvent('Search', selectedTitle + ' (query: ' + searchQueryText + ')', selectedIndex);
    };

    const searchQueryClickHandler = function() {
        let $this = $(this);
        let searchTerm = $searchQuery.val();
        $this.select();
        if (searchTerm !== '') {
            // run the search
            $this.trigger('keyup');
        }
    };

    const searchFormSubmitHandler = function(e) {
        e.preventDefault();
        submitForm();
        return false;
    };

    const mapClickHandler = function(e) {
        let searchTerm = $searchQuery.val();
        if (searchTerm !== '') {
            // Send 'no selection' event to GA
            MapAnalytics.addAnalyticsEvent('Search', 'No selection (query: ' + searchTerm + ')');
        } else {
            // Send click event to GA
            MapAnalytics.addAnalyticsEvent('Click', e.latLng.lat() + ',' + e.latLng.lng());
        }
    };

    const initMapPanorama = function() {
        let mapPanorama = _gmap.getStreetView();
        mapPanorama.addListener('visible_changed', function() {
            let pos = mapPanorama.getPosition();
            // Send click event to GA
            MapAnalytics.addAnalyticsEvent('Show StreetView', pos.lat() + ',' + pos.lng());
        });
    };

    const initAutocomplete = function(fuseInstance) {
        const fuse = fuseInstance;
        const autoComplete = new window.AUTOCOMPLETE({
            input: $('#map-search-query'),
            results: function(searchTerm, onComplete) {
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

                $.each(fuseResult, function(i, feature) {
                    // Add title, subtitle, link fields
                    fuseResult[i].item.title = feature.item.properties.title;
                    fuseResult[i].item.subtitle = feature.item.properties.subtitle;
                    fuseResult[i].item.link = '#' + Utils.makeHash(feature.item.properties.title);
                    if (i === fuseResult.length - 1) {
                        onComplete(fuseResult);
                    }
                });
            },
            followLinks: false
        });
    };

    // Initialise search functionality
    const initSearch = function() {
        let searchGeoJson = JSON.parse(JSON.stringify(_cachedGeoJson));
        let fuse;

        searchGeoJson.features = $.grep(_cachedGeoJson.features, function(feature) {
            return $.inArray(feature.properties.category, _noSearchCategories) === -1;
        });

        fuse = new window.FUSE(searchGeoJson.features, _fuseOptions);

        initAutocomplete(fuse);

        // Select all text when you click the input (much easier than deleting existing value)
        // Also re-searches if there is content
        // TODO: move this to pattern lib
        $searchQuery.on('focus click', searchQueryClickHandler);

        // Prevent form submit
        $searchForm.on('submit', searchFormSubmitHandler);

        // Clicking on map closes autocomplete
        _gmap.addListener('click', mapClickHandler);

        initMapPanorama();
    }; // end initSearch

    // Setters
    const setMap = function(map) {
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
        searchPlaceholderText,
        init,
        setMap
    };
}());
export default MapSearch;