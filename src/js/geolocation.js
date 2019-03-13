import Utils from './utils';

const Geolocation = (function() {

    // Variable definitions
    const watchOptions = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };
    let _map = null;
    let _marker;
    let _geoWatchEventId = -1;


    // Private functions
    function onSuccess(position) {
        
        _map.addMarker( {
            position: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            },
            icon: {
                url: 'img/markers/pin.svg',
                size: {
                    width: 24,
                    height: 32,
                },
            },
        } );

    }

    function onError(err) {
        let message = 'There has been a problem finding your location';
        let showError = false;

        if(err) {
            switch (err.code) {
                case 1: // 'User denied geolocation prompt'
                    message = err.message;
                    showError = false;
                    break;
                default:
                    message = '';
                    showError = false;
                    break;
            }
        }

        // clear the watch geolocation event;
        // important because we don't need to keep going if there's an error or location was denied
        if (navigator.geolocation && _geoWatchEventId > -1) {
            navigator.geolocation.clearWatch(_geoWatchEventId);
        }

        if (window.location.hostname.indexOf('localhost') >= 0) {
            // don't show errors in popup on localhost
            console.log(message);
        } else {
            //UOY_MAP.alertOverlay(message, true);
            // TODO: implement this once we have a better understanding of the error codes thrown back
        }
    }

    const init = function(map, marker) {
        _map = map;
        _marker = marker;

        // Geolocation
        if (navigator.geolocation) {
            _geoWatchEventId = navigator.geolocation.watchPosition(onSuccess, onError, watchOptions);
        }
    };

    return {
        init
    };
}());
export default Geolocation;