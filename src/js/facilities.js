
import Utils from 'js/utils';
import MapAnalytics from 'js/analytics';
import Popups from 'js/popups';

const Facilities = (function() {

    // --------------------------------------------------

    // Our map interface & config objects
    let _map;
    let _config;

    // List of our facility groups
    let _facilities;

    // Groups of markers
    let _markerGroups = {};

    const $panel = $( '.panel' );
    const $icon = $( '.c-icon' , '#drawerStatusButton' );

    // --------------------------------------------------

    const init = function( map , config ) {

        // Set map interface & config objects
        _map = map;
        _config = config;

        // Get our facility groups
        _facilities = config.facilities;

        // Build the controls
        renderFacilityControls();

        // Set up event listener for drawer toggle
        $( '#drawerStatusButton' ).on( 'click' , toggleDrawer )

    };

    // --------------------------------------------------

    const renderFacilityControls = function() {

        if( _facilities ) {
            let mapButtonContainer = document.getElementById('map-button-container');

            _facilities.forEach(function(btn) {

                let newInput = createMapInput(btn.id, btn.value);
                let newLabel = createMapLabel(btn.id, btn.iconClass, btn.value);

                mapButtonContainer.appendChild(newInput);
                mapButtonContainer.appendChild(newLabel);
            });
        }

        // Set up event listener for facility toggles
        $( '#map-button-container' ).on( 'click' , '[data-selectable-id]' , facilityToggleClickHandler )
    };

    // --------------------------------------------------

    const initData = function( geoJson ) {

        let groups = {};

        // Retrieve a list of facility groups each containing the corresponding features
        _facilities.map( ( group ) => {
            groups[ group.id ] = geoJson.features.filter( ( feature ) => {
                return feature.properties.category.toLowerCase().replace(/\s+/g, '-') == group.id;
            } );
        } );

        // Create a new marker for each facility and add it to the marker groups
        Object.keys( groups ).map( ( groupId ) => {
            groups[ groupId ].map( ( feature ) => {

                // Create the actual marker
                let marker = _map.addMarker( {
                    position: feature.geometry.coordinates,
                    hidden: true,
                    icon: {
                        url: `img/markers/${groupId}.svg`,
                        width: 22,
                        height: 22,
                    },
                    popupLocationId: feature.properties.locationid,
                } );

                // Add hover popup management
                let $marker = $( marker.getElement() );

                $marker.on( 'mouseenter' , function() {
                    Popups.openLocationPopup( feature );
                } );

                // Create an empty array for the group if none exists already
                if( _markerGroups[ groupId ] === undefined ) _markerGroups[ groupId ] = [];

                // Add our new marker to the marker groups
                _markerGroups[ groupId ].push( marker );

            } );
        } );

        // Check query string for any group that should be visible by default
        let defaultGroupId = getQuerystringValue( 'facility' );

        // Check for facility redirects
        defaultGroupId = resolveFacilityRedirects( defaultGroupId );

        // If present and valid, show it
        if( defaultGroupId && _markerGroups[ defaultGroupId ] !== undefined ) {
            toggleFacilityGroup( defaultGroupId , true );
        }

    };

    // --------------------------------------------------
    // Open/Close the drawer
    // Can call with argument 'open' or 'close'

    const toggleDrawer = function(e) {

        // Prevent default action if called by an event listener
        if( e.preventDefault !== undefined ) e.preventDefault();

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

    // --------------------------------------------------

    const facilityToggleClickHandler = function( e ) {

        e.preventDefault();

        // Get the group ID for the clicked toggle
        let groupId = $(this).data( 'selectable-id' );

        toggleFacilityGroup( groupId );
    };

    // --------------------------------------------------

    const resolveFacilityRedirects = function( groupId ) {

        let match = Object.keys( _config.facilityRedirects ).find( function( key ) {
            return key == groupId;
        });

        return match ? _config.facilityRedirects[ match ] : groupId;

    };

    // --------------------------------------------------

    const toggleFacilityGroup = function( groupId , visibility ) {

        // Get current state if visibility isn't set
        if( visibility === undefined )
        {
            visibility = !( $( `#${groupId}` ).prop( "checked" ) );
        }

        // Toggle relevant markers
        _markerGroups[ groupId ].forEach( ( marker ) => {
            $( marker.getElement() ).toggle( visibility );
        } );

        // Toggle checkbox state
        $( `#${groupId}` ).prop( "checked" , visibility );

        // Send facilities event to GA
        MapAnalytics.addAnalyticsEvent( visibility ? "Show facilities" : "Hide facilities" , groupId );
    };

    // --------------------------------------------------

    const createMapInput = function(id, value) {

        let newInput = document.createElement('input');
        newInput.id = id;
        newInput.name = 'mapButton';
        newInput.value = value;
        newInput.classList.add('c-btn--selectable');
        newInput.type = 'checkbox';
        newInput.placeholder = '';

        return newInput;
    };

    // --------------------------------------------------

    const createMapLabel = function(idFor, iconClass, labelText) {

        // create the icon element
        let newIcon = document.createElement('i');
        newIcon.classList.add('c-icon');
        newIcon.classList.add('c-icon--above');
        newIcon.classList.add(iconClass);

        // create the text element
        let newText = document.createTextNode(labelText);

        // create the anchor link to the facility
        let newAnchor = document.createElement('a');
        newAnchor.setAttribute('href', '?facility=' + idFor);
        newAnchor.setAttribute('data-selectable-id', idFor);
        newAnchor.classList.add('c-anchor--facility');

        // create the label element
        let newLabel = document.createElement('label');
        newLabel.htmlFor = idFor;
        newLabel.setAttribute('role', 'button');
        newLabel.classList.add('c-btn');
        newLabel.classList.add('c-btn--secondary');
        newLabel.classList.add('c-btn--medium');
        newLabel.classList.add('c-btn--selectable__label');

        newLabel.appendChild(newIcon);
        newLabel.appendChild(newText);

        newLabel.appendChild(newAnchor);

        return newLabel;
    };

    // --------------------------------------------------
    // Reset's all facilities to hidden

    const reset = function() {

        _facilities.map( function( facility ) {

            toggleFacilityGroup( facility.id , false );

        } );

    };

    // --------------------------------------------------

    const getQuerystringValue = function( key ) {

        if(typeof URLSearchParams === 'function') {

            // Fancy new method
            let _urlParams = new URLSearchParams(window.location.search);

            return _urlParams.has(key) ? _urlParams.get(key) : false;

        } else {

            // Use the fallback instead
            let regex,
                results;

            key = key.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            regex = new RegExp('[\\?&]' + key + '=([^&#]*)');
            results = regex.exec(location.search);

            return results === null ? false : decodeURIComponent(results[1].replace(/\+/g, ' '));

        }
    };

    // --------------------------------------------------

    return {
        reset,
        initData,
        init
    };

    // --------------------------------------------------

}());

export default Facilities;
