
// load css files
require('./css/map.css');

// load polysfills and shims
require('@babel/polyfill');

// load in Pattern Library things
requirejs(['app/autocomplete', 'fuse'], function(AUTOCOMPLETE, FUSE) {
    window.AUTOCOMPLETE = AUTOCOMPLETE;
    window.FUSE = FUSE;
});

if (process.env.NODE_ENV !== 'production') {
    console.log('Development mode activated. Start the fans, please!');
}

// kick start the app
function initCampusMaps() {

    require('./js/map');

}
window.initCampusMaps = initCampusMaps;