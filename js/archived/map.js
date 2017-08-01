var myMap;

var GeoJSONFile = "data/features.json";
var heslington = {
    lat: 53.9504,
    lng: -1.0654
};
var west = {
    lat: 53.9472,
    lng: -1.0537
};
var east = {
    lat: 53.9473,
    lng: -1.0316
};
var kingsmanor = {
    lat: 53.9623,
    lng: -1.0868
};
var defaultZoom = 14;



function calculateAndDisplayRoute(directionsService, directionsDisplay) {
    var start = document.getElementById('start').value;
    var end = document.getElementById('end').value;
    if (document.getElementById('WALKING').checked) {
       var selectedMode = google.maps.TravelMode.WALKING;
     } else {
       var selectedMode = google.maps.TravelMode.BICYCLING;
     };
     $("#directionsPanel  h3").text(selectedMode);
    $(".c-btn--mode").click(function() {
        selectedMode = $(this).attr("id");
        console.log(selectedMode);
    });
    directionsService.route({
        origin: start,
        destination: end,
        travelMode: selectedMode
    }, function(response, status) {
        if (status === 'OK') {
            directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}


//custom controls

function ResetControl(controlDiv, myMap) {
    var controlReset = document.createElement('div');
    controlReset.setAttribute('class', 'controlItem');
    controlReset.title = 'Click to recenter the map';
    controlDiv.appendChild(controlReset);
    var controlText = document.createElement('div');
    controlText.innerHTML = 'Reset';
    controlReset.appendChild(controlText);

    controlReset.addEventListener('click', function() {
        myMap.setCenter(heslington);
        myMap.setZoom(defaultZoom);
    });
}


function WestControl(controlDiv, myMap) {
    var controlWest = document.createElement('div');
    controlWest.setAttribute('class', 'controlItem');
    controlWest.title = 'Click to recenter the map';
    controlDiv.appendChild(controlWest);
    var controlText = document.createElement('div');
    controlText.innerHTML = 'Campus West';
    controlWest.appendChild(controlText);
    controlWest.addEventListener('click', function() {
        myMap.setCenter(west);
        myMap.setZoom(16);
    });
}

function EastControl(controlDiv, myMap) {
    var controlEast = document.createElement('div');
    controlEast.setAttribute('class', 'controlItem');
    controlEast.title = 'Click to recenter the map';
    controlDiv.appendChild(controlEast);
    var controlText = document.createElement('div');
    controlText.innerHTML = 'Campus East';
    controlEast.appendChild(controlText);
    controlEast.addEventListener('click', function() {
        myMap.setCenter(east);
        myMap.setZoom(16);
    });
}

function KingsManorControl(controlDiv, myMap) {
    var controlKingsManor = document.createElement('div');
    controlKingsManor.setAttribute('class', 'controlItem');
    controlKingsManor.title = 'Click to recenter the map';
    controlDiv.appendChild(controlKingsManor);
    var controlText = document.createElement('div');
    controlText.innerHTML = 'Kings Manor';
    controlKingsManor.appendChild(controlText);
    controlKingsManor.addEventListener('click', function() {
        myMap.setCenter(kingsmanor);
        myMap.setZoom(18);
    });
}

// initialise map
function initMap() {

    var directionsDisplay = new google.maps.DirectionsRenderer;
    var directionsService = new google.maps.DirectionsService;
    var myMap = new google.maps.Map(document.getElementById('myMap'), {
        zoom: defaultZoom,
        center: heslington,
        mapTypeControlOptions: {
            //style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            mapTypeIds: ['campus', 'satellite'],
            position:google.maps.ControlPosition.BOTTOM_RIGHT
        }

    });




    // directions stuff

    directionsDisplay.setMap(myMap);
    directionsDisplay.setPanel(document.getElementById('directionsPanel'));
    var onChangeHandler = function() {
        calculateAndDisplayRoute(directionsService, directionsDisplay);
        var infoPanel = document.getElementById('info-panel');
        var mapDiv = document.getElementById('myMap');
        infoPanel.style.display = 'block';
        infoPanel.style.width = '25%';
        mapDiv.style.width = '75%';


    };


    //document.getElementById('start').addEventListener('change', onChangeHandler);
    document.getElementById('end').addEventListener('change', onChangeHandler);
    //document.getElementById('DRIVING').addEventListener('change', onChangeHandler);
    document.getElementById('WALKING').addEventListener('click', onChangeHandler);
    document.getElementById('BICYCLING').addEventListener('click', onChangeHandler);

    // autocomplete places - might not be suitable
    var input = document.getElementsByClassName('c-form__input--directions');
    var options = {
        componentRestrictions: {
            country: 'UK'
        }
    };

    for (i = 0; i < input.length; i++) {
        autocomplete = new google.maps.places.Autocomplete(input[i], options);
    }

    // load our tiles
    var uoyMapType = new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
            return "https://www.york.ac.uk/about/maps/campus/data/tiles/" +
                zoom + "/" + coord.x + "/" + coord.y + ".png";
        },
        tileSize: new google.maps.Size(256, 256),
        isPng: true,
        maxZoom: 18,
        minZoom: 13,
        name: 'Map'
    });
    myMap.mapTypes.set('campus', uoyMapType);
    myMap.setMapTypeId('campus');

    // Create the DIV to hold the customs controls and call the customControl()
    // constructor passing in this DIV.
    var customControlDiv = document.createElement('div');
    customControlDiv.setAttribute('class', 'control');
    customControlDiv.removeAttribute('style');
    var resetControl = new ResetControl(customControlDiv, myMap);
    var westControl = new WestControl(customControlDiv, myMap);
    var eastControl = new EastControl(customControlDiv, myMap);
    var kingsManorControl = new KingsManorControl(customControlDiv, myMap);
    customControlDiv.index = 1;
    myMap.controls[google.maps.ControlPosition.TOP_CENTER].push(customControlDiv);

    // loadGeoJson
    $(".c-btn--selectable").each(function() {
        var GeoJSONCategory = $(this).attr("id");

        function calculate(map) {
            map.data.forEach(function(feature) {
                var category = feature.getProperty('category');
                if (category === GeoJSONCategory) {
                    map.data.remove(feature);
                    document.getElementById(GeoJSONCategory).addEventListener("click", toggleLayer);

                    function toggleLayer() {
                        if ($(this).is(':checked')) {
                            map.data.add(feature);
                            // When the user clicks, open an infowindow
                            map.data.addListener('click', function(event) {
                                var title = event.feature.getProperty("name");
                                var desc = event.feature.getProperty("description");
                                infowindow.setContent('<div style="width:150px;"><h3>' + title + '</h3><p>' + desc + '</p></div>');
                                infowindow.setPosition(event.feature.getGeometry().get());
                                infowindow.setOptions({
                                    pixelOffset: new google.maps.Size(0, -30)
                                });
                                infowindow.open(map);

                            });
                        } else {
                            map.data.remove(feature);

                        }
                    };
                }
            });
            google.maps.event.addListener(map, 'click', function() {
            if(infowindow){
                   infowindow.close();
                }
            });
        }

        function loadGeoJson(map) {
            map.data.loadGeoJson(GeoJSONFile);
        }
        google.maps.event.addDomListener(window, 'load', function() {

            loadGeoJson(myMap);
            setTimeout(function() {
                calculate(myMap);
            }, 500);
        });
    });

    // add content to InfoWindow
    var infowindow = new google.maps.InfoWindow();

    function gotoFeature(featureNum) {
        var feature = map.data.getFeatureById(features[featureNum].getId());
        if (!!feature) google.maps.event.trigger(feature, 'changeto', {
            feature: feature
        });
        else alert('feature not found!');
    }

    // var icon = {
    //     url: "//www-users.york.ac.uk/~dh1120/campusmap/images/25719-200.png", // url
    //     scaledSize: new google.maps.Size(50, 50), // scaled size
    //     origin: new google.maps.Point(0, 8), // origin
    //     anchor: new google.maps.Point(0, 11) // anchor
    // };
    //
    // var myloc = new google.maps.Marker({
    //     clickable: false,
    //     icon: icon,
    //     shadow: null,
    //     zIndex: 999,
    //     map: myMap
    // });
    //
    // if (navigator.geolocation) navigator.geolocation.getCurrentPosition(function(pos) {
    //     var me = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
    //     myloc.setPosition(me);
    //     getLatLongDetail(me);
    // }, function(error) {
    //     // ...
    // });
    //
    // function getLatLongDetail(myLatlng) {
    //
    //     var geocoder = new google.maps.Geocoder();
    //     geocoder.geocode({
    //             'latLng': myLatlng
    //         },
    //         function(results, status) {
    //             if (status == google.maps.GeocoderStatus.OK) {
    //                 if (results[0]) {
    //
    //                     var address = "",
    //                         city = "",
    //                         state = "",
    //                         zip = "",
    //                         country = "",
    //                         formattedAddress = "";
    //                     var lat;
    //                     var lng;
    //
    //                     for (var i = 0; i < results[0].address_components.length; i++) {
    //                         var addr = results[0].address_components[i];
    //                         // check if this entry in address_components has a type of country
    //                         if (addr.types[0] == 'country')
    //                             country = addr.long_name;
    //                         else if (addr.types[0] == 'street_address') // address 1
    //                             address = address + addr.long_name;
    //                         else if (addr.types[0] == 'establishment')
    //                             address = address + addr.long_name;
    //                         else if (addr.types[0] == 'route') // address 2
    //                             address = address + addr.long_name;
    //                         else if (addr.types[0] == 'postal_code') // Zip
    //                             zip = addr.short_name;
    //                         else if (addr.types[0] == ['administrative_area_level_1']) // State
    //                             state = addr.long_name;
    //                         else if (addr.types[0] == ['locality']) // City
    //                             city = addr.long_name;
    //                     }
    //
    //
    //                     if (results[0].formatted_address != null) {
    //                         formattedAddress = results[0].formatted_address;
    //                     }
    //
    //                     //debugger;
    //
    //                     var location = results[0].geometry.location;
    //
    //                     lat = location.lat();
    //                     lng = location.lng();
    //
    //                     //alert('City: '+ city + '\n' + 'State: '+ state + '\n' + 'Zip: '+ zip + '\n' + 'Formatted Address: '+ formattedAddress + '\n' + 'Lat: '+ lat + '\n' + 'Lng: '+ lng);
    //                     $('#myLocation').click(function(e) {
    //                         document.getElementById('start').value = formattedAddress;
    //                         e.preventDefault();
    //                     });
    //                 }
    //
    //             }
    //
    //         });
    // }

}
