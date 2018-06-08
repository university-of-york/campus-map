const uoy_map = (function(){
"use strict";

    var _mapConfigData = {};
    const _cookieName = 'global-notice-status';
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
    let mapAlert = $('#map-alert');
    let mapAlertContent = mapAlert.children('.c-alert__content');


    // map variables
    var _gmap = null;
    var _poiArr = [];

    function stringChecker(inputStr) {
        return inputStr && inputStr.length > 0;
    }
    function stringReplace(template, replaceArr) {

        for(let i = 0; i < replaceArr.length; i++) {
            let placeholder = "{" + i.toString() + "}";
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

    // Setters
    function setMap(gMap) {
        _gmap = gMap;
    }
    function setPointsOfInterest(poiArr) {
        _poiArr = poiArr;
    }

    // getters
    function getConfig() {
        return _mapConfigData;
    }

    // Private/internal functions
    const renderMapButtons = function() {
        let mapButtonContainer = document.getElementById('map-button-container');

        let checkboxHtml = ' <input type="checkbox" id="{0}" name="mapButton" class="c-btn--selectable" value="{1}">';
        let labelHtml = '<label for="{0}" class="c-btn  c-btn--secondary c-btn--medium c-btn--selectable__label" role="button"><i class="c-icon c-icon--above {1}"></i>{2}</label>';

        if(_mapConfigData.mapButtons) {
            var mapButtonHtml = '';

            for (var i = 0; i < _mapConfigData.mapButtons.length; i++) {
                let mapButton = _mapConfigData.mapButtons[i];

                mapButtonHtml += checkboxHtml
                    .replace('{0}', mapButton.id)
                    .replace('{1}', mapButton.value);
                mapButtonHtml += labelHtml
                    .replace('{0}', mapButton.id)
                    .replace('{1}', mapButton.iconClass)
                    .replace('{2}', mapButton.value)
            }

            // spit the buttons on the page
            mapButtonContainer.innerHTML = mapButtonHtml;
        }
    };

    // External functions
    const addGlobalNotice = function(options) {
        // check to see if we actually have an object
        if(typeof options !== 'undefined') {
            // merge passed in options into defaults
            $.extend(_defaultOptions, options);

            let $placementEl = $(_defaultOptions.placeBeforeElement),
                title = stringChecker(_defaultOptions.title) ? stringReplace(_noticeTitle, [_defaultOptions.title]) : '';

            let outputHTML = stringReplace(_noticeHTML, [
                _defaultOptions.noticeModifierClasses,
                title,
                _defaultOptions.description
            ]);

            if (_defaultOptions.closeable) {

                // add in the close button to the html
                outputHTML = outputHTML.replace('{x}', _closeBtnHTML);

                // check if the element has already been closed and set by a cookie
                if (getCookie(_cookieName) === 'closed') {
                    return; // prevents the global notice being written
                } else {
                    $('div[class=wrapper]').on('click', '.js-alert-close', function (e) {
                        e.preventDefault();
                        $('.c-global-notice').hide();
                        // set a cookie to stash the closure status
                        setCookie(_cookieName, 'closed', null);
                    });
                }
            }

            $placementEl.before(outputHTML);
        }
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

            // show/hide the popup/poi items on init
            _gmap.addListener('tilesloaded', function(){
                poi_builder.hidePopupItemsOnMobileZoom(_gmap);
            });

            // show/hide the popup/poi items below selected zoom levels on smaller screens
            _gmap.addListener('zoom_changed', function(){
                poi_builder.hidePopupItemsOnMobileZoom(_gmap)
            });
        }
    };

    const alertOverlay = function(message, fadeOut) {

        mapAlertContent.html(message);
        mapAlert.removeClass('is-hidden');
        mapAlert.fadeIn();

        if(fadeOut) {
            // gracefully hide the alert
            setTimeout(function(){
                mapAlert.fadeOut(500, function() {
                    mapAlertContent.html('');
                });

                }, 4000);
        }
    };

    const init = function(options) {
        // load the campus map configuration data
        $.getJSON( "mapconfig.json", function( data ) {
            if(data) {
                _mapConfigData = data;

                renderMapButtons();

                // add the open day global notice
                uoy_map.addGlobalNotice(_mapConfigData.globalNotice);
                uoy_map.setPointsOfInterest(_mapConfigData.pointsOfInterest);
            }
        });
    };

    return {
        addGlobalNotice : addGlobalNotice,
        setGoogleMapObj: setMap,
        setPointsOfInterest: setPointsOfInterest,
        plotPOIItems: plotPOIItems,
        alertOverlay: alertOverlay,
        init: init,
        getConfig: getConfig
    }
})();
window.uoy_map = uoy_map || {};