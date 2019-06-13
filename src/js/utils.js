
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
    // Performs any additional transformations to our geoJson

    const prepareGeoJson = function( geoJson , overrides ) {

        // Apply field overrides
        if( overrides != undefined ) {

            // Get keys for traversing overrides
            var keys = Object.keys( overrides );

            // Apply each override in turn
            for( var k = 0 ; k < keys.length ; k++ ){

                var keyTo = keys[ k ];
                var keyFrom = overrides[ keyTo ];

                // Apply to each feature in our dataset
                for( var i = 0 ; i < geoJson.features.length ; i++ ){

                    // Only override if source exists and is not empty
                    if( geoJson.features[ i ].properties[ keyFrom ] != undefined && geoJson.features[ i ].properties[ keyFrom ] != '' ) {
                        geoJson.features[ i ].properties[ keyTo ] = geoJson.features[ i ].properties[ keyFrom ];
                    }
                }
            }
        }

        return geoJson;

    };

    // --------------------------------------------------

    return {
        prepareGeoJson,
        locationLookUp,
        initData
    };

    // --------------------------------------------------

}());

export default Utils;
