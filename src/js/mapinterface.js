
class MapInterface{
    
    // --------------------------------------------------

    constructor( map ){

        // Google Maps object
        this._gmap = map;

    }
    
    // --------------------------------------------------

    addMarker( settings  )
    {
        /*
        {
            position: {
                lat: [latitude],
                lng: [longitude],
            },
            icon: {
                url: 'img/markers/pin.svg',
                size: {
                    width: 24,
                    height: 32,
                },
            },
        }
        */
        
        let position = new google.maps.LatLng( settings.position.lat , settings.position.lng );

        let icon = {
            url: settings.icon.url,
            scaledSize: new google.maps.Size( settings.icon.size.width , settings.icon.size.height ),
        };

        // if (Utils.isObjectReady(_marker)) {
        //     _marker.setMap(null);
        // }

        var _marker = new google.maps.Marker({
            map: this._gmap,
            icon: icon
        });

        _marker.setPosition(position);
        
        return _marker;
    }

    // --------------------------------------------------
    
}

export default MapInterface;