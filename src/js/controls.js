
import MapAnalytics from 'js/analytics';
import InfoPanel from 'js/infopanel';
import Popups from 'js/popups';
import Facilities from 'js/facilities';

const Controls = (function() {

    // --------------------------------------------------

    // Our map interface & config objects
    let _map;
    let _config;

    // Campus sites and reset
    let _controlCampus = $( '#control-campus-div' );
    let _controlResetButton = $( '#control-reset-ui' );
    let _controlEastButton = $( '#control-east-ui' );
    let _controlWestButton = $( '#control-west-ui' );
    let _controlKingsManorButton = $( '#control-km-ui' );

    // Map feedback
    let _controlFeedback = $( '#control-feedback-div' );
    let _controlFeedbackButton = $( '#control-feedback-ui' );

    // --------------------------------------------------

    const init = function( map , config ) {

        // Set map interface & config objects
        _map = map;
        _config = config;

        // Un-hide our controls
        _controlCampus.removeClass( 'is-hidden' ).show();
        _controlFeedback.removeClass( 'is-hidden' ).show();

        // Reset button
        _controlResetButton.click( resetClickHandler );

        // Site buttons
        _controlEastButton.click( _config.sites.east , siteClickHandler );
        _controlWestButton.click( _config.sites.west , siteClickHandler );
        _controlKingsManorButton.click( _config.sites.kingsmanor , siteClickHandler );

        // Feedback button
        _controlFeedbackButton.click( feedbackClickHandler );
    }

    // --------------------------------------------------

    const resetClickHandler = function() {

        _map.setBounds( _config.globalMapOptions.defaultBounds );

        Popups.clearPopups();
        InfoPanel.closeInfoPanel();

        Facilities.reset();

        MapAnalytics.addAnalyticsEvent( 'Reset' , '' );
    }

    // --------------------------------------------------

    const siteClickHandler = function( options ) {

        _map.flyTo( options.data );

        MapAnalytics.addAnalyticsEvent( 'Centre on' , options.data.label );
    }

    // --------------------------------------------------

    const feedbackClickHandler = function( options ) {

        // Set feedback panel content + form
        InfoPanel.openInfoPanel( '<h3 class=\'infoPanel__feedbackTitle\'>Send us feedback about the campus map</h3><iframe src=\'https://uni_york.formstack.com/forms/campus_map_feedback\' title=\'Campus map feedback\' width=\'100%\' height=\'600px\'></iframe>' );

    }

    // --------------------------------------------------

    return {
        init
    };

    // --------------------------------------------------

}());

export default Controls;
