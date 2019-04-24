
import MapAnalytics from 'js/analytics';
import Utils from 'js/utils';

const InfoPanel = (function() {

    // --------------------------------------------------
    // Variable declaration

    let _map = null;
    
    // --------------------------------------------------
    // Initialisation

    const init = function(map) {
        
        // Set internal map object
        _map = map;

        // Add event listener for opening a location info panel
        $( '.map-wrapper' ).on( 'click' , '.openInfoPanel[data-location-id]' , infoPanelLinkHandler );

        // Add event listener for the close control
        $( '.map-wrapper' ).on( 'click' , '.closeInfoPanel' , closeInfoPanel );
        
        // Do some things with links in the info panel
        $( '.infoPanel' ).on( 'click' , 'a' , linkHandler );
    };

    // --------------------------------------------------
    // Do things when a link is clicked in an info panel

    const linkHandler = function( e ) {
        
        let $this = $( this );

        // If this is a popup location link...
        if( $this.is( '.openPopup[data-location-id],.gotoPopup[data-location-id]' ) ) {

            // Close info panel on mobile if a popup link is clicked
            if( Math.floor( $( '.infoPanel' ).outerWidth() ) === $( window ).width() ) {
                closeInfoPanel();
            }

            // Send "show location" event to GA
            MapAnalytics.addAnalyticsEvent( 'Panel interaction' , `${ e.target.getAttribute( 'data-location-title' ) } (show location)` );
        }
        // ...Otherwise, if this is a "normal" link
        else if( $this.attr( 'href' ) && $this.attr( 'href' ) !== '#' ) {
            // Send link info to GA
            MapAnalytics.addAnalyticsEvent( 'Panel interaction' , `${ $this.text() }(${ $this.attr( 'href' ) })` );
        }
        
    };

    // --------------------------------------------------
    // Opens a location info panel from click

    const infoPanelLinkHandler = function( e ) {
        
        e.preventDefault();
        
        let locationId = $( this ).data( 'location-id' );
        let location = Utils.locationLookUp( locationId );
                
        openLocationInfoPanel( location );
    };
    
    // --------------------------------------------------
    // Opens an info panel for a given location
    
    const openLocationInfoPanel = function( location ) {

        // Get the content for our location
        let content = infoPanelContent( location );
        
        // Open up the info panel if we get any content
        if( content ) {
            openInfoPanel( content );
        }
    };
    
    // --------------------------------------------------
    // Opens an info panel with arbitrary content
    
    const openInfoPanel = function( content ) {
        
        // Set the content regardless of current state
        $('.infoPanel__content').html( content );
        
        // Open if not already open
        let $infoPanel = $('.infoPanel').not('.is-open');
        if ($infoPanel.length > 0) {
            $infoPanel.addClass('is-open');
        }
    };
    
    // --------------------------------------------------
    
    const closeInfoPanel = function( e ) {
        
        // Prevent default behaviour if called by an event listener
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        
        let $infoPanel = $('.infoPanel.is-open');
        
        if ($infoPanel.length > 0) {
            $infoPanel.removeClass('is-open');
        }
    };

    // --------------------------------------------------

    const infoPanelContent = function( location ) {

        try {

            let content = `<h3>${ location.properties.title }</h3>`;
 
            content += location.properties.subtitle ? `<h4>${ location.properties.subtitle }</h4>` : '';
            content += location.properties.shortdesc ? `<p>${ location.properties.shortdesc }</p>` : '';
            content += location.properties.longdesc ? `<p>${ location.properties.longdesc }</p>` : '';

            // If location is a room but still has a lat/long then provide link to open a popup
            if( location.properties.category == 'Room' && location.geometry.coordinates[ 0 ] != 0 && location.geometry.coordinates[ 1 ] != 0 ) {

                let locationLinkText = location.properties.subtitle ? location.properties.subtitle.replace(/\b(, Campus West|, Campus East|, King's Manor)\b/gi, '') : 'Show on map';

                content += `<p><a class="gotoPopup" href="#" data-location-title="${ locationLinkText }" data-location-id="${ location.properties.locationid }"><i class="c-icon c-icon--map-marker" aria-hidden="true"></i>&nbsp;${ locationLinkText }</a></p>`;

            }
 
            return content;

        } catch (e) {
            console.log(e);
        }

        return "";

    };

    // --------------------------------------------------

    return {
        closeInfoPanel,
        openLocationInfoPanel,
        openInfoPanel,
        init
    };

    // --------------------------------------------------

}());

export default InfoPanel;
