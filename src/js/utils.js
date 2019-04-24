
const Utils = (function() {

    // --------------------------------------------------

    let _geoJson = null;

    // --------------------------------------------------

    const initData = function( geoJson ) {
        _geoJson = geoJson;
    };

    // --------------------------------------------------
    // Look up an item in our geoJson using a location ID
    
    const locationLookUp = function( locationId ) {

        let match = _geoJson.features.find( ( feature ) => {
            
            if( !feature.properties.locationid ) return false;
                        
            return feature.properties.locationid.toLowerCase() == locationId.toLowerCase();
        } );
        
        return match;
    };
    
    // --------------------------------------------------

    return {
        locationLookUp,
        initData
    };

    // --------------------------------------------------

}());

export default Utils;
