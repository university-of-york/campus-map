$(function() {
	// defaults
	var GeoJSONFile = "https://york.funnelback.co.uk//s/search.html?collection=york-uni-campusmap&form=geojson&query=!padrenullquery&num_ranks=5000";
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

	// marker icon settings
	var markerOpts = {
		"food-and-drink": {
			path: "M1728 640q0-80-56-136t-136-56h-64v384h64q80 0 136-56t56-136zm-1664 768h1792q0 106-75 181t-181 75h-1280q-106 0-181-75t-75-181zm1856-768q0 159-112.5 271.5t-271.5 112.5h-64v32q0 92-66 158t-158 66h-704q-92 0-158-66t-66-158v-736q0-26 19-45t45-19h1152q159 0 271.5 112.5t112.5 271.5z",
			fillColour: "#f9f9f9",
			strokeColour: "#000"
		},
		"study-spaces": {
			path: "M1703 478q40 57 18 129l-275 906q-19 64-76.5 107.5t-122.5 43.5h-923q-77 0-148.5-53.5t-99.5-131.5q-24-67-2-127 0-4 3-27t4-37q1-8-3-21.5t-3-19.5q2-11 8-21t16.5-23.5 16.5-23.5q23-38 45-91.5t30-91.5q3-10 .5-30t-.5-28q3-11 17-28t17-23q21-36 42-92t25-90q1-9-2.5-32t.5-28q4-13 22-30.5t22-22.5q19-26 42.5-84.5t27.5-96.5q1-8-3-25.5t-2-26.5q2-8 9-18t18-23 17-21q8-12 16.5-30.5t15-35 16-36 19.5-32 26.5-23.5 36-11.5 47.5 5.5l-1 3q38-9 51-9h761q74 0 114 56t18 130l-274 906q-36 119-71.5 153.5t-128.5 34.5h-869q-27 0-38 15-11 16-1 43 24 70 144 70h923q29 0 56-15.5t35-41.5l300-987q7-22 5-57 38 15 59 43zm-1064 2q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5zm-83 256q-4 13 2 22.5t20 9.5h608q13 0 25.5-9.5t16.5-22.5l21-64q4-13-2-22.5t-20-9.5h-608q-13 0-25.5 9.5t-16.5 22.5z",
			fillColour: "#a23479",
			strokeColour: "#000"
		},
		"printers": {
			path: "M448 1536h896v-256h-896v256zm0-640h896v-384h-160q-40 0-68-28t-28-68v-160h-640v640zm1152 64q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128 0v416q0 13-9.5 22.5t-22.5 9.5h-224v160q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-160h-224q-13 0-22.5-9.5t-9.5-22.5v-416q0-79 56.5-135.5t135.5-56.5h64v-544q0-40 28-68t68-28h672q40 0 88 20t76 48l152 152q28 28 48 76t20 88v256h64q79 0 135.5 56.5t56.5 135.5z",
			fillColour: "#000",
			strokeColour: "#000"
		},
		"shops": {
			path: "M1920 768q53 0 90.5 37.5t37.5 90.5-37.5 90.5-90.5 37.5h-15l-115 662q-8 46-44 76t-82 30h-1280q-46 0-82-30t-44-76l-115-662h-15q-53 0-90.5-37.5t-37.5-90.5 37.5-90.5 90.5-37.5h1792zm-1435 800q26-2 43.5-22.5t15.5-46.5l-32-416q-2-26-22.5-43.5t-46.5-15.5-43.5 22.5-15.5 46.5l32 416q2 25 20.5 42t43.5 17h5zm411-64v-416q0-26-19-45t-45-19-45 19-19 45v416q0 26 19 45t45 19 45-19 19-45zm384 0v-416q0-26-19-45t-45-19-45 19-19 45v416q0 26 19 45t45 19 45-19 19-45zm352 5l32-416q2-26-15.5-46.5t-43.5-22.5-46.5 15.5-22.5 43.5l-32 416q-2 26 15.5 46.5t43.5 22.5h5q25 0 43.5-17t20.5-42zm-1156-1217l-93 412h-132l101-441q19-88 89-143.5t160-55.5h167q0-26 19-45t45-19h384q26 0 45 19t19 45h167q90 0 160 55.5t89 143.5l101 441h-132l-93-412q-11-44-45.5-72t-79.5-28h-167q0 26-19 45t-45 19h-384q-26 0-45-19t-19-45h-167q-45 0-79.5 28t-45.5 72z",
			fillColour: "#e4b53c",
			strokeColour: "#000"
		},
		"bus-stops": {
			path: "M512 1216q0-53-37.5-90.5t-90.5-37.5-90.5 37.5-37.5 90.5 37.5 90.5 90.5 37.5 90.5-37.5 37.5-90.5zm1024 0q0-53-37.5-90.5t-90.5-37.5-90.5 37.5-37.5 90.5 37.5 90.5 90.5 37.5 90.5-37.5 37.5-90.5zm-46-396l-72-384q-5-23-22.5-37.5t-40.5-14.5h-918q-23 0-40.5 14.5t-22.5 37.5l-72 384q-5 30 14 53t49 23h1062q30 0 49-23t14-53zm-226-612q0-20-14-34t-34-14h-640q-20 0-34 14t-14 34 14 34 34 14h640q20 0 34-14t14-34zm400 725v603h-128v128q0 53-37.5 90.5t-90.5 37.5-90.5-37.5-37.5-90.5v-128h-768v128q0 53-37.5 90.5t-90.5 37.5-90.5-37.5-37.5-90.5v-128h-128v-603q0-112 25-223l103-454q9-78 97.5-137t230-89 312.5-30 312.5 30 230 89 97.5 137l105 454q23 102 23 223z",
			fillColour: "#9C5A9C",
			strokeColour: "#843284"
		},
		"car-parks": {
			path: "M480 1088q0-66-47-113t-113-47-113 47-47 113 47 113 113 47 113-47 47-113zm36-320h1016l-89-357q-2-8-14-17.5t-21-9.5h-768q-9 0-21 9.5t-14 17.5zm1372 320q0-66-47-113t-113-47-113 47-47 113 47 113 113 47 113-47 47-113zm160-96v384q0 14-9 23t-23 9h-96v128q0 80-56 136t-136 56-136-56-56-136v-128h-1024v128q0 80-56 136t-136 56-136-56-56-136v-128h-96q-14 0-23-9t-9-23v-384q0-93 65.5-158.5t158.5-65.5h28l105-419q23-94 104-157.5t179-63.5h768q98 0 179 63.5t104 157.5l105 419h28q93 0 158.5 65.5t65.5 158.5z",
			fillColour: "#00b3eb",
			strokeColour: "#005975"
		},
		"cash-points": {
			path: "M832 1152h384v-96h-128v-448h-114l-148 137 77 80q42-37 55-57h2v288h-128v96zm512-256q0 70-21 142t-59.5 134-101.5 101-138 39-138-39-101.5-101-59.5-134-21-142 21-142 59.5-134 101.5-101 138-39 138 39 101.5 101 59.5 134 21 142zm512 256v-512q-106 0-181-75t-75-181h-1152q0 106-75 181t-181 75v512q106 0 181 75t75 181h1152q0-106 75-181t181-75zm128-832v1152q0 26-19 45t-45 19h-1792q-26 0-45-19t-19-45v-1152q0-26 19-45t45-19h1792q26 0 45 19t19 45z",
			fillColour: "#009900",
			strokeColour: "#000"
		},
		"post-boxes": {
			path: "M1792 710v794q0 66-47 113t-113 47h-1472q-66 0-113-47t-47-113v-794q44 49 101 87 362 246 497 345 57 42 92.5 65.5t94.5 48 110 24.5h2q51 0 110-24.5t94.5-48 92.5-65.5q170-123 498-345 57-39 100-87zm0-294q0 79-49 151t-122 123q-376 261-468 325-10 7-42.5 30.5t-54 38-52 32.5-57.5 27-50 9h-2q-23 0-50-9t-57.5-27-52-32.5-54-38-42.5-30.5q-91-64-262-182.5t-205-142.5q-62-42-117-115.5t-55-136.5q0-78 41.5-130t118.5-52h1472q65 0 112.5 47t47.5 113z",
			fillColour: "#A31919",
			strokeColour: "#000"
		}
	}



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
					disableDefaultUI: true,
					gestureHandling: "greedy"
			});
	}

	// load UoY tiles
	function loadYorkTiles() {
		return new google.maps.ImageMapType({
			getTileUrl: function(coord, zoom) {
				return "https://www.york.ac.uk/static/data/maps/tiles/"+zoom+"/"+coord.x+"/"+coord.y+".png";
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true,
			zoom: defaultZoom,
			maxZoom: maxZoom,
			minZoom: minZoom,
			name: 'Map'
		});
	}


	// add groups of markers based on selectable categories
	function addMarkers() {
		// Make arrays of markers for each category
		var markerGroups = {};
		var markerFeatures = {};

		$(".c-btn--selectable").each(function(i, selectable) {
			var $selectable = $(this);
			var selectableCategory = $selectable.attr("id");
			// 'Clone' new GeoJSON file for each category
			markerGroups[selectableCategory] = JSON.parse(JSON.stringify(cachedGeoJson));
			markerGroups[selectableCategory].features = $.grep(cachedGeoJson.features, function(feature) {
				var featureCategory = feature.properties.category.toLowerCase().replace(/\s+/g, '-');
				return featureCategory === selectableCategory;
			});
		});
		$(".c-btn--selectable").click(function(e) {
			var $selectable = $(this);
			var selectableCategory = $selectable.attr("id");
			var thisGroup = markerGroups[selectableCategory];
			// $.each(thisGroup, function(j, feature) {
				// var dataFeature = new google.maps.Data(feature);
				if ($selectable.is(':checked')) {
					markerFeatures[selectableCategory] = map.data.addGeoJson(thisGroup);
					map.data.addListener('click', function(event) {
						var title = event.feature.getProperty("title");
						var subTitle = event.feature.getProperty("subtitle");
						var category = event.feature.getProperty("category");
						var subCategory = event.feature.getProperty("subcategory");
						var longdesc = event.feature.getProperty("longdesc");
						var location = {
							title: title,
							subtitle: subTitle,
							latlng: event.feature.getGeometry().get(),
							category: category,
							subcategory: subCategory,
							longdesc: longdesc,
							content: '<h4>'+title+'</h4>'+'<p><a class="si-content-more-link">More Information</a></p>'
						}
						createInfoWindow(location);


					});
					map.data.setStyle(function(feature) {
						var featureCategory = feature.getProperty('category').toLowerCase().replace(/\s+/g, '-');
						var icon = {
						   path: markerOpts[featureCategory].path,
						   anchor: new google.maps.Point(10,10),
						   //scaledSize: new google.maps.Size(20,20),
						   scale: 0.010,
						   fillOpacity: 1,
						   fillColor: markerOpts[featureCategory].fillColour,
						   strokeWeight: 1,
						   strokeColor: markerOpts[featureCategory].strokeColour

					   }
						return {
							icon: icon
						};
					});
				} else {
    			$.each(markerFeatures[selectableCategory], function(i, feature) {
    				map.data.remove(feature);
				  });
				}
			// })
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
			closeInfoPanel();
		});
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

	function showPosition(position) {
		var lat = position.coords.latitude;
		var lng = position.coords.longitude;
		return	new google.maps.LatLng(lat, lng);
	}


	function snazzyOptions(opts) {
		return {
			marker: opts.marker,
			content: opts.content,
			placement: 'top',
			showCloseButton: true,
			closeOnMapClick: true,
			padding: '28px',
			backgroundColor: 'rgba(15, 61, 76, 0.9)',
			border: false,
			borderRadius: '12px',
			shadow: false,
			fontColor: '#fff',
			maxWidth: 320,
			closeWhenOthersOpen: true,
			offset: {
			  top: '3px',
			  left: '9px'
			},
			callbacks: {
				afterOpen: function(){
					$(".si-content-more-link").click(function(event) {
						console.log(event);
						//var mapContainer = document.getElementById('mapContainer');
						var $infoPanel = $('.infoPanel');
						var html = '<h4>'+opts.title+'</h4>';
						if (opts.subCategory) html+= '<p>'+opts.subCategory+'</p>';
						if (opts.category) html+= '<p>'+opts.category+'</p>';
						if (opts.longdesc) html+= '<p>'+opts.longdesc+'</p>';
						$('.infoPanel__content').html(html);
						openInfoPanel();
						$(".closeInfoPanel").click(closeInfoPanel);
					});
				},
				afterClose: function(){
					closeInfoPanel();
				}
			}
	   }
	}

	function createInfoWindow(location) {
			if (location.category != "Room") {
				closeInfoPanel();
			}
			// Everything must have a title!
			if (!location.title) return false;
			var title = location.title;
			var subTitle = location.subtitle || false;
			var subCategory = location.subcategory || false;
			var category = location.category || false;
			var longdesc = location.longdesc || false;
			if (category === "Room") {
				var content = '<h4>'+title+'</h4>';
				content+= '<p>Approximate location only</p>'+'<p>Please allow yourself time to locate the room</p>';
			} else {
				var content = location.content;
			}

			DeleteMarkers();
			var marker = new google.maps.Marker({
					position: location.latlng,
					map: map,
					title: title,
					subtitle: subTitle,
					subCategory: subCategory,
					category: category
			});
			map.setZoom(16);
			map.panTo(marker.position);
			var thisOptions = snazzyOptions({
				title: title,
				subCategory: subCategory,
				category: category,
				marker: marker,
				longdesc: longdesc,
				content: content
			});
			var snazzy = new SnazzyInfoWindow(thisOptions);
			snazzy.open(map, marker);
			markers.push(marker);

			// hide the red marker
			marker.setVisible(false);
	}

	function createInfoPanel(location) {
		var mapContainer = document.getElementById('mapContainer');
		var $infoPanel = $('.infoPanel');
		var html = '<h3>'+location.title+'</h3>';
		if (location.subtitle !== false) html+= '<h4>'+location.subtitle+'</h4>';
		if (location.subcategory !== false) html+= '<p>'+location.subcategory+'</p>';
		//if (location.category !== false) html+= '<p>'+location.category+'</p>';
		if (location.longdesc !== false) html+= '<p>'+location.longdesc+'</p>';
		html+= '<p><a class="locationMarker">Show building on map</a></p>';
		$('.infoPanel__content').html(html);
		openInfoPanel();
		$(".closeInfoPanel").click(closeInfoPanel);
		$(".locationMarker").click(function() {
			 createInfoWindow(location);
		});
	}

	// Check whether there is a location hash,
	// and drop pin/open info panel for relevant location
	function checkHash() {
		var thisHash = document.location.hash.substr(1);
		if (thisHash === '') return false;
		// Search GeoJSON for matching location
		var selectedFeature = $.grep(cachedGeoJson.features, function(feature) {
			return makeHash(feature.properties.title) === thisHash;
		});
		if (selectedFeature.length === 0) return false;
		//return selectedFeature;
		var location = {
			title: selectedFeature[0].properties.title,
			subtitle: selectedFeature[0].properties.subtitle,
			latlng: new google.maps.LatLng(parseFloat(selectedFeature[0].geometry.coordinates[1]), parseFloat(selectedFeature[0].geometry.coordinates[0])),
			category: selectedFeature[0].properties.category || false,
			subcategory: selectedFeature[0].properties.subcategory || false,
			longdesc: selectedFeature[0].properties.longdesc || false,
			content: '<h4>'+selectedFeature[0].properties.title+'</h4>'+'<p><a class="si-content-more-link">More Information</a></p>'
		}
		// Drop pin and inforWindow on map
		if (location.category === "Room") {
			createInfoPanel(location);
		} else {
			createInfoWindow(location);
		}
	}

	// make a URL hash-friendly value from str
	function makeHash(str) {
		// Lower case
		// Replace all spaces with '-'
		// Remove all non-word or non-- chars ([^a-zA-Z0-9_-])
		// Encode as URI, just in case
		return encodeURI(str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, ""));
	};

	// initialise the map
	function initMap() {

		// load the map
		map = loadMap();

		// load the tiles
		var yorkTiles = loadYorkTiles();
		map.mapTypes.set('campus', yorkTiles);
		map.setMapTypeId('campus');

		// add custom controls
		customControls(map);

		//close infoPanel by clicking anywhere
		clickAnywherePanelClose(map);

		// Load GeoJSON.
		$.getJSON(GeoJSONFile).then(function(data){
			cachedGeoJson = data; //save the geojson in case we want to update its values
			// Filter features that have contain certain terms
			cachedGeoJson.features = $.grep(data.features, function(feature) {
				var title = feature.properties.title;
				var filterPhrases = [
					'DELETE',
					'REMOVE',
					'DOES NOT EXIST',
					'no longer bookable',
					'NO LONGER BOOKABLE',
					'NOW A KITCHEN'
			  ];
			  var r = -1;
			  $.each(filterPhrases, function(i, phrase) {
					var phraseIndex = title.indexOf(phrase);
					if (phraseIndex > -1) {
			   		r = phraseIndex;
			   		return false;
			   	}
			   	// if (i === filterPhrases.length - 1) return true;
			  });
		   	return r > -1;
			}, true); // Change to false to invert the filter i.e. show 'bad' results
			//console.log(cachedGeoJson);
			//map.data.setStyle({'visible': false});
			//var features = map.data.addGeoJson(cachedGeoJson, {idPropertyName:"id"});
			addMarkers();
			initSearch();
			checkHash();
		});


	} // end initMap

	//load
	google.maps.event.addDomListener(window, 'load', initMap);

	// Initialise search functionality

	function initSearch() {

		var $searchForm = $('#map-search-form');
		var $searchQuery = $('#map-search-query');
		var $autocompleteList = $('.c-autocomplete__list', $searchForm);
		var fuseOptions = {
			keys: [{
				name: 'properties.title',
				weight: 0.6
			}, {
				name: 'properties.subtitle',
				weight: 0.3
			}, {
				name: 'properties.codes',
				weight: 0.1
			}],
			includeScore: true,
			includeMatches: true,
			minMatchCharLength: 3
		}
		var fuse = new Fuse(cachedGeoJson.features, fuseOptions);

		// Move selected item to next
		var selectItem = function(dir) {
			var $autocompleteItems = $('.c-autocomplete__item', $autocompleteList);
			var selectedItem = $autocompleteItems.filter('.is-selected');
			var selectedIndex = false;
			if (selectedItem.length === 1) {
				selectedIndex = selectedItem.index();
			}
			if (dir === 'down') {
				if (selectedIndex === false) {
					// Nothing selected yet
					selectedIndex = 0;
				} else {
					selectedIndex++;
					// Loop back round
					if (selectedIndex > $autocompleteItems.length-1) selectedIndex = 0;
				}
			}
			if (dir === 'up') {
				if (selectedIndex === false) {
					// Nothing selected yet
					selectedIndex = -1;
				} else {
					selectedIndex--;
				}
			}
			// Select correct item
			$autocompleteItems.removeClass('is-selected');
			$($autocompleteItems.get(selectedIndex)).addClass('is-selected');
		};

		// Submit the form using the is-selected item
		var submitForm = function() {
			var $autocompleteItems = $('.c-autocomplete__item', $autocompleteList);
			var selectedItem = $autocompleteItems.filter('.is-selected');
			var selectedLink = selectedItem.children('.c-autocomplete__link');
			var selectedTitle = selectedLink.children('.c-autocomplete__title').text();
			var selectedSubtitle = selectedLink.children('.c-autocomplete__subtitle').text();
			var selectedHash = selectedLink.attr("href");

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
			var selectedFeature = $.grep(cachedGeoJson.features, function(feature) {
			  return feature.properties.title === selectedTitle;
			});

			// Is there more than one with this title? Check against subtitle
			// Should really use a unique ID
			if (selectedFeature.length > 1) {
				selectedFeature = $.grep(selectedFeature, function(feature) {
			  	return feature.properties.subtitle === selectedSubtitle;
				});
			}
			var location = {
				title: selectedTitle,
				subtitle: selectedSubtitle,
				latlng: new google.maps.LatLng(parseFloat(selectedFeature[0].geometry.coordinates[1]), parseFloat(selectedFeature[0].geometry.coordinates[0])),
				category: selectedFeature[0].properties.category || false,
				subcategory: selectedFeature[0].properties.subcategory || false,
				longdesc: selectedFeature[0].properties.longdesc || false,
				content: '<h4>'+selectedTitle+'</h4>'+'<p><a id="more">More Information</a></p>'
			}
			// Drop pin and inforWindow on map
			if (location.category === "Room") {
				createInfoPanel(location);
			} else {
				createInfoWindow(location);
			}

			$autocompleteList.empty();

		}

		// Update autosuggest on keyup
		$searchQuery.on('keyup', function(e) {
			e.preventDefault();
			// Check if it's up, down, left, right, enter or tab
			var keyCode = e.keyCode;
			var stopReturn = false;
			// console.log(keyCode);
			switch (keyCode) {
				// Return
				case 13:
					// If there's a selected option, update value
					submitForm();
					stopReturn = true;
					//$searchForm.submit();
					break;
				case 38:
					selectItem('up');
					stopReturn = true;
					break;
				case 40:
					selectItem('down');
					stopReturn = true;
					break;
			}
			if (stopReturn === true) return false;

			$autocompleteList.empty();
			var searchTerm = $searchQuery.val();
			var fuseResult = fuse.search(searchTerm);

			if (fuseResult.length === 0) return false;

			$.each(fuseResult, function(i, feature) {
				if (i > 9) return false;
				var featureTitle = feature.item.properties.title;
				var featureSubtitle = feature.item.properties.subtitle;
				var featureItem = $('<li>').addClass("c-autocomplete__item");
				var featureLink = $('<a>').addClass("c-autocomplete__link")
																	.attr({
																		"href": "#"+makeHash(featureTitle),
																		"data-category": feature.item.properties.category
																	})
																	.appendTo(featureItem);
				var featureSpan = $('<span>').addClass("c-autocomplete__title")
																		 .text(featureTitle)
																		 .appendTo(featureLink);
				if (featureSubtitle !== 'null') {
					var featureSmall = $('<small>').addClass("c-autocomplete__subtitle")
																				 .text(featureSubtitle)
																				 .appendTo(featureLink);
				}
				$.each(feature.matches, function(j, match) {
					var newText = pathIndex(feature.item, match.key);
					var l = match.indices.length-1;
					// Start from the end so you don't disrupt indices
					for (;l > -1; l--) {
						var startText = newText.slice(0, match.indices[l][0]);
						var midText = newText.slice(match.indices[l][0], match.indices[l][1]+1);
						var endText = newText.slice(match.indices[l][1]+1);
						newText = startText+'<b>'+midText+'</b>'+endText;
					}
					if (match.key === "properties.title") {
						featureSpan.html(newText);
					} else if (match.key === "properties.subtitle") {
						featureSmall.html(newText);
					}
				});

				$autocompleteList.append(featureItem);
				featureLink.click(function(e) {
					e.preventDefault();
					// Mark clicked item as is-selected and submit
					var $thisItem = $(this).parent('.c-autocomplete__item');
					$thisItem.siblings().removeClass('is-selected');
					$thisItem.addClass('is-selected');
					submitForm();
				});

			});

		});

		// Prevent form submit
		$searchForm.on('submit', function(e) {
			e.preventDefault();
			return false;
		});

	} // end initSearch

	// Function to get property from dot notation
	// e.g. foo["bar.baz"] -> foo.bar.baz
	// Because of the way fuse.js returns matches
	function multiIndex(obj,is) {  // obj,['1','2','3'] -> ((obj['1'])['2'])['3']
		return is.length ? multiIndex(obj[is[0]],is.slice(1)) : obj
	}
	function pathIndex(obj,is) {   // obj,'1.2.3' -> multiIndex(obj,['1','2','3'])
		return multiIndex(obj,is.split('.'))
	}

	// button drawer
	$('.open').html('<i class="c-icon c-icon--above c-icon--chevron-up"></i> Find Facilities');
	$("#open").click(function() {
		if ($('#panel').css('display') == 'block') {
			var height = '-='+$('#panel').height();
			$('.open').html('<i class="c-icon c-icon--above c-icon--chevron-up"></i> Find Facilities');
		} else {
			var height = '+='+$('#panel').height();
			$('.open').html('<i class="c-icon c-icon--above c-icon--chevron-down"></i> Find Facilities');
		}
		$("#panel").slideToggle("slow");
	});


});
