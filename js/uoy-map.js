const uoy_map = (function(){

    const cookieName = 'global-notice-status';
    let _closeBtnHTML = '<button type="button" class="c-alert__close js-alert-close" aria-label="Close">&times;</button>';
    let _noticeHTML = '<div class="c-global-notice {0}">{x}{1}{2}</div>';
    let _noticeTitle = '<h2 class="c-global-notice__title">{0}</h2>';
    let _closeBtn = '<button type="button" class="c-alert__close js-alert-close" aria-label="Close">&times;</button>'
    let _defaultOptions = {
        placeBeforeElement: '.c-map-header',
        title: '',
        description: '',
        noticeModifierClasses: '',
        closeable: false
    };

    // map variables
    var _gmap = null;
    var _poiArr = [];

    function stringChecker(inputStr) {
        return inputStr && inputStr.length > 0;
    }
    function stringReplace(template, replaceArr) {

        for(let i = 0; i < replaceArr.length; i++) {
            placeholder = "{" + i.toString() + "}";
            template = template.replace(placeholder, replaceArr[i]);
        }

        return template;
    }

    // cookies - todo: needs abstracting
    function setCookie(cookieName, value, expires) {
        var expiresStr = '';
        if(expires) {
            var d = new Date();
            d.setTime(d.getTime() + (expires * 24 * 60 * 60 * 1000));
            expiresStr = "expires=" + d.toUTCString() + ";";
        }
        document.cookie = cookieName + "=" + value + ";" + expiresStr + "path=/";
    }
    function getCookie(cookieName) {
        var name = cookieName + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    function setMap(gMap) {
        _gmap = gMap;
    }
    function setPointsOfInterest(poiArr) {
        _poiArr = poiArr;
    }


    const addGlobalNotice = function(options) {
        // merge passed in options into defaults
        $.extend(_defaultOptions, options);

        let $placementEl = $(_defaultOptions.placeBeforeElement),
            title = stringChecker(_defaultOptions.title) ? stringReplace(_noticeTitle, [_defaultOptions.title]) : '';

        let outputHTML = stringReplace(_noticeHTML, [
            _defaultOptions.noticeModifierClasses,
            title,
            _defaultOptions.description
        ]);

        if(_defaultOptions.closeable) {

            // add in the close button to the html
            outputHTML = outputHTML.replace('{x}', _closeBtnHTML);

            // check if the element has already been closed and set by a cookie
            if(getCookie(cookieName) === 'closed' ){
                return; // prevents the global notice being written
            } else {
                $('div[class=wrapper]').on('click', '.js-alert-close', function (e) {
                    e.preventDefault();
                    $('.c-global-notice').hide();
                    // set a cookie to stash the closure status
                    setCookie(cookieName, 'closed', null);
                });
            }
        }

        $placementEl.before(outputHTML);
    };

    const plotPOIItems = function (poiArr) {

        let poiWindowContent = "<div id='{1}' class='o-poi-item--content'>{0}</div>";

        // if an array of points of interest isn't passed in, use the default _poiArr
        poiArr = poiArr ? poiArr : _poiArr;

        // plot the map points
        if(_gmap && _gmap != null) {

            // now that the Google.map object is initialised, we need to create the Popup class
            // via the constructor
            poi_builder.constructPopupClass();
            let Popup = poi_builder.getPopupClass();

            // plot the markers on the map
            for (let i = 0; i < poiArr.length; i++){
                let pointObj = poiArr[i],
                    poiID = 'poi-id' + i.toString();

                // add the poi empty 'div' element to the document (it doesn't matter where)
                $('body').append(poiWindowContent.replace('{0}', pointObj.title).replace('{1}', poiID));

                var popup = new Popup(
                    new google.maps.LatLng({lat: pointObj.lat, lng: pointObj.lon}),
                    document.getElementById(poiID)
                );
                popup.setMap(_gmap);
            }

            // hide the popup/poi items below selected zoom levels on smaller screens
            _gmap.addListener('zoom_changed', function(){
                poi_builder.hidePopupItemsOnMobileZoom(_gmap)
            });
        }
    };

    return {
        addGlobalNotice : addGlobalNotice,
        setGoogleMapObj: setMap,
        setPointsOfInterest: setPointsOfInterest,
        plotPOIItems: plotPOIItems
    }
})();
window.uoy_map = uoy_map || {};