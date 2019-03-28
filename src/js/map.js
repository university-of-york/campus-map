
import MapInterface from "js/mapinterface";
import Controls from "js/controls";
import Facilities from "js/facilities";
import InfoPanel from "js/infopanel";
import Popups from "js/popups";
import Utils from "js/utils";
import Search from "js/search";
import Notices from "js/notices";

"use strict";

$(function() {
    
    const config = require("../mapconfig.json");
    
    let geoJson = null;
    let map = null;
    
    // --------------------------------------------------
    // initialise the map

    function initMap() {

        // Create map object
        map = new MapInterface({
            container:"map",
            zoom: config.globalMapOptions.defaultZoom,
            maxZoom: config.globalMapOptions.maxZoom,
            minZoom: config.globalMapOptions.minZoom,
            centre: config.globalMapOptions.defaultCentre,
            style: config.globalMapOptions.style,
            accessToken: config.globalMapOptions.mapboxAccessToken,
        });

        // Set map to default bounds
        map.setBounds( config.globalMapOptions.defaultBounds );

        // Initialise our various objects
        try {

            Controls.init( map , config );
            Facilities.init( map , config );
            InfoPanel.init( map );
            Popups.init( map );
            Notices.init( config );

        } catch (e) {
            console.log(e);
        }
        
        // Load our GeoJSON data
        try {

            $.getJSON( config.geoJSONFile ).then(function( data ) {

                geoJson = data;

                // Initialise things that rely on the geoJson data
                Utils.initData( geoJson );
                Facilities.initData( geoJson );
                Search.init( map , geoJson );

            }).fail(function(err) {
                console.log( "The map data failed to load" , err );
            });

        } catch (e) {
            console.log(e);
        }

    }

    // --------------------------------------------------
    
    initMap();
});
