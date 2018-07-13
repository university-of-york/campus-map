import MapMarkers from 'js/mapmarkers';
import Utils from 'js/utils';
import MapAnalytics from 'js/analytics';
import InfoWindows from 'js/infowindows';

const CustomControls = (function () {

    let _controlCampusDiv = $('#control-campus-div');
    let _controlResetUI = $('#control-reset-ui');
    let _controlEastUI = $('#control-east-ui');
    let _controlWestUI = $('#control-west-ui');
    let _controlKingsManorUI = $('#control-km-ui');
    let _controlFeedbackDiv = $('#control-feedback-div');
    let _controlFeedbackUI = $('#control-feedback-ui');
    let _gmap = null;
    let _west = {
        lat: 53.9447,
        lng: -1.0501
    };
    let _east = {
        lat: 53.9473,
        lng: -1.0316
    };
    let _kingsmanor = {
        lat: 53.9623,
        lng: -1.0868
    };

    // Private functions
    function removeWindowHash() {
        // remove hash from url
        let loc = window.location.href,
            index = loc.indexOf('#');

        if (index > 0) {
            window.location = loc.substring(0, index);
        }
    }

    function resetUI() {
        setBounds();
        MapMarkers.deleteMarkers();
        deleteIcons();
        Utils.toggleDrawer('close');
        removeWindowHash();
        // Send centre on event to GA
        MapAnalytics.addAnalyticsEvent('Reset', '');
    }

    function centerOnLocation(setCenter, zoom = 16, analyticsEventStr) {
        _gmap.setCenter(setCenter);
        _gmap.setZoom(zoom);
        // Send centre on event to GA
        MapAnalytics.addAnalyticsEvent('Centre on', analyticsEventStr);
    }

    function deleteIcons() {
        // uncheck feature buttons
        $('.c-btn--selectable').prop('checked', false);
        //remove svg feature markers
        _gmap.data.forEach(function (feature) {
            _gmap.data.remove(feature);
        });
    }

    // Setters
    function setMap(gMap) {
        _gmap = gMap;
    }

    // Public functions

    // zoom to CE & CW (mobile), CE, CW and KM (desktop)
    const setBounds = function () {
        let bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(53.943157, -1.058537),
            new google.maps.LatLng(53.950877, -1.024085)
        );
        _gmap.fitBounds(bounds);
    };

    const customCampusControl = function () {

        //custom control - campus buttons
        _controlResetUI.click(resetUI);
        _controlEastUI.click(centerOnLocation(_east, 16, 'Campus East'));
        _controlWestUI.click(centerOnLocation(_west, 16, 'Campus West'));
        _controlKingsManorUI.click(centerOnLocation(_kingsmanor, 18, 'King\'s Manor'));

        _controlCampusDiv.index = 1;
        _gmap.controls[google.maps.ControlPosition.TOP_RIGHT].push(_controlCampusDiv[0]);
    };

    const customFeedbackControl = function() {

        //custom control - feedback button
        _controlFeedbackUI.click(function () {
            $('.infoPanel__content').html('<h3 class=\'infoPanel__feedbackTitle\'>Send us feedback about the campus map</h3><iframe src=\'https://uni_york.formstack.com/forms/campus_map_feedback\' title=\'Campus map feedback\' width=\'100%\' height=\'600px\'></iframe>');
            InfoWindows.openInfoPanel();

            $('.closeInfoPanel').click(InfoWindows.closeInfoPanel);
        });
        _controlFeedbackDiv.index = 1;
        _gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(_controlFeedbackDiv[0]);
    };



    return {
        customCampusControl: customCampusControl,
        customFeedbackControl: customFeedbackControl,
        setMap: setMap,
        setBounds: setBounds
    };
})();
export default CustomControls;