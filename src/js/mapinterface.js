
class MapInterface{
    
    // --------------------------------------------------

    constructor( settings ){
        /*
        settings = {
            accessToken: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            container: 'map',
            zoom: 14,
            minZoom: 10,
            maxZoom: 18,
            centre: [ -1.041749 , 53.947121 ],
            style: 'mapbox://styles/mapbox/basic-v9',
        };
        */

        mapboxgl.accessToken = settings.accessToken;

        // Create a new Mapbox-GL map object
        this.map = new mapboxgl.Map({
            container: settings.container,
            style: settings.style,
            zoom: settings.zoom,
            minZoom: settings.minZoom,
            maxZoom: settings.maxZoom,
            center: settings.centre,
        });

        // Add the zoom controls to bottom right
        var nav = new mapboxgl.NavigationControl( { showCompass: false } );
        this.map.addControl( nav , 'bottom-right' );
    }
    
    // --------------------------------------------------
    // Add a simple marker with icon to the map

    addMarker( options  )
    {
        /*
        options = {
            position: [ -1.041749 , 53.947121 ],
            hidden: false,
            icon: {            
                url: 'img/markers/pin.svg',
                width: '24',
                height: '32',
            },
            popup: '<p>Lorem ipsum dolor sit amet</p>',
            locationId: 643,
        };
        */
        
        // Create a DOM element for the marker
        let el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = `url(${options.icon.url})`;
        el.style.width = `${options.icon.width}px`;
        el.style.height = `${options.icon.height}px`;
        
        el.style.display = options.hidden ? 'none' : 'block';

        // Create the marker
        let marker = new mapboxgl.Marker(el);

        // Set its position
        marker.setLngLat(options.position);

        // TODO: Attach an info panel?
        let infoPanelLink = '';
        
        if( options.locationId ) {
            infoPanelLink = `<p><a href="#" data-location-id="${options.locationId}">More information</a></p>`;
        }
        
        // Attach a popup?
        if( options.popup ) {

            var popup = new mapboxgl.Popup( { offset: 10 } );
            popup.setHTML( options.popup + infoPanelLink );
            marker.setPopup( popup );

        }

        // Add marker to map
        marker.addTo( this.map );

        return marker;
    }

    // --------------------------------------------------
    
    setMarkerPosition( marker , position )
    {
        marker.setLngLat(position);
    }
    
    // --------------------------------------------------

    setZoom( zoom )
    {
        this.map.setZoom(zoom);
    }

    // --------------------------------------------------

    setBounds( positions )
    {
        this.map.fitBounds(positions);
    }

    // --------------------------------------------------

    goTo( options )
    {
        /*
        options = {
            "position" : [ -1.0501 , 53.9447 ],
            "zoom" : 16          
        }
        */
        
        this.map.flyTo( {
            "center" : options.position,
            "zoom" : options.zoom,
        } );
    }
    
    // --------------------------------------------------
    
}

export default MapInterface;