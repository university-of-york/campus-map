const poi_builder = (function(){

    var Popup = null; // null object container which will be populated once constructed.
    const _classNameAnchor = "o-poi-item--anchor",
        _classNameItem = "o-poi-item",
        _classNameIsHidden = 'is-hidden';

    function constructPopupClass() {
        Popup = function (position, content) {
            this.position = position;

            let pixelOffset = document.createElement('div');
            pixelOffset.classList.add(_classNameAnchor);
            pixelOffset.appendChild(content);

            this.anchor = document.createElement('div');
            this.anchor.classList.add(_classNameItem);
            // we hide this initially to determine current device and zoom level
            this.anchor.classList.add(_classNameIsHidden);
            this.anchor.appendChild(pixelOffset);

            this.anchor.style.zIndex = "1";

            this.stopEventPropagation();
        };
        // NOTE: google.maps.OverlayView is only defined once the Maps API has
        // loaded. That is why Popup is defined inside initMap().
        Popup.prototype = Object.create(google.maps.OverlayView.prototype);
        /** Called when the popup is added to the map. */
        Popup.prototype.onAdd = function () {
            this.getPanes().mapPane.appendChild(this.anchor);
        };

        /** Called when the popup is removed from the map. */
        Popup.prototype.onRemove = function () {
            if (this.anchor.parentElement) {
                this.anchor.parentElement.removeChild(this.anchor);
            }
        };

        /** Called when the popup needs to draw itself. */
        Popup.prototype.draw = function () {
            var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);
            // Hide the popup when it is far out of view.
            var display =
                Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ?
                    'block' :
                    'none';

            if (display === 'block') {
                this.anchor.style.left = divPosition.x + 'px';
                this.anchor.style.top = divPosition.y + 'px';
            }
            if (this.anchor.style.display !== display) {
                this.anchor.style.display = display;
            }
        };
        /** Stops clicks/drags from bubbling up to the map. */
        Popup.prototype.stopEventPropagation = function() {
            let anchor = this.anchor;
            anchor.style.cursor = 'auto';

            ['click', 'dblclick', 'contextmenu', 'wheel', 'mousedown', 'touchstart',
                'pointerdown']
                .forEach(function(event) {
                    anchor.addEventListener(event, function(e) {
                        e.stopPropagation();
                    });
                });
        };
    } //end: createPopupClass

    function getPopupClass() {
        return Popup;
    }

    function togglePoiItems(visible) {
        let $poiItems = $('.' + _classNameItem);

        if(!visible) {
            $poiItems.addClass(_classNameIsHidden);
        } else {
            $poiItems.removeClass(_classNameIsHidden);
        }
    }

    function hidePopupItemsOnMobileZoom(gmap, zoomLimitSmall, zoomLimitLarge) {
        let zoomLevel = gmap.getZoom(),
            smallScreen = window.matchMedia("(max-width: 40em)").matches;

        // used for older browsers that don't support default parameters
        zoomLimitSmall = typeof zoomLimitSmall !== 'undefined' ? zoomLimitSmall : 14;
        zoomLimitLarge = typeof zoomLimitLarge !== 'undefined' ? zoomLimitLarge : 15;

        togglePoiItems(smallScreen && zoomLevel >= zoomLimitSmall || !smallScreen && zoomLevel >= zoomLimitLarge);
    }

    return {
        // methods
        constructPopupClass: constructPopupClass,
        getPopupClass: getPopupClass,
        hidePopupItemsOnMobileZoom: hidePopupItemsOnMobileZoom
    }
})();
window.poi_builder = poi_builder || {};
