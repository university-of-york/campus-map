$(function() {

  // Variables for use throughout
  // Declare them at the top so jQuery only has to process them once
  var $window = $(window);
  var $document = $(document);
  var $body = $('body');
  var $mapNavigation = $('#mapnavigation');
  var $mapDiv = $('#mapdiv');
  var $tab1 = $('#tab-1');

  // create the core map variables
  var map, mapMarker, mapBounds, infobox, $loadingIndicator, markersArray = [],
    isFullScreen = false;
  // Set up locations for hash checking
  // col1 is false so we can check if the hash location needs a marker adding
  var locations = {
    'heslington-west': {
      col0: 'Heslington West',
      col1: false,
      col2: 53.947007,
      col3: -1.052949,
      col4: 16,
      col5: null
    },
    'heslington-east': {
      col0: 'Heslington East',
      col1: false,
      col2: 53.947449,
      col3: -1.030397,
      col4: 16,
      col5: null
    },
    'kings-manor': {
      col0: 'King\'s Manor',
      col1: false,
      col2: 53.96224,
      col3: -1.086445,
      col4: 17,
      col5: ['K']
    },
    // Might be better to get the centre from the bounds?
    'default': {
      col0: 'Default Centre',
      col1: false,
      col2: 53.947007,
      col3: -1.052949,
      col4: 16,
      col5: null
    }
  }
  // Buildings we don't have on the map yet
  // Can't include BK as it conflicts with B/K
  // Cant' include GN as it conflicts with G/N
  var buildingsArray = ['SP', 'ADS', 'CSE', 'CS', 'MRC', 'HXH', 'SQ', 'RT', 'MP', 'GZ', 'RCH', 'HRL', 'FX'];
  var isLive = window.location.hostname === "www.york.ac.uk";

  // set the map type to use cloudmade tiles, have name 'Campus map' and not allow zoom beyond level 18
  var cloudMadeMapType = new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
      return "https://www.york.ac.uk/about/maps/campus/data/tiles/" +
        zoom + "/" + coord.x + "/" + coord.y + ".png";
    },
    tileSize: new google.maps.Size(256, 256),
    isPng: true,
    alt: "Campus map",
    name: "Campus map",
    maxZoom: 18
  });

  var init = function() {

    addFullScreenLink();

    addRoomSearch();

    // Loading Indicator
    $loadingIndicator = $('<img/>').attr({
      'src': 'images/loading.gif',
      'alt': 'Loading...'
    }).addClass('loading').appendTo($tab1);

    //resize the map when window resizes
    $window.resize(function() {
      if (isFullScreen === true) {
        windowWidth = parseInt($window.width());
        height = parseInt($window.height());
        mapWidth = windowWidth - ($mapNavigation.width());
        $mapDiv.width(mapWidth).height(height);
        google.maps.event.trigger(map, 'resize');
      };
    });

    // call the map initialisation function on page load
    //google.maps.event.addDomListener(window, 'load', initialiseMap);
    // load list of points for display as markers and call function to create the list
    var jsonURL = makeDataURL();
    $.getJSON(jsonURL, function(data) {
      createLocationsList(data);
    });
    $window.hashchange(function() {
      hashChangeCentreMap();
    });
  };

  var addRoomSearch = function() {
      var clonedFAQ = $('#templateFAQ').clone(true);
      clonedFAQ.attr('id', 'room-search-links');
      clonedFAQ.find('h3').text('Room code search');
      clonedFAQ.find('ul').remove();
      clonedFAQ.find('.a').append($('<form id="room-search-form"><input type="text" id="room-search-value" name="room-search-value" placeholder="Enter room number"><button type="submit" id="room-search-submit">Search</button></form>\n<div id="room-search-message"></div>'));
      $tab1.append(clonedFAQ);
  };

  var addFullScreenLink = function() {

    var $html = $('html');
    var $contentContainer = $('#content-container');
    var $mapContainer = $('#mapcontainer');
    var $mapBoxes = $('#mapnavigation, #maptabs');

    $fullscreenLink = $('<a>').attr({
      'id': 'fullscreen_link',
      'href': '#',
      'title': 'Full screen'
    }).text('Full screen').click(function(e) {
      //Bind function to clicks on full screen link
      e.preventDefault();
      if (isFullScreen === false) {
        windowHeight = parseInt($window.height());
        windowWidth = parseInt($window.width());
        mapheight = windowHeight - ($('#mapcentre').outerHeight()) - ($('#mapfooter').outerHeight());
        mapwidth = windowWidth - ($mapNavigation.width());
        $mapDiv.width(mapwidth).height(mapheight);
        $html.css({
          position: 'relative',
          overflow: 'hidden'
        });
        $contentContainer.css({
          position: 'static'
        });
        $fullscreenLink.css({
          backgroundPosition: '0 -14px'
        }).attr('title', 'Exit full screen').text('Exit full screen');
        $mapContainer.css({
          position: 'absolute',
          top: '0',
          left: '0',
          margin: '0'
        });
        $mapBoxes.height(mapheight);
        $tab1.height(mapheight - 10).css('max-height', 'none');
        google.maps.event.trigger(map, 'resize');
        isFullScreen = true;
        $window.resize(); //Fake a resize so that missing scrollbar space accounted for
        pageTracker._trackEvent('Map', 'Full screen', 'Enter full screen');
      } else {
        $mapDiv.width(500).height(500);
        $html.css({
          overflow: 'auto'
        });
        $contentContainer.css({
          position: 'relative'
        });
        $fullscreenLink.css({
          backgroundPosition: '0 0'
        }).attr('title', 'Full screen').text('Full screen');
        $mapContainer.css({
          position: 'relative'
        });
        $mapBoxes.height(500);
        $tab1.height(490).css('max-height', '490px');
        google.maps.event.trigger(map, 'resize');
        isFullScreen = false;
        pageTracker._trackEvent('Map', 'Full screen', 'Exit full screen');
      }
      return false;
    });
    //Exit full screen when esc key pressed
    $document.keyup(function(e) {
      if ((e.keyCode == 27) && (isFullScreen === true)) {
        fullscreenLink.click();
      }
    });
    //Insert full screen link
    $fullscreenDiv = $('<div>').attr({ 'id': 'fullscreen' }).append($fullscreenLink);
    $mapContainer.prepend($fullscreenDiv);

  };

  // centre the map on a given pair of coordinates and optional zoom level
  function centreMap(mapLat, mapLong, mapZoom) {
    mapZoom = parseInt(mapZoom,10) || 16;
    map.setCenter(new google.maps.LatLng(mapLat, mapLong));
    map.setZoom(mapZoom);
    return false;
  }

  function hashChangeCentreMap() {
    // fetch the location based on the hash
    var location = lookupHashCoords();

    // if a zoom level is set the use that, otherwise set a default of 16
    var zoomLevel = location.col4 ? location.col4 : 16;

    // remove street view overlay, if any
    clearStreetView();

    // centre the map on the new location
    centreMap(location.col2, location.col3, zoomLevel);

    clearOverlays();
    // show the marker if needed
    if (location.col1 !== false) {
      $('a[href=#'+makeID(location.col0)+']').click();
    }
  }

  function lookupHashCoords() {

    // If the hash exists as a key in the locations object, return it
    var hash = window.location.hash.substring(1);
    return (typeof locations[hash] === 'object') ? locations[hash] : locations['default'];

  }

  function initialiseMap() {

    // fetch some coordinates and optional zoom level to centre the initial view on
    var location = lookupHashCoords();

    // if a zoom level is set the use that, otherwise set a default of 16
    var zoomLevel = parseInt(location.col4,10) || 16;

    var myOptions = {
      maxZoom: 18,
      minZoom: 13,
      zoom: zoomLevel,
      center: new google.maps.LatLng(location.col2, location.col3),
      mapTypeControlOptions: {
        mapTypeIds: ['cloudMade', google.maps.MapTypeId.SATELLITE]
      },
      mapTypeId: 'cloudMade'
    };
    map = new google.maps.Map(document.getElementById('mapdiv'), myOptions);
    map.mapTypes.set('cloudMade', cloudMadeMapType);
    map.setMapTypeId('cloudMade');

    // if location is not one of the defaults, trigger a click on the marker
    if (location.col1 !== false) {
      $('a[href=#'+makeID(location.col0)+']').click();
    }

    // track StreetView being activated with Analytics
    var theStreetView = map.getStreetView();

    google.maps.event.addListener(theStreetView, 'visible_changed', function() {
      if (theStreetView.getVisible() && (isLive === true)) {
        pageTracker._trackEvent('Map', 'Show StreetView');
      }
    });
  }

  // create the locations list
  function createLocationsList(locationsObj) {

    var locationRows = locationsObj.query.results.row;
    // Remove first row (headers)
    locationRows.shift();

    // remove the loaading indicator
    $loadingIndicator.remove();

    var locationCategory = ''; // is the location a bus stop, college, building etc.
    var categoryID = ''; // storage for a version of the category suitable for use as an ID
    $.each(locationRows, function(key, location) { // for every row in the data
      // check if category is empty or doesn't match current one, and start new group if so
      if (locationCategory == '' || locationCategory != location.col1) {
        // get the name of the category
        locationCategory = location.col1;
        // create a version of the category suitable for use in an ID
        categoryID = makeID(locationCategory);
        // take a copy of the #templateFAQ div, set the ID, replace the H3 text with the category name and append to the #tab-1 element
        var clonedFAQ = $('#templateFAQ').clone(true);
        clonedFAQ.attr('id', categoryID + '-links');
        clonedFAQ.find('h3').text(locationCategory);
        clonedFAQ.find('a').text('Show all ' + locationCategory.substring(0, 1).toLowerCase() + locationCategory.substring(1));
        clonedFAQ.find('a').attr('id', categoryID + '-show-all');
        var currentCategory = locationCategory.toLowerCase();
        // set the first of many onclick events to be triggered when a 'show all' is triggered (the others being one per pin added outside of this if statement)
        clonedFAQ.find('a').click(function() {
          $body.trigger('map:click');
          //clear any existing markers
          clearOverlays();
          // clear the mapBounds object, ready for all the points for this group to be added
          mapBounds = new google.maps.LatLngBounds();
          // track the click to Analytics
          if (isLive === true) {
            pageTracker._trackEvent('Map', 'Drop pin', 'Show all ' + currentCategory);
          }
        });
        // add the FAQ object to the tab container
        $tab1.append(clonedFAQ);
      }
      // get the location name
      var locationName = location.col0;
      // get the list matching the current element and append a list item
      var currentList = $('#' + categoryID + '-links ul');
      currentList.append(createMapLink(location));
      // add to locations object
      locations[makeID(locationName)] = location;
      // get the 'show all' link and add an event handler to drop a pin
      var showAllLink = $('#' + categoryID + '-show-all');
      showAllLink.click(function() {
        //  remove any other markers
        clearOverlays();

        // create marker and infobox
        var myMarker = createMapMarker(location);

        // store the current marker so that we can clear it later
        markersArray.push(myMarker.marker);
        // add the current location to the boundaries so we can scale the viewport
        mapBounds.extend(myMarker.location);
        // remove street view overlay, if any, and set null position to put pegman back on his perch
        clearStreetView();

        // Add the marker to the map
        var myTimeout = 200 + (Math.random() * 800);
        setTimeout(function() {
          myMarker.marker.setMap(map);
          // scale the viewport to fit all the points
          map.fitBounds(mapBounds);
        }, myTimeout);
        return false; // stop default link behaviour
      });
      // Add building (col5) to buildingsArray
      if (location.col5) {
        var l = location.col5.split(';');
        location.col5 = l;
        buildingsArray = buildingsArray.concat(l)
      }
      if(key === locationRows.length-1) {
        initialiseMap();
        initialiseSearch();
      }
    });
  }

  // create a marker. returns and object with a marker, a location and an infobox property
  function createMapMarker(location) {

    // add the current location as a pin to be dropped when the 'show all' link is clicked
    // create a location object
    var markerLocation = new google.maps.LatLng(location.col2, location.col3);
    // create a map marker
    var myMarker = new google.maps.Marker({
      clickable: true,
      position: markerLocation,
      title: location.col0,
      animation: google.maps.Animation.DROP
    });

    google.maps.event.addListener(myMarker, "click", function(e) {
      $body.trigger('map:click');
      map.panTo(markerLocation);
    });

    return {
      marker: myMarker,
      location: markerLocation
    };
  }

  // create a link and add it to list
  function createMapLink(locationValues) {
    // create a new list item
    var listItem = document.createElement('li');
    // create a link element with no href
    var link = document.createElement('a');
    link.href = '#'+makeID(locationValues.col0);
    // set the link text to the location name
    link.innerHTML = locationValues.col0;
    // add onclick behaviour to drop a pin
    link.onclick = function() {
      showMarker(locationValues);
    };
    // add the link to the list item
    listItem.appendChild(link);
    // return the list item to be added to the list
    return listItem;
  }

  // Show marker on map
  function showMarker(locationValues) {

    $body.trigger('map:click');

    var myMarker = createMapMarker(locationValues);

    google.maps.event.addListener(myMarker.marker, 'click', function() {
      if (isLive === true) {
        pageTracker._trackEvent('Map', 'Click pin', locationValues.col1 + ' - ' + locationValues.col0);
      }
    });
    //  remove any other markers
    clearOverlays();
    // store this marker so we can remove it later
    markersArray.push(myMarker.marker);
    // remove street view overlay, if any, and set null position to put pegman back on his perch
    clearStreetView();
    // centre on location
    map.panTo(myMarker.location);
    // drop the pin
    myMarker.marker.setMap(map);
    // track the action in Analytics if running on live site
    if (isLive === true) {
      pageTracker._trackEvent('Map', 'Drop pin', locationValues.col1 + ' - ' + locationValues.col0);
    }

    return myMarker;

  }

  // remove any existing overlay markers
  function clearOverlays() {
    if (markersArray) {
      for (var i = 0; i < markersArray.length; i++) {
        markersArray[i].setMap(null);
      }
    }
  }
  // remove street view overlay, if any
  function clearStreetView() {
    if (map.getStreetView().getVisible()) {
      map.getStreetView().setVisible(false);
      map.streetView.setPosition(new google.maps.LatLng(0, 0));
    }
  }
  // make id-friendly-name (N.B. number can't be first character)
  function makeID(str) {
    return str.replace(/[^A-Za-z]+/g, '-').toLowerCase();
  }

  function makeDataURL() {
    var jsonURL;
    if (isLive === true) {
      var protocol = (("https:" == document.location.protocol) ? "https://" : "http://");
      jsonURL = protocol + "www.york.ac.uk/about/maps/campus/data/locations.json";
    } else {
      // jsonURL = 'locations.json';
      jsonURL = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20csv%20where%20url%3D%22https%3A%2F%2Fdocs.google.com%2Fspreadsheet%2Fpub%3Fhl%3Den_GB%26hl%3Den_GB%26key%3D0AumxFaPyjySpdERqbE1KNXpDd1NkMzd1NVdUaEplWHc%26single%3Dtrue%26gid%3D0%26output%3Dcsv%22&format=json&diagnostics=true'
    }
    return jsonURL;
  }

  function initialiseSearch() {
    $('#room-search-form').submit(function(e) {
      e.preventDefault();
      $body.trigger('map:click');
      // Add spinner to button
      $('#room-search-submit').html('<img src="images/loading.gif" alt="Loading..." style="vertical-align:middle;">');
      roomMessage(false);
      var roomValue = $('#room-search-value').val();
      var matchedLocation = searchLocations(roomValue);
      // console.log(matchedLocation);
      if(matchedLocation === false) {
        roomMessage('<strong>Sorry, no results found.</strong> Make sure you have entered a room number (eg \"H/G/21\") rather than the name of a room or building.');
        if (isLive === true) {
          pageTracker._trackEvent('Map', 'Room Code Search', roomValue+' failed (not valid room code)');
        }
        return;
      }
      var noMatch = true;
      $.each(locations, function(i, location) {
        if (location.col5 === null) return;
        if ($.inArray(matchedLocation.building, location.col5) > -1) {
          noMatch = false;
          location.search = roomValue;
          location.col6 = matchedLocation;
          callRoomAPI(roomValue, location);
          return false;
        }
      });
      if (noMatch === true) {
        roomMessage('<strong>Sorry, no results found.</strong> Please double check the code you entered.');
        if (isLive === true) {
          pageTracker._trackEvent('Map', 'Room Code Search', roomValue+' failed (no matching building)');
        }
        // console.log('There was no match for the building code so there is no pin to drop :(')
      }
    })
  }

  // Calls the room API and displays markers/error messages as appropriate
  function callRoomAPI(roomValue, location) {
    //console.log(location);
    // Make call to room API
    var roomAPIRoot = 'https://www.york.ac.uk/api/campus/rooms/';
    $.getJSON(roomAPIRoot+roomValue, function(data) {
      //console.log('API call succeeded', data);
      roomMessage(false);
      // Add new content to marker infobox
      location.name = data.name;
      location.content = $('<p>').text(data.directions);
      // var thisLocation = showMarker(location);
      var messageContent = $('<h4>').text(data.name)
                                    .add($('<p>').text(data.directions))
                                    .add($('<p>').html($('<a href="#" class="cta">').text('Show building location').click(function(e) {
        e.preventDefault();
        showMarker(location);
      })));
      roomMessage(messageContent);
      // Track search term
      if (isLive === true) {
        pageTracker._trackEvent('Map', 'Room Code Search', location.search+' succeeded');
      }
    }).fail(function() {
      // console.log('API call failed');
      // Try again with slashes added
      var newRoomCode = makeSensibleRoomCode(location);
      if (newRoomCode !== roomValue) {
        callRoomAPI(newRoomCode, location);
      } else {
        // console.log(location);
        showMarker(location);
        roomMessage('<p>We don\'t have directions for that room, but it looks like it might be in '+location.col0+'. Please double check the room code before you go.</p>');
        // Track search term
        if (isLive === true) {
          pageTracker._trackEvent('Map', 'Room Code Search', location.search+' failed (room code not found)');
        }
      }
    });

  }

  // Returns room object with building, block, floor and number keys
  function searchLocations(roomValue) {

    var room = {};
    var roomDetails;
    var buildingDetails;
    var roomParts = roomValue.toUpperCase().split('/');

    // With slashes: format BBBB/LLLL where B is Building and L is block
    if (roomParts.length > 1) {
      room.building = roomParts[0];
      if (roomParts.length > 2) {
        // there's a slash between block and room!
        room.block = roomParts[1];
        roomDetails = getRoom(roomParts[2]);
      } else {
        var roomPartsParts = roomParts[1].trim().match(/^([A-Za-z]{0,4})([0-9\&]*[A-Za-z-]{0,8})$/);
        // If only one number, it's part of block e.g.GSH/B1 (Goodricke Oliver Sheldon Court Block B1)
        if(!roomPartsParts) return false;
        if (roomPartsParts[2].length === 1) {
          room.block = roomParts[1];
          roomDetails = { floor: false, number: false };
        } else {
          room.block = roomPartsParts[1] == "" ? false : roomPartsParts[1] ;
          // Otherwise it's a room number
          roomDetails = getRoom(roomPartsParts[2]);
        }
      }
    } else {
      // If no slashes, match Building code+room code
      roomParts = roomValue.match(/^([A-Za-z]*)([0-9\&]*[A-Za-z-]{0,8})$/);
      if(!roomParts) return false;
      buildingDetails = getBuilding(roomParts[1]);
      roomDetails = getRoom(roomParts[2]);
      room.building = buildingDetails.building;
      room.block = buildingDetails.block;
      if (buildingDetails.extra !== false) {
        roomDetails.floor = buildingDetails.extra;
      }
    }
    room.floor = roomDetails.floor;
    room.number = roomDetails.number;
    return room;
  }

  function getBuilding(building) {
    var r = {
      building: building,
      block: false,
      extra: false
    };
    if (building == 'YNiC') return r;
    building = building.toUpperCase();
    //console.log(building, buildingsArray, $.inArray(building, buildingsArray));
    if (building.length === 1 || $.inArray(building, buildingsArray) > -1 ) { // e.g. V045 or ARC
      r.building = building;
      return r;
    }
    // Block is (usually!) last digit (excpetions EXT, CSTS)
    var isExt = building.match(/^([A-Z]*)(EXT|CSTS|AM)([A-Z]*)$/);
    if (isExt) {
      r.building = isExt[1];
      r.block = isExt[2]; // This will be 'EXT' or 'CSTS'
      r.extra = isExt[3] || false; // If set, this should be added to the room
      return r;
    }
    r.building = building.substr(0, building.length-1);
    r.block = building.substr(building.length-1, 1);
    return r;
  }

  function getRoom(room) {
    // For room code: format FRR(S) where F is floor, RR is room number and S is optional space signifier
    // Exceptions P/1X, codes with no number (e.g. YNiC)
    var r = { floor: false, number: false };
    var roomDetails = room.match(/^([0-9]{1})([0-9\&-]*[A-Za-z]{0,4})$/);
    if (roomDetails === null) return r;
    if (roomDetails[2] === '') {
      r.number = roomDetails[1];
    } else {
      r.floor = roomDetails[1];
      r.number = roomDetails[2];
    }
    return r;
  }

  function makeSensibleRoomCode(location) {
    var l = location.col6;
    if (!l) return false;
    var r = l.building;
    if (l.block) r+= '/'+l.block;
    if (l.floor || l.number) r+= '/';
    // Remove slash for:
    // King's Manor (e.g. K/G07)
    if (l.building === 'K' && l.block === 'G') r = r.slice(0,-1);
    // Hes Hall Ground floor (e.g. H/G16)
    if (l.building === 'H' && l.block === 'G') r = r.slice(0,-1);
    if (l.building === 'H' && l.block === 'B') r = r.slice(0,-1);
    if (l.building === 'H' && l.block === 'EXT') r = r.slice(0,-1);
    // GNU/X01
    if (l.building === 'GNU' && l.block === 'X') r = r.slice(0,-1);
    // MSD/B06
    if (l.building === 'MSD' && l.block === 'B') r = r.slice(0,-1);
    if (l.floor) r+= l.floor;
    if (l.number) r+= l.number;
    return r;
  }

  function roomMessage(message) {
    var $messageBox = $('#room-search-message');
    if (message === false) return $messageBox.removeClass('active');
    $('#room-search-submit').html('Search');
    $messageBox.html(message).addClass('active');
  }

  init();

  // Testing facilty
  if (!isLive) {
    window.test = {
      singleRoom: function(roomCode) {
        var noSlashCode = roomCode.replace(/\//g, ''),
            location = {
              col6: searchLocations(noSlashCode)
            },
            fixedCode = makeSensibleRoomCode(location);
        return {
          success: (roomCode === fixedCode),
          roomCode: roomCode,
          noSlashCode: noSlashCode,
          fixedCode: fixedCode
        }
      },
      allRooms: function() {
        var that = this;
        $.getJSON('rooms.json', function(data) {
          var l = data.length, i = 0, errorCount = 0, successCount = 0;
          for (;i < l; i++) {
            var r = that.singleRoom(data[i].name)
            if (r.success === true) {
              successCount++;
              //console.info((i+1)+': '+r.fixedCode+' matches original code '+r.roomCode+' (success #'+successCount+')');
            } else {
              errorCount++;
              // console.warn((i+1)+': '+r.fixedCode+' does not match original code '+r.roomCode+' (error #'+errorCount+')');
            }
            if (i === l-1) {
              // console.info('There were '+successCount+' correct room guesses');
              // console.warn('There were '+errorCount+' incorrect room guesses');
            }
          }
        });
        return 'Testing room codes...';
      }
    }
  }

});

if (!String.prototype.trim) {
  (function() {
    // Make sure we trim BOM and NBSP
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    String.prototype.trim = function() {
      return this.replace(rtrim, '');
    };
  })();
}
