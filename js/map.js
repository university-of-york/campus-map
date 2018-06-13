require.config({
  paths: {
    'SnazzyInfoWindow': 'snazzy-info-window'
  }
});
require(["app/autocomplete", "fuse", "SnazzyInfoWindow"], function(AUTOCOMPLETE, FUSE, SnazzyInfoWindow) {

    $(function () {

        // defaults
        var GeoJSONFile = uoy_map.getConfig().geoJSONFile; // loads the geoJson file from the mapconfig.json file
        var cachedGeoJson = {};
        var map;
        var maxZoom = 18,
            minZoom = 8,
            defaultZoom = 14;
        var heslington = {
            lat: 53.9504,
            lng: -1.0660
        };
        var west = {
            lat: 53.9447,
            lng: -1.0501
        };
        var east = {
            lat: 53.9473,
            lng: -1.0316
        };
        var kingsmanor = {
            lat: 53.9623,
            lng: -1.0868
        };
        // Google maps style that roughly matches our tiles
        var mapStyle = [{
            "featureType": "landscape.man_made",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "color": "#eeeeee"
                }
            ]
        },
            {
                "featureType": "landscape.natural",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#E7ECB1"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#7599a2"
                    }
                ]
            },
            {
                "featureType": "poi",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            }];
        var markers = [];
        var $window = $(window);
        var $panel = $('.panel');
        var $icon = $('.c-icon', '#drawerStatusButton');
        var $selectables = $(".c-btn--selectable");

        // Placeholder for the name of the tracker that Tag Manager loads
        var gaTracker = false;

        // Add an event to Google Analytics
        var addAnalyticsEvent = function (action, label, value) {
            // Analytics hasn't loaded yet
            if (typeof ga === 'undefined') return false;
            if (gaTracker === false) {
                // Get the name of the tracker that Tag Manager loads
                ga(function () {
                    var trackers = ga.getAll();
                    gaTracker = trackers[0].get('name');
                });
            }
            ga(gaTracker + '.send', 'event', 'Map', action, label, value);

        };


        // load the map
        function loadMap() {
            return new google.maps.Map(document.getElementById('map'), {
                zoom: defaultZoom,
                maxZoom: maxZoom,
                minZoom: minZoom,
                center: heslington,
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_BOTTOM
                },
                scaleControl: true,
                streetViewControl: true,
                streetViewControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_BOTTOM
                },
                fullscreenControl: false,
                disableDefaultUI: true,
                gestureHandling: "greedy",
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                styles: mapStyle
            });
        }

        // add groups of markers based on selectable categories
        function addMarkers() {
            // Make arrays of markers for each category
            var markerGroups = {};
            var markerFeatures = {};

            function showMarkers($s) {
                var selectableCategory = $s.attr("id");
                var thisGroup = {};

                Object.entries(markerGroups).forEach(function(keyValuePair){
                    if(keyValuePair[0] === selectableCategory) {
                        thisGroup = keyValuePair[1];
                    }
                });

                // add the geoJson to the markerFeatures object
                markerFeatures[selectableCategory] = map.data.addGeoJson(thisGroup);

                map.data.addListener('click', popupAction);
                map.data.addListener('mouseover', popupAction);
                map.data.setStyle(function (feature) {
                    var featureCategory = feature.getProperty('category').toLowerCase().replace(/\s+/g, '-');
                    var icon = {
                        url: 'img/markers/' + featureCategory + '.svg',
                        anchor: new google.maps.Point(10, 10),
                        scaledSize: new google.maps.Size(22, 22)
                    };
                    return {
                        icon: icon,
                        optimized: false,
                        zIndex: 999
                    };
                });
                // Send facilities event to GA
                addAnalyticsEvent('Show facilities', selectableCategory);
            }

            $selectables.each(function () {
                var $selectable = $(this);
                var selectableCategory = $selectable.attr("id");
                // 'Clone' new GeoJSON file for each category
                markerGroups[selectableCategory] = JSON.parse(JSON.stringify(cachedGeoJson));
                markerGroups[selectableCategory].features = $.grep(cachedGeoJson.features, function (feature) {
                    var featureCategory = feature.properties.category.toLowerCase().replace(/\s+/g, '-');
                    return featureCategory === selectableCategory;
                });
            });

            $selectables.click(function () {
                var $selectable = $(this),
                    selectableCategory = $selectable.attr("id");

                if ($selectable.is(':checked')) {
                    showMarkers($selectable);
                } else {
                    $.each(markerFeatures[selectableCategory], function (i, feature) {
                        map.data.remove(feature);
                    });
                    // Send facilities event to GA
                    addAnalyticsEvent('Hide facilities', selectableCategory);
                }
            });

            // If there are any selectables selected on load, show the icons on the map
            // This happens when navigating away, then back
            $selectables.each(function (i, v) {
                var $v = $(v);
                if ($v.prop("checked") === true) {
                    showMarkers($v);
                }
            });
        }

        function deleteMarkers() {
            //Loop through all the markers and remove
            //console.log(markers);
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
                // Remove snazzy window
                if (markers[i].snazzy) {
                    markers[i].snazzy.destroy();
                }
            }
            markers = [];
        }

        function deleteIcons() {
            // uncheck feature buttons
            $('.c-btn--selectable').prop('checked', false);
            //remove svg feature markers
            map.data.forEach(function (feature) {
                map.data.remove(feature);
            });
        }

        // zoom to CE & CW (mobile), CE, CW and KM (desktop)
        function setBounds() {
            var bounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(53.943157, -1.058537),
                new google.maps.LatLng(53.950877, -1.024085)
            );
            map.fitBounds(bounds);
        }

        function customCampusControl(map) {
            var controlCampusDiv = $("#control-campus-div");
            //custom control - reset button
            var controlResetUI = $("#control-reset-ui");
            controlResetUI.click(function () {
                setBounds();
                deleteMarkers();
                deleteIcons();
                toggleDrawer('close');
                // remove hash from url
                //	window.location.hash = '';
                var loc = window.location.href,
                    index = loc.indexOf('#');
                if (index > 0) {
                    window.location = loc.substring(0, index);
                }
                // Send centre on event to GA
                addAnalyticsEvent('Reset', '');
            });
            //custom control - campus buttons
            var controlEastUI = $("#control-east-ui");
            controlEastUI.click(function () {
                map.setCenter(east);
                map.setZoom(16);
                // Send centre on event to GA
                addAnalyticsEvent('Centre on', 'Campus East');
            });
            var controlWestUI = $("#control-west-ui");
            controlWestUI.click(function () {
                map.setCenter(west);
                map.setZoom(16);
                // Send centre on event to GA
                addAnalyticsEvent('Centre on', 'Campus West');
            });
            var controlKingsManorUI = $("#control-km-ui");
            controlKingsManorUI.click(function () {
                map.setCenter(kingsmanor);
                map.setZoom(18);
                // Send centre on event to GA
                addAnalyticsEvent('Centre on', 'King\'s Manor');
            });
            controlCampusDiv.index = 1;
            map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlCampusDiv[0]);
        }

        function customFeedbackControl(map) {
            //custom control - feedback button
            var controlFeedbackDiv = $("#control-feedback-div");
            var controlFeedbackUI = $("#control-feedback-ui");

            controlFeedbackUI.click(function () {
                $('.infoPanel__content').html('<h3 class="infoPanel__feedbackTitle">Send us feedback about the campus map</h3><iframe src="https://uni_york.formstack.com/forms/campus_map_feedback" title="Campus map feedback" width="100%" height="600px"></iframe>');
                openInfoPanel();
                $(".closeInfoPanel").click(closeInfoPanel);
            });
            controlFeedbackDiv.index = 1;
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlFeedbackDiv[0]);
        }

        function closeInfoPanel() {
            var $infoPanel = $('.infoPanel.is-open');
            if ($infoPanel.length > 0) {
                $infoPanel.removeClass('is-open');
            }
        }

        function openInfoPanel() {
            var $infoPanel = $('.infoPanel').not('.is-open');
            if ($infoPanel.length > 0) {
                $infoPanel.addClass('is-open');
            }
        }

        function snazzyOptions(opts) {
            return {
                marker: opts.marker,
                panOnOpen: false,
                content: opts.content,
                placement: 'top',
                showCloseButton: true,
                closeOnMapClick: false,
                padding: '24px 18px',
                backgroundColor: 'rgba(15, 61, 76, 0.9)',
                border: false,
                borderRadius: '0.4rem',
                shadow: false,
                fontColor: '#fff',
                maxWidth: 320,
                closeWhenOthersOpen: true,
                offset: {
                    top: '-8px',
                    left: '2px'
                },
                callbacks: {
                    afterOpen: function () {
                        $(".si-content-more-link").click(function () {
                            var $infoPanelContent = $('.infoPanel__content');
                            var html = '<h3>' + opts.title + '</h3>';
                            if (opts.subtitle) html += '<h4>' + opts.subtitle + '</h4>';
                            if (opts.shortdesc) html += '<p>' + opts.shortdesc + '</p>';
                            if (opts.longdesc) html += '<p>' + opts.longdesc + '</p>';
                            $infoPanelContent.html(html);
                            openInfoPanel();
                            toggleDrawer('close');
                            $(".closeInfoPanel").click(closeInfoPanel);
                            // Send popup interaction event to GA
                            addAnalyticsEvent('Popup interaction', opts.title + ' (more information)');
                            $infoPanelContent.find('a').not('.locationMarker').click(function () {
                                var $this = $(this);
                                // Send panel interaction event to GA
                                addAnalyticsEvent('Panel interaction', $this.text() + '(' + $this.attr('href') + ')');
                            });
                        });
                    },
                    afterClose: function () {
                        //affects hover popup
                        //closeInfoPanel();
                    }
                }
            };
        }

        function createInfoWindow(location) {
            // Everything must have a title!
            if (!location.title) return false;
            var title = location.title;
            var subTitle = location.subtitle || false;
            var subCategory = location.subcategory || false;
            var category = location.category || false;
            var shortdesc = location.shortdesc || false;
            var longdesc = location.longdesc || false;
            var zoom = location.zoom || 16;
            var content;
            if (category === "Room") {
                content = '<h4>' + title + '</h4>';
                content += '<p>Approximate location only</p>';
                content += '<p>Please allow yourself time to locate the room</p>';
            } else {
                content = location.content;
            }
            deleteMarkers();
            var marker = new google.maps.Marker({
                position: location.latlng,
                map: map,
                title: title,
                subtitle: subTitle,
                subCategory: subCategory,
                category: category,
                zoom: zoom
            });
            var thisOptions = snazzyOptions({
                title: title,
                subtitle: subTitle,
                subCategory: subCategory,
                category: category,
                marker: marker,
                shortdesc: shortdesc,
                longdesc: longdesc,
                content: content
            });
            var snazzy = new SnazzyInfoWindow(thisOptions);
            snazzy.open(map, marker);
            // Add the snazzy window to the marker (so can be removed)
            marker.snazzy = snazzy;
            markers.push(marker);

            // hide the red marker
            marker.setVisible(false);

            return marker;
        }

        function createInfoPanel(location) {
            var $infoPanel = $('.infoPanel');
            var html = '<h3>' + location.title + '</h3>';
            if (location.subtitle !== false) html += '<h4>' + location.subtitle + '</h4>';
            if (location.shortdesc !== false) html += '<p>' + location.shortdesc + '</p>';
            if (location.longdesc !== false) html += '<p>' + location.longdesc + '</p>';
            if (location.latlng !== '0,0') html += '<p><a class="locationMarker"><i class="c-icon c-icon--map-marker" aria-hidden="true"></i></a>&nbsp;<a class="locationMarker">' + location.subtitle.split(',')[0] + '</a></p>';
            $('.infoPanel__content').html(html);
            openInfoPanel();
            $(".closeInfoPanel").click(closeInfoPanel);
            $(".locationMarker").click(function () {
                createInfoWindow(location);
                //Close infoPanel on mobile
                if ($infoPanel.outerWidth() === $window.width()) {
                    closeInfoPanel();
                }
                // Pan to location
                map.setZoom(location.zoom);
                map.panTo(location.latlng);

                // Send panel interaction event to GA
                addAnalyticsEvent('Panel interaction', location.subtitle.split(',')[0] + ' (show location)');
            });
        }

        //what to do when a marker is hovered over or clicked
        function popupAction(event) {
            var location = {
                title: event.feature.getProperty("title"),
                subtitle: event.feature.getProperty("subtitle"),
                latlng: event.feature.getGeometry().get(),
                category: event.feature.getProperty("category"),
                subcategory: event.feature.getProperty("subcategory"),
                shortdesc: event.feature.getProperty("shortdesc") || "",
                longdesc: event.feature.getProperty("longdesc") || "",
                content: ""
            };
            location.content = "<h4>" + location.title + "</h4>" + location.shortdesc;

            // don't add the 'more information' link if there's no long desc
            if(location.longdesc !== "") {
                location.content += '<p><a class="si-content-more-link">More information</a></p>';
            }

            event.feature.marker = createInfoWindow(location);
            // Send marker event to GA
            addAnalyticsEvent('Select marker', location.title);
        }

        // Check whether there is a location hash,
        // and drop pin/open info panel for relevant location
        function checkHash() {
            var thisHash = document.location.hash.substr(1);
            if (thisHash === '') return false;
            // Search GeoJSON for matching location
            var selectedFeature = $.grep(cachedGeoJson.features, function (feature) {
                return makeHash(feature.properties.title) === thisHash;
            });
            if (selectedFeature.length === 0) return false;
            //return selectedFeature;
            if (selectedFeature[0].properties.longdesc === undefined) {
                content = '<h4>' + selectedFeature[0].properties.title + '</h4>';
            } else {
                content = '<h4>' + selectedFeature[0].properties.title + '</h4>' + '<p><a class="si-content-more-link">More information</a></p>';
            }
            var location = {
                title: selectedFeature[0].properties.title,
                subtitle: selectedFeature[0].properties.subtitle,
                category: selectedFeature[0].properties.category,
                latlng: new google.maps.LatLng(parseFloat(selectedFeature[0].geometry.coordinates[1]), parseFloat(selectedFeature[0].geometry.coordinates[0])),
                shortdesc: selectedFeature[0].properties.shortdesc || false,
                longdesc: selectedFeature[0].properties.longdesc || false,
                content: content,
                zoom: parseInt(selectedFeature[0].properties.zoom, 10) || 16
            };
            // Drop pin and infoWindow on map
            if (location.category === "Room") {
                createInfoPanel(location);
            } else {
                createInfoWindow(location);
                // move viewport to correct location and zoom - not working
                //map.setZoom(location.zoom);
                map.panTo(location.latlng);
            }
        }

        // make a URL hash-friendly value from str
        function makeHash(str) {
            // Lower case
            // Replace all spaces with '-'
            // Remove all non-word or non-- chars ([^a-zA-Z0-9_-])
            // Encode as URI, just in case
            return encodeURI(str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, ""));
        }

        // initialise the map
        function initMap() {

            // load the map
            map = loadMap();

            // pass the map object into our global uoy_map object for its use(s)
            try {
                uoy_map.setGoogleMapObj(map);
                uoy_map.plotPOIItems();
            } catch (e) {
                console.log(e);
            }

            // fit to campuses
            setBounds();

            // overlay our tiles

            function CoordMapType(tileSize) {
                this.tileSize = tileSize;
            }

            // WHat tiles do we have available?
            // e.g. zoom 13, x from 4069-4073, y from 2630-2633
            var limits = {
                13: {xMin: 4069, xMax: 4073, yMin: 2630, yMax: 2633},
                14: {xMin: 8139, xMax: 8146, yMin: 5260, yMax: 5266},
                15: {xMin: 16279, xMax: 16292, yMin: 10520, yMax: 10533},
                16: {xMin: 32558, xMax: 32585, yMin: 21040, yMax: 21067},
                17: {xMin: 65116, xMax: 65170, yMin: 42080, yMax: 42135},
                18: {xMin: 130233, xMax: 130341, yMin: 84161, yMax: 84271}
            };

            CoordMapType.prototype.getTile = function (coord, zoom, ownerDocument) {
                var span = ownerDocument.createElement('span');
                //if (1 == 1) return ownerDocument.createElement('span');
                // Find out if it's outside our limits
                if (!limits[zoom]) return span;
                if (coord.x > limits[zoom].xMax) return span;
                if (coord.x < limits[zoom].xMin) return span;
                if (coord.y > limits[zoom].yMax) return span;
                if (coord.y < limits[zoom].yMin) return span;
                var tile = ownerDocument.createElement('img');
                //tile.src = "https://www.york.ac.uk/static/data/maps/tiles/"+zoom+"/"+coord.x+"/"+coord.y+".png";
                tile.src = "https://www.york.ac.uk/map/tiles/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
                return tile;
            };

            map.overlayMapTypes.insertAt(0, new CoordMapType(new google.maps.Size(256, 256)));

            // add custom controls
            customFeedbackControl(map);
            customCampusControl(map);

            // Load GeoJSON.
            $.getJSON(GeoJSONFile).then(function (data) {
                cachedGeoJson = data; //save the geojson in case we want to update its values
                // Filter features that have contain certain terms
                cachedGeoJson.features = $.grep(data.features, function (feature) {
                    var title = feature.properties.title;
                    var filterPhrases = [
                        'DELETE',
                        'REMOVE',
                        'DOES NOT EXIST',
                        'no longer bookable',
                        'NO LONGER BOOKABLE',
                        'NOW A KITCHEN',
                        'USE248X'
                    ];
                    var r = -1;
                    $.each(filterPhrases, function (i, phrase) {
                        var phraseIndex = title.indexOf(phrase);
                        if (phraseIndex > -1) {
                            r = phraseIndex;
                            return false;
                        }
                    });
                    if (r > -1) return true;
                    // Check lat and long to see if it's 0,0 (fake data)
                    if (feature.geometry.coordinates[0] === 0 || feature.geometry.coordinates[1] === 0) {
                        return true;
                    }
                }, true); // Change to false to invert the filter i.e. show 'bad' results
                // Update some wayward locations
                $.each(cachedGeoJson.features, function (i, d) {
                    if (d.properties.codes == 'O/EXT/P-temp') {
                        cachedGeoJson.features[i].geometry.coordinates = [-1.051738, 53.9417839];
                        cachedGeoJson.features[i].properties.subtitle = 'Adjacent to Pavilion, Campus West';
                    }
                });

                addMarkers();
                initSearch();
                checkHash();

                // For testing purposes
                // window.cachedGeoJson = cachedGeoJson;
            }).fail(function (err) {
                console.log('The map data failed to load', err);
            });
            google.maps.event.addListener(map, "idle", function () {
                google.maps.event.trigger(map, 'resize');
            });
            google.maps.event.addListener(map, 'tilesloaded', function(){

                // show the various feedback and map location buttons
                $('#control-feedback-div').removeClass('is-hidden');
                $('#control-campus-buttons').removeClass('is-hidden');
                $('#control-campus-div').removeClass('is-hidden');
            });

        } // end initMap

        initMap();

        // Initialise search functionality
        function initSearch() {

            var $searchForm = $('#map-search-form');
            var $searchQuery = $('#map-search-query');
            var fuseOptions = {
                keys: [{
                    name: 'properties.title',
                    weight: 0.6
                }, {
                    name: 'properties.subtitle',
                    weight: 0.3
                }, {
                    name: 'properties.codes',
                    weight: 0.7
                }],
                threshold: 0.4,
                includeScore: true,
                includeMatches: true,
                tokenize: true,
                //location:0,
                minMatchCharLength: 3
            };
            var noSearchCategories = [
                'Post boxes',
                'Printers',
                'Bus stops',
                'Study spaces'
            ];
            var searchGeoJson = JSON.parse(JSON.stringify(cachedGeoJson));
            searchGeoJson.features = $.grep(cachedGeoJson.features, function (feature) {
                return $.inArray(feature.properties.category, noSearchCategories) === -1;
            });

            var fuse = new FUSE(searchGeoJson.features, fuseOptions);
            new AUTOCOMPLETE({
                input: $('#map-search-query'),
                results: function (searchTerm, onComplete) {
                    var fuseResult = fuse.search(searchTerm);

                    if (fuseResult.length === 0) {
                        // Send 'no results' event to GA
                        addAnalyticsEvent('Search', 'No results (query: ' + searchTerm + ')');
                        return false;
                    }

                    if (fuseResult.length > 10) {
                        // Cut down to first 10
                        fuseResult.length = 10;
                    }

                    $.each(fuseResult, function (i, feature) {
                        // Add title, subtitle, link fields
                        fuseResult[i].item.title = feature.item.properties.title;
                        fuseResult[i].item.subtitle = feature.item.properties.subtitle;
                        fuseResult[i].item.link = "#" + makeHash(feature.item.properties.title);
                        if (i === fuseResult.length - 1) onComplete(fuseResult);
                    });

                },
                followLinks: true
            });

            // Submit the form using the is-selected item
            var submitForm = function () {
                var $autocompleteItems = $('.c-autocomplete__item', $autocompleteList);
                var selectedItem = $autocompleteItems.filter('.is-selected');
                var selectedLink = selectedItem.children('.c-autocomplete__link');
                var selectedTitle = selectedLink.children('.c-autocomplete__title').text();
                var selectedSubtitle = selectedLink.children('.c-autocomplete__subtitle').text();
                var selectedHash = selectedLink.attr("href");
                var searchQueryText = $searchQuery.val();

                var selectedIndex = $autocompleteItems.index(selectedItem) + 1;

                if (selectedItem.length === 0) return false;

                // Add is-selected value to search query
                $searchQuery.val(selectedTitle);

                // Update hash
                if (history.pushState) {
                    history.pushState(null, null, selectedHash);
                } else {
                    location.hash = selectedHash;
                }

                // Get rest of details from cachedGeoJson
                var selectedFeature = $.grep(cachedGeoJson.features, function (feature) {
                    return feature.properties.title === selectedTitle;
                });

                // Is there more than one with this title? Check against subtitle
                // Should really use a unique ID
                if (selectedFeature.length > 1 && selectedSubtitle != '') {
                    selectedFeature = $.grep(selectedFeature, function (feature) {
                        return feature.properties.subtitle === selectedSubtitle;
                    });
                }
                if (selectedFeature[0].properties.longdesc === undefined) {
                    content = '<h4>' + selectedTitle + '</h4>';
                } else {
                    content = '<h4>' + selectedTitle + '</h4>' + '<p><a class="si-content-more-link">More information</a></p>';
                }
                var location = {
                    title: selectedTitle,
                    subtitle: selectedSubtitle,
                    latlng: new google.maps.LatLng(parseFloat(selectedFeature[0].geometry.coordinates[1]), parseFloat(selectedFeature[0].geometry.coordinates[0])),
                    category: selectedFeature[0].properties.category || false,
                    subcategory: selectedFeature[0].properties.subcategory || false,
                    shortdesc: selectedFeature[0].properties.shortdesc || false,
                    longdesc: selectedFeature[0].properties.longdesc || false,
                    content: content,
                    //zoom: parseInt(selectedFeature[0].properties.zoom, 10) || 16
                };

                deleteMarkers();

                // Drop pin and infoWindow on map
                if (location.category === "Room") {
                    //console.log(selectedFeature[0].geometry);
                    createInfoPanel(location);
                } else {
                    closeInfoPanel();
                    createInfoWindow(location);
                    // move viewport to correct location and zoom - not working
                    //map.setZoom(location.zoom);
                    map.panTo(location.latlng);
                }

                // Send query event to GA
                addAnalyticsEvent('Search', selectedTitle + ' (query: ' + searchQueryText + ')', selectedIndex);
            };

            // Select all text when you click the input (much easier than deleting existing value)
            // Also re-searches if there is content
            // TODO: move this to pattern lib
            $searchQuery.on('focus click', function (e) {
                var $this = $(this);
                var searchTerm = $searchQuery.val();
                $this.select();
                if (searchTerm != '') {
                    // run the search
                    $this.trigger('keyup');
                }
            });

            // Prevent form submit
            $searchForm.on('submit', function (e) {
                e.preventDefault();
                return false;
            });

            // Clicking on map closes autocomplete
            map.addListener('click', function (e) {
                var searchTerm = $searchQuery.val();
                if (searchTerm !== '') {
                    // Send 'no selection' event to GA
                    addAnalyticsEvent('Search', 'No selection (query: ' + searchTerm + ')');
                } else {
                    // Send click event to GA
                    addAnalyticsEvent('Click', e.latLng.lat() + ',' + e.latLng.lng());
                }
            });

            var mapPanorama = map.getStreetView();
            mapPanorama.addListener("visible_changed", function () {
                var pos = mapPanorama.getPosition();
                // Send click event to GA
                addAnalyticsEvent('Show StreetView', pos.lat() + ',' + pos.lng());
            });

        } // end initSearch

        $window.on('hashchange', checkHash);

        // Open/Close the drawer
        // Can call with argument 'open' or 'close'
        function toggleDrawer(e) {
            var overwrite;
            if (e === 'open') overwrite = 'open';
            if (e === 'close') overwrite = 'close';
            if ($panel.hasClass('is-open') || overwrite === 'close') {
                $icon.removeClass('c-icon--chevron-down').addClass('c-icon--chevron-up');
                $panel.removeClass('is-open');
            } else {
                $icon.removeClass('c-icon--chevron-up').addClass('c-icon--chevron-down');
                $panel.addClass('is-open');
            }
        }

        $("#drawerStatusButton").click(toggleDrawer);

        // Update placeholder text
        function searchPlaceholderText() {
            var placeholderText;
            if ($window.width() < 1024) {
                placeholderText = "Search the map";
            } else {
                placeholderText = "Search for buildings, departments and rooms";
            }
            $("input").attr("placeholder", placeholderText);
        }

        searchPlaceholderText();

        // respond to resizing
        $(window).resize(searchPlaceholderText);

        // User location
        // Geolocation
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(onSuccess, onError, watchOptions);

            function onSuccess(position) {
                var userLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                var icon = {
                    url: 'img/markers/pin.svg',
                    scaledSize: new google.maps.Size(24, 32)
                };
                if (typeof(marker) != "undefined") marker.setMap(null);
                marker = new google.maps.Marker({
                    map: map,
                    icon: icon
                });
                marker.setPosition(userLatlng);
                //disable until further investigation
                //if (typeof(map) != "undefined") map.panTo(userLatlng);
            }

            function onError(err) {
                let message = "There has been a problem finding your location";
                let showError = false;

                if(err) {
                    switch (err.code) {
                        case 1: // "User denied geolocation prompt"
                            message = err.message;
                            showError = false;
                            break;
                        default:
                            message = '';
                            showError = false;
                            break;
                    }
                }

                if (window.location.hostname.indexOf('localhost') >= 0) {
                    // don't show errors in popup on localhost
                    console.log(message);
                } else {
                    //uoy_map.alertOverlay(message, true);
                    // TODO: implement this once we have a better understanding of the error codes thrown back
                }
            }

            var watchOptions = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        }
    });
});
