
import MapAnalytics from 'js/analytics';
import Utils from 'js/utils';

const Popups = (function() {

    // --------------------------------------------------
    // Variable declaration

    let _map = null; 

    // --------------------------------------------------
    // Initialisation

    const init = function(map) {
        
        // Set internal map object
        _map = map;

        // Add event listener for opening a location popup link
        $( '.map-wrapper' ).on( 'click' , '.openPopup[data-location-id],.gotoPopup[data-location-id]' , popupLinkHandler );

        // Add event listener for tracking "more information" links
        $( '.map-wrapper' ).on( 'click' , '.more-information' , moreInfoLinkHandler );
    };

    // --------------------------------------------------
    // GA tracking of "more info." links

    const moreInfoLinkHandler = function( e ) {
        
        MapAnalytics.addAnalyticsEvent( 'Popup interaction' , `${ $( this ).data( 'location-title' ) } (more information)` );

    };

    // --------------------------------------------------
    // Opens a location popup from click

    const popupLinkHandler = function( e ) {

        e.preventDefault();
        
        let locationId = $( this ).data( 'location-id' );
        let location = Utils.locationLookUp( locationId );

        if( location ) {
            openLocationPopup( location , $( this ).hasClass( 'gotoPopup' ) );
        }
    };

    // --------------------------------------------------
    // Close a location popup

    const closeLocationPopup = function( location ) {

        _map.closePopup( location.properties.locationid );

    };

    // --------------------------------------------------
    // Clear all popups

    const clearPopups = function() {

        _map.clearPopups();

    };

    // --------------------------------------------------
    // Opens a popup with location details

    const openLocationPopup = function( location , goto ) {

        // Open up a popup
        _map.openPopup( {
            id: location.properties.locationid,
            title: location.properties.title,
            position: location.geometry.coordinates,
            content: popupContent( location ),
        } );
        
        // Move the map?
        if( goto ) {
            _map.goTo( {
                position: location.geometry.coordinates,
                zoom: ( location.properties.zoom || 16 ), // Default zoom level to 16 if none found?
            } );
        }

        // Send marker event to GA on open
        MapAnalytics.addAnalyticsEvent( 'Select marker' , location.properties.title );

    };

    // --------------------------------------------------
    // Generate popup content from location

    const popupContent = function( location ) {

        try {

            let content = `<h4>${ location.properties.title }</h4>`;

            if( location.properties.category == 'Room' ) {

                // If location is a room provide "approximate location only" message...
                content += "<p>Approximate location only</p><p>Please allow yourself time to locate the room</p>";
                
            } else if( location.properties.shortdesc ) {

                // ... Otherwise use the short description if present
                content += location.properties.shortdesc;

            }
            
            // Add link to open info panel 
            if( location.properties.longdesc ) {
                content += `<p><a class="openInfoPanel more-information" href="#${ location.properties.locationid }" data-location-title="${ location.properties.title }" data-location-id="${ location.properties.locationid }">More information</a></p>`
            }
            
            return content;        
            
        } catch (e) {
            console.log(e);
        }

        return "";

    };

    // --------------------------------------------------

    return {
        openLocationPopup,
        closeLocationPopup,
        clearPopups,
        init
    };

    // --------------------------------------------------

}());

export default Popups;
