
import MapAnalytics from 'js/analytics';
import InfoPanel from 'js/infopanel';
import Popups from 'js/popups';
import Utils from 'js/utils';

const Search = (function() {

    // --------------------------------------------------

    // Our map and geoJson data
    let _map;
    let _geoJson;

    // Search form elements
    let $searchForm = $('#map-search-form');
    let $searchInput = $('#map-search-query');

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
        _geoJson = JSON.parse( JSON.stringify( geoJson ) ); // Copy our global object for use in search module only

        // Strip out categories that we won't be searching
        _geoJson.features = _geoJson.features.filter( ( feature ) => {
            return $.inArray( feature.properties.category , _excludedCategories ) === -1;
        } );

        // Get our search up and running
        initSearch();

        // Check for a URL hash
        hashHandler();

        // Set search input placeholder text and adapt on resize
        searchPlaceholderText();
        $( window ).resize( searchPlaceholderText );

    };

    // --------------------------------------------------

    const initSearch = function() {

        let fuse = new window.FUSE( _geoJson.features , _fuseOptions );

        initAutocomplete( fuse );

        // Select all text when you click the input (much easier than deleting existing value)
        // Also re-searches if there is content
        // TODO: move this to pattern lib
        $searchInput.on( 'focus' , searchInputFocusHandler );

        // Prevent form submit and run our own submitForm()
        $searchForm.on( 'submit' , searchFormSubmitHandler );

        // Listen out for manual changes to the URL's hash
        $( window ).on( 'hashchange' , hashHandler );

    };

    // --------------------------------------------------

    const initAutocomplete = function( fuse ) {

        const autoComplete = new window.AUTOCOMPLETE({
            input: $searchInput,
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
                    if ( feature.item.properties.zone != 'KM' && feature.item.properties.zone != undefined ) fuseResult[i].item.badge = '<div class="c-badge"><span class="c-campus-zone zone-'+ feature.item.properties.zone+'"></span><span class="c-campus-zone__label"> Zone '+ feature.item.properties.zone+'</span></div>';
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

    const searchInputFocusHandler = function() {

        let $this = $(this);
        let searchTerm = $this.val();

        if (searchTerm !== '') {

            // Select the input's content
            $this.select();

            // run the search
            $this.trigger('change');

        }
    };

    // --------------------------------------------------

    const submitForm = function() {
        let $autocompleteList = $('.c-autocomplete__list');
        let $autocompleteItems = $('.c-autocomplete__item');
        let selectedItem = $autocompleteItems.filter('.is-selected');
        let selectedLink = selectedItem.children('.c-autocomplete__link');
        let selectedTitle = selectedLink.children('.c-autocomplete__title').text();
        let selectedSubtitle = selectedLink.children('.c-autocomplete__subtitle').text();
        let selectedHash = selectedLink.attr('href').replace( '#' , '' );
        let searchQueryText = $searchInput.val();
        let selectedIndex = $autocompleteItems.index(selectedItem) + 1;
        let selectedFeature;

        let location;

        if (selectedItem.length === 0) {
            return false;
        }

        // Set the search input's value to location's title
        $searchInput.val( selectedTitle );

        // Update the URL's #{locationId}
        updateHash( selectedHash );

        // Opens either a popup or info panel
        location = Utils.locationLookUp( selectedHash );
        openSearchResult( location );

        // Clear the search result list
        $autocompleteList.empty();

        // Send query event to GA
        MapAnalytics.addAnalyticsEvent('Search', selectedTitle + ' (query: ' + searchQueryText + ')', selectedIndex);
    };

    // --------------------------------------------------

    const updateHash = function(selectedHash) {
        window.location.hash = selectedHash;
    };

    // --------------------------------------------------
    // Make a URL hash-friendly value from str

    const makeHash = function(str) {
        // Lower case
        // Replace all spaces with '-'
        // Remove all non-word or non-- chars ([^a-zA-Z0-9_-])
        // Encode as URI, just in case
        try {
            return encodeURI(str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, ''));
        } catch (e) {
            return '';
        }

    };

    // --------------------------------------------------
    // Opens either a popup or info panel

    const openSearchResult = function( location ) {

        // Open an info panel if the location is a room...
        if( location.properties.category == 'Room' ) {
            InfoPanel.openLocationInfoPanel( location );
        }
        // ... or open a popup if the location is something else
        else {
            Popups.openLocationPopup( location , { "goTo" : true } );
        }

    };

    // --------------------------------------------------
    // Handle any changes to the URL hash

    const hashHandler = function() {

        // Get current hash
        let currentHash = window.location.hash.replace( '#' , '' );

        // Abandon if no hash present
        if( !currentHash ) return false;

        // Look up the location in the geoJson data
        let location = Utils.locationLookUp( currentHash );

        // Quietly abandon if no location found
        if( !location ) {
            return false;
        }

        // Open up a popup or info panel
        openSearchResult( location );

        return true;
    };

    // --------------------------------------------------

    const searchPlaceholderText = function() {

        let placeholderText = ( $(window).width() < 1024 ) ? 'Search the map' : 'Search for buildings, departments and rooms';

        $searchInput.attr( 'placeholder' , placeholderText );

    };

    // --------------------------------------------------

    return {
        init
    };

    // --------------------------------------------------

}());

export default Search;
