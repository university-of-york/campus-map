const Geolocation = (function () {

    // Variable definitions
    const watchOptions = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };
    let _gmap = null;
    let _marker;


    // Private functions
    function onSuccess(position) {
        let marker = _marker;

        let userLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        let icon = {
            url: 'img/markers/pin.svg',
            scaledSize: new google.maps.Size(24, 32)
        };
        if (typeof(marker) !== 'undefined') {
            marker.setMap(null);
        }
        marker = new google.maps.Marker({
            map: _gmap,
            icon: icon
        });
        marker.setPosition(userLatlng);
        //disable until further investigation
        //if (typeof(map) != 'undefined') map.panTo(userLatlng);
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

        if (window.location.hostname.indexOf('localhost') >= 0) {
            // don't show errors in popup on localhost
            console.log(message);
        } else {
            //UOY_MAP.alertOverlay(message, true);
            // TODO: implement this once we have a better understanding of the error codes thrown back
        }
    }

    const init = function(map, marker) {
        _gmap = map;
        _marker = marker;

        // Geolocation
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(onSuccess, onError, watchOptions);
        }
    };

    return {
        init
    };
})();
export default Geolocation;