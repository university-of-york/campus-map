$(function() {
    // defaults
    var GeoJSONFile = "https://york.funnelback.co.uk//s/search.html?collection=york-uni-campusmap&form=geojson&query=!padrenullquery&num_ranks=5000";
    var maxZoom = 18,
        minZoom = 8,
        defaultZoom = 14;
    var heslington = {
        lat: 53.9504,
        lng: -1.0660
    };
    var west = {
        lat: 53.9447,
        lng: -1.0501,
    };
    var east = {
        lat: 53.9473,
        lng: -1.0316,
    };
    var kingsmanor = {
        lat: 53.9623,
        lng: -1.0868,
    };
    var markers = [];

    // initialise InfoWindow
    var infowindow = new google.maps.InfoWindow();

    // load the map
    function loadMap() {
        return new google.maps.Map(document.getElementById('map'), {
            zoom: defaultZoom,
            maxZoom: maxZoom,
            minZoom: minZoom,
            center: heslington,
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.LEFT_TOP
            },
            scaleControl: true,
            streetViewControl: true,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.LEFT_TOP
            },
            fullscreenControl: false,
            disableDefaultUI: true
        });
    }

    // load UoY tiles
    function loadYorkTiles() {
        return new google.maps.ImageMapType({
            getTileUrl: function(coord, zoom) {
                return "https://www.york.ac.uk/about/maps/campus/data/tiles/" +
                    zoom + "/" + coord.x + "/" + coord.y + ".png";
            },
            tileSize: new google.maps.Size(256, 256),
            isPng: true,
            zoom: defaultZoom,
            maxZoom: maxZoom,
            minZoom: minZoom,
            name: 'Map'
        });
    }


    // enable toggling of markers
    function toggleMarkers(map) {

        map.data.forEach(function(feature) {
        map.data.remove(feature);
            var category = feature.getProperty('category');
            $(".c-btn--selectable").each(function() {
                //map.data.remove(feature)
                var GeoJSONCategory = $(this).attr("id");

                document.getElementById(GeoJSONCategory).addEventListener("click", function() {
                    if ($(this).is(':checked')) {
                        if (category === GeoJSONCategory) {
                            map.data.add(feature);
                            map.data.addListener('click', function(event) {
                                var title = event.feature.getProperty("title");
                                var category = event.feature.getProperty("category");
                                var subCategory = event.feature.getProperty("subcategory");
                                var mapContainer = document.getElementById('mapContainer');
                                var infoPanel = document.getElementById('infoPanel');
                                var html = '<h4>' + title + '</h4><p>' + subCategory + '</p><p>' + category + '</p>';
                                document.getElementById('infoPanel__content').innerHTML = html;
                                infoPanel.style.display = 'block';
                                infoPanel.style.width = '20%';

                                $(".closeInfoPanel").click(function() {
                                    infoPanel.style.display = 'none';
                                    infoPanel.style.width = '0%';
                                });
                            });
                            map.data.setStyle(function(feature) {
                                return {
                                    icon: 'images/markers/' + feature.getProperty("category") + '.png'
                                };
                            });
                        }
                    } else {
                        if (category === GeoJSONCategory) {
                            map.data.remove(feature);
                        }
                    }
                });


            });
        });

    }

    function DeleteMarkers() {
        //Loop through all the markers and remove
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];
    };

    function customControls(map) {
        //custom control - reset button
        var controlDiv = $("#control-div");
        var controlUI = $("#control-ui");
        var controlText = $("#control-text");
        controlUI.click(function() {
            map.setCenter(heslington);
            map.setZoom(defaultZoom);
            DeleteMarkers();
        });
        controlDiv.index = 1;
        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv[0]);
    }

    function clickAnywherePanelClose(map) {
        // click anywhere to close an InfoWindow
        return google.maps.event.addListener(map, 'click', function() {
            if (infoPanel) {
                infoPanel.style.display = 'none';
                infoPanel.style.width = '0%';
            }
        });
    }

    function showPosition(position) {
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      return  new google.maps.LatLng(lat, lng);
    }

    function searchCampus(map) {
        var $search = $('#search-query');
        $($search).change(function() {
            for (var i = 0; i < markers.length; i++)
                markers[i].setMap(null);
            markers = [];
            //Reading the value in text boxes on HTML form
            var sourceLocation = ($($search).val());
            //Remove any spaces from between coordinates
            var parts = sourceLocation.split(",");
            var newLocation = new google.maps.LatLng(parseFloat(parts[1]), parseFloat(parts[0]));
            var title = parts[2];
            var subCategory = parts[3];
            var category = parts[4];
            var marker = new google.maps.Marker({
                position: newLocation,
                map: map,
                title: title,
                subCategory: subCategory,
                category: category
            });
            map.setZoom(16);
            map.panTo(marker.position);
            google.maps.event.addListener(marker, 'click', function(event) {
                var mapContainer = document.getElementById('mapContainer');
                var infoPanel = document.getElementById('infoPanel');
                var html = '<h4>' + title + '</h4><p>' + subCategory + '</p><p>' + category + '</p>';
                document.getElementById('infoPanel__content').innerHTML = html;
                infoPanel.style.display = 'block';
                infoPanel.style.width = '20%';

                $(".closeInfoPanel").click(function() {
                    infoPanel.style.display = 'none';
                    infoPanel.style.width = '0%';
                });
            });
            markers.push(marker);
        });
    }

    //populate search / dropdown
    $.getJSON(GeoJSONFile, function(data) {
        var $search = $('#search-query');
        var groupedData = _.groupBy(data.features, function(d) {
            return d.properties.category
        });
        $.each(groupedData, function(index, item) {
            var group = $('<optgroup label="' + index + '" />');
            $.each(item, function() {
                $("<option></option>").text(this.properties.title).val(this.geometry.coordinates + ',' + this.properties.title + ',' + this.properties.subCategory + ',' + this.properties.category).appendTo(group);
            });
            group.appendTo($search);
        });
        $($search).select2({
            placeholder: 'Search the campus'
        });
    });



    // initialise the map
    function initMap() {
        // load the map
        var map = loadMap();
        // load the tiles
        var yorkTiles = loadYorkTiles();
        map.mapTypes.set('campus', yorkTiles);
        map.setMapTypeId('campus');
        // add custom controls
        customControls(map);
        // search the campus
        searchCampus(map);
        //close infoPanel by clicking anywhere
        clickAnywherePanelClose(map);
        // load the geojson
        // map.data.loadGeoJson(GeoJSONFile);
        // setTimeout(function() {
        //     toggleMarkers(map);
        // }, 500);

        // Load GeoJSON.
			var promise = $.getJSON(GeoJSONFile); //same as map.data.loadGeoJson();
			promise.then(function(data){
				cachedGeoJson = data; //save the geojson in case we want to update its values
				map.data.addGeoJson(cachedGeoJson,{idPropertyName:"id"});
                setTimeout(function() {
                    toggleMarkers(map);
                }, 500);
			});


    } // end initialise

    //load
    google.maps.event.addDomListener(window, 'load', initMap);

});
