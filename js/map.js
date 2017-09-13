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
	var $window = $(window);

	// load the map
	function loadMap() {
		return new google.maps.Map(document.getElementById('map'), {
			zoom: defaultZoom,
			maxZoom: maxZoom,
			minZoom: minZoom,
			center: heslington,
			zoomControl: true,
			zoomControlOptions: {
				position: google.maps.ControlPosition.RIGHT_TOP
			},
			scaleControl: true,
			streetViewControl: true,
			streetViewControlOptions: {
				position: google.maps.ControlPosition.RIGHT_TOP
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
						var shortdesc = event.feature.getProperty("shortdesc");
						var longdesc = event.feature.getProperty("longdesc");
						var location = {
							title: title,
							subtitle: subTitle,
							latlng: event.feature.getGeometry().get(),
							category: category,
							subcategory: subCategory,
							shortdesc: shortdesc,
							longdesc: longdesc,
							content: '<h4>'+title+'</h4>'+'<p><a class="si-content-more-link">More information</a></p>'
						}
						createInfoWindow(location);


					});
					map.data.setStyle(function(feature) {
						var featureCategory = feature.getProperty('category').toLowerCase().replace(/\s+/g, '-');
						var icon = {
						   url: 'img/markers/'+featureCategory+'.svg',
						   anchor: new google.maps.Point(10,10),
						   scaledSize: new google.maps.Size(22,22)
					   }
						return {
							icon: icon,
							optimized: false
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
			// Remove snazzy window
			if (markers[i].snazzy) {
				markers[i].snazzy.destroy();
			}
		}
		markers = [];
	}

	function customCampusControl(map) {
	        //custom control - campus button
	        var controlCampusDiv = $("#control-campus-div");

	        var controlEastUI = $("#control-east-ui");
			controlEastUI.click(function() {
	                map.setCenter(east);
	                map.setZoom(defaultZoom);
	        });
			var controlWestUI = $("#control-west-ui");
	        controlWestUI.click(function() {
	                map.setCenter(west);
	                map.setZoom(defaultZoom);
	        });
			var controlKingsManorUI = $("#control-km-ui");
		   controlKingsManorUI.click(function() {
				   map.setCenter(kingsmanor);
				   map.setZoom(defaultZoom);
		   });
	        controlCampusDiv.index = 1;
	        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlCampusDiv[0]);
	}


	function customResetControl(map) {
			//custom control - reset button
			var controlDiv = $("#control-reset-div");
			var controlUI = $("#control-reset-ui");
			var controlText = $("#control-reset-text");
			controlUI.click(function() {
					// map.setCenter(heslington);
					// map.setZoom(defaultZoom);
					setZoomBounds();
					DeleteMarkers();
			});
			controlDiv.index = 1;
			map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv[0]);
	}

	function customFeedbackControl(map) {
	        //custom control - feedback button
	        var controlFDiv = $("#control-feedback-div");
	        var controlFUI = $("#control-feedback-ui");
	        var controlFText = $("#control-feedback-text");
	        controlFUI.click(function() {
	            var $infoPanel = $('.infoPanel');
	            $('.infoPanel__content').html('<h3 class="infoPanel__feedbackTitle">Report a problem with the campus map</h3><iframe src="https://uni_york.formstack.com/forms/campus_map_feedback" title="Campus map feedback" width="100%" height="600px"></iframe>');
	            openInfoPanel();
	            $(".closeInfoPanel").click(closeInfoPanel);
	        });
	        controlFDiv.index = 1;
	        map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlFDiv[0]);
	}


	// zoom to CE & CW (mobile), CE, CW and KM (desktop)
	function setBounds() {
		var bounds= new google.maps.LatLngBounds(
			new google.maps.LatLng(53.943157, -1.058537),
			new google.maps.LatLng(53.950877, -1.024085)
		);
		map.fitBounds(bounds);
	}

	function clickAnywherePanelClose() {
		// click anywhere to close an InfoPanel
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
			closeOnMapClick: false,
			padding: '28px',
			backgroundColor: 'rgba(15, 61, 76, 0.9)',
			border: false,
			borderRadius: '12px',
			shadow: false,
			fontColor: '#fff',
			maxWidth: 320,
			closeWhenOthersOpen: true,
			offset: {
			  top: '-8px',
			  left: '2px'
			},
			callbacks: {
				afterOpen: function(){
					$(".si-content-more-link").click(function(event) {
						var $infoPanel = $('.infoPanel');
						var html = '<h3>'+opts.title+'</h3>';
						if (opts.subtitle) html+= '<h4>'+opts.subtitle+'</h4>';
						if (opts.shortdesc) html+= '<p>'+opts.shortdesc+'</p>';
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
			var shortdesc = location.shortdesc || false;
			var longdesc = location.longdesc || false;
			var zoom = location.zoom || 16;
			if (category === "Room") {
				var content = '<h4>'+title+'</h4>';
				content+= '<p>Approximate location only</p>';
				content+= '<p>Please allow yourself time to locate the room</p>';
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
					category: category,
					zoom: zoom
			});
			map.setZoom(15);
			//map.panTo(marker.position);
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

			//console.log(marker.position, location.latlng);
			// move viewport to correct location and zoom
			map.setZoom(marker.zoom);
			map.panTo(marker.position);
	}

	function createInfoPanel(location) {
		var $infoPanel = $('.infoPanel');
		var html = '<h3>'+location.title+'</h3>';
		if (location.subtitle !== false) html+= '<h4>'+location.subtitle+'</h4>';
		if (location.shortdesc !== false) html+= '<p>'+location.shortdesc+'</p>';
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
			shortdesc: selectedFeature[0].properties.shortdesc || false,
			longdesc: selectedFeature[0].properties.longdesc || false,
			content: '<h4>'+selectedFeature[0].properties.title+'</h4>'+'<p><a class="si-content-more-link">More information</a></p>'
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

		// fit to campuses
		setBounds();

		// load the tiles
		var yorkTiles = loadYorkTiles();
		map.mapTypes.set('campus', yorkTiles);
		map.setMapTypeId('campus');

		// add custom controls
		customResetControl(map);
		customFeedbackControl(map);
		customCampusControl(map);

		//close infoPanel by clicking anywhere
		clickAnywherePanelClose();

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
					'NOW A KITCHEN',
					'USE248X'
			  ];
			  var r = -1;
			  $.each(filterPhrases, function(i, phrase) {
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
			addMarkers();
			initSearch();
			checkHash();
			// For testing purposes
			// window.cachedGeoJson = cachedGeoJson;
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
			threshold: 0.2,
			includeScore: true,
			includeMatches: true,
			tokenize:true,
			// location:0,
			minMatchCharLength: 2
		};
		var noSearchCategories = [
			'Post boxes',
			'Printers',
			'Bus stops',
			'Study spaces'
		];
		var searchGeoJson = JSON.parse(JSON.stringify(cachedGeoJson));
		searchGeoJson.features = $.grep(cachedGeoJson.features, function(feature) {
			  return $.inArray(feature.properties.category, noSearchCategories) === -1;
		});
		var fuse = new Fuse(searchGeoJson.features, fuseOptions);

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
				shortdesc: selectedFeature[0].properties.shortdesc || false,
				longdesc: selectedFeature[0].properties.longdesc || false,
				content: '<h4>'+selectedTitle+'</h4>'+'<p><a class="si-content-more-link">More information</a></p>'
			}

			DeleteMarkers();

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
			var searchTerm = $searchQuery.val();
			switch (keyCode) {
				// Return
				case 13:
					if ($autocompleteList.children().length > 0 && searchTerm != '') {
						// If there's a selected option, update value
						submitForm();
						stopReturn = true;
					}
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
			var fuseResult = fuse.search(searchTerm);

			console.log(fuseResult);

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

		// Select all text when you click the input
		// (much easier than deleting existing value)
		$searchQuery.on('focus click', function(e) {
			var $this = $(this);
			$this.select();
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

	$window.on('hashchange', checkHash);

	$('#drawerStatusButton').html('<i class="c-icon c-icon--above c-icon--chevron-up"></i> Find Facilities');
	$("#drawerStatusButton").click(function() {
		if ($('.panel').css('display') == 'block') {
			var height = '-='+$('.panel').height();
			$('#drawerStatusButton').html('<i class="c-icon c-icon--above c-icon--chevron-up"></i> Find Facilities');
		} else {
			var height = '+='+$('.panel').height();
			$('#drawerStatusButton').html('<i class="c-icon c-icon--above c-icon--chevron-down"></i> Find Facilities');
		}
		$(".panel").slideToggle("slow");
	});

// placeholder
//function searchPlaceholderText() {
	if ($(window).width() < 1024) {
	   $("input").attr("placeholder", "Search the map");
	} else {
	   $("input").attr("placeholder", "Search for buildings, departments and rooms");
	}
//}

	// respond to resizing
	$(window).resize(function () {
		// searchPlaceholderText();
		if ($(window).width() < 1024) {
		   $("input").attr("placeholder", "Search the map");
		} else {
		   $("input").attr("placeholder", "Search for buildings, departments and rooms");
		}
	});

});
