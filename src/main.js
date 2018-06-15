
// load css files
require('./css/snazzy-info-window.css');
require('./css/map.css');

// load main app files
require("./js/pointofinterest");
require("./js/uoy-map");

// load assets
//const imgPath = require.context('./img', true);

//require('./js/map');
//window.SnazzyInfoWindow = require('./js/snazzy-info-window');


if (process.env.NODE_ENV !== "production") {
    console.log("Development mode activated. Start the fans, please!");
}

// helper script to load JS files dynamically
function loadJS(filename, onloadCallback) {
    var fileref = document.createElement('script');
    fileref.setAttribute("type", "text/javascript");
    fileref.setAttribute("src", filename);
    if(onloadCallback && onloadCallback != '') {
        fileref.setAttribute("onload", onloadCallback);
    }

    if (typeof fileref!="undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref);
}

//require("./js/map");
// require("./js/snazzy-info-window");
const path = require("path");

// kick start the app (note, this loads as part of the Google Maps API callback)
function initCampusMaps() {

    // load our other scripts because we know the Google and Map objects are available
    //loadJS('/js/pointofinterest.js');
    //loadJS('/js/uoy-map.js', "initPostLoad()");


    // loads up any points of interest and global notices
    uoy_map.init();
    // loadJS('/js/map.js');
    // loadJS('/js/snazzy-info-window.js');
    // require.context("./src/js/map.js");
    // require.context(path.resolve(__dirname, "src") + "/js/map");
    // require.context(path.resolve(__dirname, "src") + "/js/snazzy-info-window");
    //require("./js/map");
    require("./js/map");
    window.SnazzyInfoWindow = require('./js/snazzy-info-window');
}
window.initCampusMaps = initCampusMaps;