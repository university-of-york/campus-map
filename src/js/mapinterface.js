
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
            "container" : settings.container,
            "style" : settings.style,
            "zoom" : settings.zoom,
            "minZoom" : settings.minZoom,
            "maxZoom" : settings.maxZoom,
            "center" : settings.centre,
        });

        // Add the zoom controls to bottom right
        var nav = new mapboxgl.NavigationControl( { "showCompass": false } );
        this.map.addControl( nav , "bottom-right" );
        
        // Geolocation controls
        var geolocate = new mapboxgl.GeolocateControl( { positionOptions: { enableHighAccuracy: true }, trackUserLocation: true });
        this.map.addControl( geolocate , "bottom-right" );
        
        // Hide irrelevant custom layers for now
        this.map.on( 'style.load' , () => { 
            
            this.map.setLayoutProperty( "open-day-labels" , "visibility" , "none" );
            this.map.setLayoutProperty( "open-day-dots" , "visibility" , "none" );

        })
        
        // We'll use this to keep track of all open popups
        this.openPopups = {};

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
            popupLocationId: '',
        };
        */
        
        // Create a DOM element for the marker
        let el = document.createElement( 'div' );
        el.className = 'marker openPopup';
        el.style.backgroundImage = `url(${options.icon.url})`;
        el.style.width = `${options.icon.width}px`;
        el.style.height = `${options.icon.height}px`;
        
        el.style.display = options.hidden ? 'none' : 'block';

        // Create the marker
        let marker = new mapboxgl.Marker(el);

        // Include the location id as a data attribute (used for popups)
        if( options.popupLocationId ) {
            el.setAttribute( 'data-location-id' , options.popupLocationId );
        }

        // Set its position
        marker.setLngLat( options.position );

        // Add marker to map
        marker.addTo( this.map );

        return marker;
    }

    // --------------------------------------------------
    
    setMarkerPosition( marker , position )
    {
        marker.setLngLat( position );
    }
    
    // --------------------------------------------------

    setZoom( zoom )
    {
        this.map.setZoom( zoom );
    }

    // --------------------------------------------------

    setBounds( positions )
    {
        this.map.fitBounds( positions , { "padding" : 50 } );
    }

    // --------------------------------------------------

    openPopup( options )
    {
        /*
        options = {
            "position" : [ -1.0501 , 53.9447 ],
            "content" : "<h4>Popup Title</h4>",
            "title" : "The Hive",
            "id" : "locid643",
        };
        */

        // If id is supplied check for already open 
        if( options.id && this.openPopups[ options.id ] ) {
            return false;
        }

        // Create our new popup
        var popup = new mapboxgl.Popup( {
            "closeOnClick" : false, // Leave popups open when clicking outside it
        } );
        
        popup.setLngLat( options.position )
        popup.setHTML( options.content )
        popup.addTo( this.map );

        // If id is supplied then register as open and listen for close
        if( options.id ) {

            this.openPopups[ options.id ] = popup;

            let that = this; // Include _this_ in event handler's scope 
            
            popup.on( 'close' , function( e ) {
                delete that.openPopups[ options.id ];
            });
        }

        // All done!
        return popup;
    }
    
    // --------------------------------------------------
    // Removes all popups from the map

    closePopup( id )
    {
        console.log( id );
        
        if( this.openPopups[ id ] ) {
            
            console.log( this.openPopups[ id ] );
            
            this.openPopups[ id ].remove();
        }
    }
    
    // --------------------------------------------------
    // Removes all popups from the map

    clearPopups( options )
    {
        let that = this; // Include _this_ in .map()'s scope

        Object.keys( this.openPopups ).map( function( popupKey ) {
            that.openPopups[ popupKey ].remove();
        } );
    }
    
    // --------------------------------------------------

    goTo( options )
    {
        /*
        options = {
            "position" : [ -1.0501 , 53.9447 ],
            "zoom" : 16,
        };
        */
        
        this.map.flyTo( {
            "center" : options.position,
            "zoom" : options.zoom - 1,
        } );
    }
    
    // --------------------------------------------------
    
}

export default MapInterface;
