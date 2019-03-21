
import MapAnalytics from 'js/analytics';

const InfoPanel = (function() {

    // --------------------------------------------------
    // Variable declaration

    let _map = null;

    // --------------------------------------------------
    // Initialisation

    const init = function(map) {
        
        // Set internal map object
        _map = map;

        // Add event listener for opening a location info window
        $('.map-wrapper').on( 'click' , '[data-location-id]' , closeInfoPanel );

        // Add event listener for the close control
        $('.map-wrapper').on( 'click' , '.closeInfoPanel' , closeInfoPanel );
    };

    // --------------------------------------------------

    const closeInfoPanel = function( e ) {
        e.preventDefault();
        let $infoPanel = $('.infoPanel.is-open');
        if ($infoPanel.length > 0) {
            $infoPanel.removeClass('is-open');
        }
    };

    // --------------------------------------------------

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

    return {
        closeInfoPanel,
        openInfoPanel,
        init
    };

    // --------------------------------------------------

}());
export default InfoPanel;