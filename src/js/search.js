
import MapAnalytics from 'js/analytics';
import Utils from 'js/utils';

const Search = (function() {

    // --------------------------------------------------

    // Our map and geoJson data
    let _map;
    let _geoJson;

    // Search form elements
    let $searchForm = $('#map-search-form');
    let $searchQuery = $('#map-search-query');
    
    // Fuse config
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
        minMatchCharLength: 3
    };

    // Categories not to include in the search
    let _excludedCategories = [
        'Post boxes',
        'Printers',
        'Bus stops',
        'Study spaces'
    ];

    // --------------------------------------------------

    const init = function( map , geoJson ) {

        // Set map and geoJson data
        _map = map;
        _geoJson = geoJson;

        // Strip out categories that we won't be searching
        _geoJson.features = _geoJson.features.filter( ( feature ) => {
            return $.inArray( feature.properties.category , _excludedCategories ) === -1;
        } );
        
        initSearch();
    };

    // --------------------------------------------------

    const initSearch = function() {

        let fuse = new window.FUSE( _geoJson.features, _fuseOptions);

        initAutocomplete( fuse );

        // Select all text when you click the input (much easier than deleting existing value)
        // Also re-searches if there is content
        // TODO: move this to pattern lib
        // $searchQuery.on('focus click', searchQueryClickHandler);

        // Prevent form submit and run our own submitForm()
        $searchForm.on('submit', searchFormSubmitHandler);

        // Clicking on map closes autocomplete
        // _gmap.addListener('click', mapClickHandler);

        // initMapPanorama();

    };

    // --------------------------------------------------

    const initAutocomplete = function( fuse ) {

        const autoComplete = new window.AUTOCOMPLETE({
            input: $searchQuery,
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
                    fuseResult[i].item.link = '#' + makeHash(feature.item.properties.locationid);
                    if (i === fuseResult.length - 1) {
                        onComplete(fuseResult);
                    }
                });
            },
            followLinks: false
        });

    };

    // --------------------------------------------------

    const searchFormSubmitHandler = function(e) {
        e.preventDefault();
        submitForm();
        return false;
    };

    // --------------------------------------------------

    const submitForm = function() {
        let $autocompleteList = $('.c-autocomplete__list');
        let $autocompleteItems = $('.c-autocomplete__item');
        let selectedItem = $autocompleteItems.filter('.is-selected');
        let selectedLink = selectedItem.children('.c-autocomplete__link');
        let selectedTitle = selectedLink.children('.c-autocomplete__title').text();
        let selectedSubtitle = selectedLink.children('.c-autocomplete__subtitle').text();
        let selectedHash = Utils.strReplace(selectedLink.attr('href'), '#', '');
        let searchQueryText = $searchQuery.val();
        let selectedIndex = $autocompleteItems.index(selectedItem) + 1;
        let selectedFeature;
        let location;

        if (selectedItem.length === 0) {
            return false;
        }

        // Add is-selected value to search query
        $searchQuery.val(selectedTitle);
        updateWindowHash(selectedHash);
        selectedFeature = Utils.buildSelectedFeature(selectedHash);
        location = Utils.buildLocationObject(selectedFeature[0], selectedTitle, selectedSubtitle);
        location.content = Utils.buildLocationContent(selectedFeature[0]);
        // MapMarkers.deleteMarkers();

        // Clear the search result list
        $autocompleteList.empty();

        // Drop pin and infoWindow on map
        Utils.recenterMap(location);

        // Send query event to GA
        MapAnalytics.addAnalyticsEvent('Search', selectedTitle + ' (query: ' + searchQueryText + ')', selectedIndex);
    };

    // --------------------------------------------------

    const updateWindowHash = function(selectedHash) {
        window.location.hash = selectedHash;
    };

    // --------------------------------------------------

    // make a URL hash-friendly value from str
    const makeHash = function(str) {
        // Lower case
        // Replace all spaces with '-'
        // Remove all non-word or non-- chars ([^a-zA-Z0-9_-])
        // Encode as URI, just in case
        // if(!isObjectReady(str)) {
        //     return encodeURI('');
        // }
        return encodeURI(str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, ''));
    };

    // --------------------------------------------------

    return {
        init
    };

    // --------------------------------------------------

}());

export default Search;
