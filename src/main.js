
// load css files
require('./css/snazzy-info-window.css');
require('./css/map.css');

// load polysfills and shims
require('babel-polyfill');

// load main app files
require('./js/pointofinterest');
require('./js/uoy-map');

// load in Pattern Library things
requirejs(['app/autocomplete', 'fuse'], function(AUTOCOMPLETE, FUSE) {
    window.AUTOCOMPLETE = AUTOCOMPLETE;
    window.FUSE = FUSE;
});


if (process.env.NODE_ENV !== 'production') {
    console.log('Development mode activated. Start the fans, please!');
}

// kick start the app (note, this loads as part of the Google Maps API callback)
function initCampusMaps() {

    // loads up any points of interest and global notices
    UOY_MAP.init();

    require('./js/map');
    window.SnazzyInfoWindow = require('./js/snazzy-info-window');
}
window.initCampusMaps = initCampusMaps;