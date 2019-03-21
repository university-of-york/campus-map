const Geolocation = (function() {

    // Variable definitions
    const watchOptions = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000
    };
    let _map = null;
    let _marker = null;
    let _geoWatchEventId = -1;


    // Private functions
    function onSuccess(position) {

        // Create the marker if it doesn't already exist...
        if( _marker === null )
        {
            _marker = _map.addMarker( {
                position: [ position.coords.longitude , position.coords.latitude ],
                icon: {            
                    url: "img/markers/pin.svg",
                    width: 24,
                    height: 32,
                },
                popup: '<p>You are here</p>',
            } );
        }
        // ...otherwise just update its position
        else
        {
            _map.setMarkerPosition( _marker , [ position.coords.longitude , position.coords.latitude ] );
        }
    }

    function onError(err) {
        let message = "There has been a problem finding your location";
        let showError = false;

        if(err) {
            switch (err.code) {
                case 1: // 'User denied geolocation prompt'
                    message = err.message;
                    showError = false;
                    break;
                default:
                    message = "";
                    showError = false;
                    break;
            }
        }

        // clear the watch geolocation event;
        // important because we don't need to keep going if there's an error or location was denied
        if (navigator.geolocation && _geoWatchEventId > -1) {
            navigator.geolocation.clearWatch(_geoWatchEventId);
        }

        if (window.location.hostname.indexOf("localhost") >= 0) {
            // don't show errors in popup on localhost
            console.log(message);
        } else {
            //UOY_MAP.alertOverlay(message, true);
            // TODO: implement this once we have a better understanding of the error codes thrown back
        }
    }

    const init = function(map) {
        // Test for geolocation first
        if (navigator.geolocation) {
            
            // Assign map object
            _map = map;
            
            // Set up listener for position changes
            _geoWatchEventId = navigator.geolocation.watchPosition(onSuccess, onError, watchOptions);
        }
    };

    return {
        init
    };
}());
export default Geolocation;