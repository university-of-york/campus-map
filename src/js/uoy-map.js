const mapJson = require("../mapconfig.json");

const uoy_map = (function(){
"use strict";

    let _mapConfigData = {};
    const _cookieName = "global-notice-status";
    let _closeBtnHTML = "<button type=\"button\" class=\"c-alert__close js-alert-close\" aria-label=\"Close\">&times;</button>";
    let _noticeHTML = "<div class=\"c-global-notice {0}\">{x}{1}{2}</div>";
    let _noticeTitle = "<h2 class=\"c-global-notice__title\">{0}</h2>";
    let _defaultOptions = {
        placeBeforeElement: ".wrapper",
        title: "",
        description: "",
        noticeModifierClasses: "",
        closeable: false
    };
    let mapAlert = $("#map-alert");
    let mapAlertContent = mapAlert.children(".c-alert__content");


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
        var expiresStr = "";
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
        var ca = decodedCookie.split(";");
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === " ") {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
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
    const createMapInput = function(id, value) {

        let newInput = document.createElement("input");
        newInput.id = id;
        newInput.name = "mapButton";
        newInput.value = value;
        newInput.classList.add("c-btn--selectable");
        newInput.type = "checkbox";
        newInput.placeholder = "";

        return newInput;
    };

    const createMapLabel = function(idFor, iconClass, labelText) {

        // create the icon element
        let newIcon = document.createElement("i");
        newIcon.classList.add("c-icon");
        newIcon.classList.add("c-icon--above");
        newIcon.classList.add(iconClass);

        // create the text element
        let newText = document.createTextNode(labelText);

        // create the label element
        let newLabel = document.createElement("label");
        newLabel.htmlFor = idFor;
        newLabel.setAttribute("role", "button");
        newLabel.classList.add("c-btn");
        newLabel.classList.add("c-btn--secondary");
        newLabel.classList.add("c-btn--medium");
        newLabel.classList.add("c-btn--selectable__label");

        newLabel.appendChild(newIcon);
        newLabel.appendChild(newText);

        return newLabel;
    };

    const createGenericElement = function(elementType, id, classList, text) {

        let newElement = document.createElement(elementType);
        let newTextNode = document.createTextNode(text);

        newElement.id = id;

        if(classList && classList.length > 0) {
            classList.forEach(function(cssClass){
               newElement.classList.add(cssClass);
            });
        }
        newElement.appendChild(newTextNode);

        return newElement;
    };

    const setGlobalNoticeCookie = function() {

        let globalNoticeEl = $(".c-global-notice");

        // check if the element has already been closed and set by a cookie
        if (getCookie(_cookieName) === "closed") {
            globalNoticeEl.hide();
            return; // prevents the global notice being written
        }

        globalNoticeEl.on("click", ".js-alert-close", function (e) {
            e.preventDefault();
            globalNoticeEl.hide();
            // set a cookie to stash the closure status
            setCookie(_cookieName, "closed", null);
        });
    };

    const renderMapButtons = function() {

        if(_mapConfigData.mapButtons) {
            let mapButtonContainer = document.getElementById("map-button-container");

            _mapConfigData.mapButtons.forEach(function(btn) {

                var newInput = createMapInput(btn.id, btn.value);
                var newLabel = createMapLabel(btn.id, btn.iconClass, btn.value);

                mapButtonContainer.appendChild(newInput);
                mapButtonContainer.appendChild(newLabel);
            });
        }
    };


    // External functions
    const addGlobalNotice = function(options) {
        // check to see if we actually have an object
        if(typeof options === "undefined") {
            return;
        }

        // merge passed in options into defaults
        $.extend(_defaultOptions, options);

        let $placementEl = $(_defaultOptions.placeBeforeElement),
            title = stringChecker(_defaultOptions.title) ? stringReplace(_noticeTitle, [_defaultOptions.title]) : "",
            outputHTML = stringReplace(_noticeHTML, [
                _defaultOptions.noticeModifierClasses,
                title,
                _defaultOptions.description
            ]);

        outputHTML = outputHTML.replace("{x}", _defaultOptions.closeable ? _closeBtnHTML : "");
        $placementEl.before(outputHTML);
        setGlobalNoticeCookie();
    };

    const plotPOIItems = function (poiArr) {

        // if an array of points of interest isn't passed in, use the default _poiArr
        poiArr = poiArr ? poiArr : _poiArr;

        // plot the map points
        if((_gmap && _gmap != null) && (poi_builder)) {

            // now that the Google.map object is initialised, we need to create the Popup class
            // via the constructor
            poi_builder.constructPopupClass();
            let Popup = poi_builder.getPopupClass();

            // plot the markers on the map
            let count = 0;
            poiArr.forEach(function(pointObj){
                let poiID = "poi-id" + count,
                    poiElement = createGenericElement("div", poiID, ["o-poi-item--content"], pointObj.title);

                // add the poi empty 'div' element to the document (it doesn't matter where)
                document.body.appendChild(poiElement);

                const popup = new Popup(
                    new google.maps.LatLng({lat: pointObj.lat, lng: pointObj.lon}),
                    document.getElementById(poiID)
                );
                popup.setMap(_gmap);

                count += 1;
            });

            // show/hide the popup/poi items on init
            _gmap.addListener("tilesloaded", function(){
                poi_builder.hidePopupItemsOnMobileZoom(_gmap);
            });

            // show/hide the popup/poi items below selected zoom levels on smaller screens
            _gmap.addListener("zoom_changed", function(){
                poi_builder.hidePopupItemsOnMobileZoom(_gmap)
            });
        }
    };

    const alertOverlay = function(message, fadeOut) {

        mapAlertContent.html(message);
        mapAlert.removeClass("is-hidden");
        mapAlert.fadeIn();

        if(fadeOut) {
            // gracefully hide the alert
            setTimeout(function(){
                mapAlert.fadeOut(500, function() {
                    mapAlertContent.html("");
                });

                }, 4000);
        }
    };

    const init = function() {
        _mapConfigData = mapJson;

        renderMapButtons();

        // add the open day global notice
        uoy_map.setGlobalOptions(_mapConfigData.globalMapOptions);
        uoy_map.addGlobalNotice(_mapConfigData.globalNotice);
        uoy_map.setPointsOfInterest(_mapConfigData.pointsOfInterest);
    };

    const setGlobalOptions = function(globalOptions) {

        // Set the map title
        if(globalOptions.mapTitle) {
            let mapButtonContainer = document.getElementById("c-map-header-title");
            let mapTitleText = document.createTextNode(globalOptions.mapTitle);
            mapButtonContainer.innerText = "";
            mapButtonContainer.appendChild(mapTitleText);
        }
    };

    return {
        addGlobalNotice : addGlobalNotice,
        setGoogleMapObj: setMap,
        setPointsOfInterest: setPointsOfInterest,
        plotPOIItems: plotPOIItems,
        alertOverlay: alertOverlay,
        init: init,
        getConfig: getConfig,
        setGlobalOptions: setGlobalOptions
    }
})();
window.uoy_map = uoy_map || {};