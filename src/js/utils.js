
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

        // Search for a location ID first
        let match = _geoJson.features.find( ( feature ) => {

            if( !feature.properties.locationid ) return false;

            return feature.properties.locationid.toLowerCase() == locationId.toLowerCase();
        } );

        // Return now if a match is found
        if( match ) return match;

        // Fall back to search on legacy location hashes
        match = _geoJson.features.find( ( feature ) => {

            if( !feature.properties.title ) return false;

            // Make a hash from the title
            let hash = encodeURI( feature.properties.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '') );

            return hash == locationId.toLowerCase();
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
