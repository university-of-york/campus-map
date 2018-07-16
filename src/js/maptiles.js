class CoordMapType {
    constructor(tileSize) {
        this.tileSize = tileSize;
        this.tilePath = 'https://www.york.ac.uk/static/maptiles/';
        // What tiles do we have available?
        // e.g. zoom 13, x from 4069-4073, y from 2630-2633
        this.limits = {
            13: {xMin: 4069, xMax: 4073, yMin: 2630, yMax: 2633},
            14: {xMin: 8139, xMax: 8146, yMin: 5260, yMax: 5266},
            15: {xMin: 16279, xMax: 16292, yMin: 10520, yMax: 10533},
            16: {xMin: 32558, xMax: 32585, yMin: 21040, yMax: 21067},
            17: {xMin: 65116, xMax: 65170, yMin: 42080, yMax: 42135},
            18: {xMin: 130233, xMax: 130341, yMin: 84161, yMax: 84271}
        };
    }

    getTile(coord, zoom, ownerDocument) {
        let span = ownerDocument.createElement('span');
        let tile;

        //if (1 == 1) return ownerDocument.createElement('span');
        // Find out if it's outside our limits
        if(!this.limits[zoom] ||
            coord.x > this.limits[zoom].xMax ||
            coord.x < this.limits[zoom].xMin ||
            coord.y > this.limits[zoom].yMax ||
            coord.y < this.limits[zoom].yMin) {
            return span;
        }

        tile = ownerDocument.createElement('img');
        tile.src = this.tilePath + zoom + '/' + coord.x + '/' + coord.y + '.png';
        return tile;
    }
}


const MapTiles = (function() {

    // Variable Declaration
    let _gmap = null;

    // Private Functions


    // Setters
    const setMap = function(map) {
        _gmap = map;
    };

    // Public Functions
    const init = function() {
        _gmap.overlayMapTypes.insertAt(0, new CoordMapType(new google.maps.Size(256, 256)));
    };

    return {
        setMap,
        init
    };
}());
export default MapTiles;