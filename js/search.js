$(function() {
  var $searchForm = $('#funnelback-search');
  var $searchQuery = $('#search-query');
  var $autocompleteList = $('.c-autocomplete__list', $searchForm);

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

  // Update autosuggest on keyup
  $searchQuery.on('keyup', function(e) {
    var $autocompleteItems = $('.c-autocomplete__item', $autocompleteList);
    // Check if it's up, down, left, right, enter or tab
    var keyCode = e.keyCode;
    var rStop = false;
    // console.log(keyCode);
    switch (keyCode) {
      // Return
      // This never gets fired - the submit seems to occur first
      case 13:
        // If there's a selected option, update value
        var selectedItem = $autocompleteItems.filter('.is-selected');
        if (selectedItem.length > 0) {
          var selectedValue = selectedItem.text();
          console.log('Selected value is '+selectedValue);
          $searchQuery.value(selectedValue);
        }
        rStop = true;
        $searchForm.submit();
        break;
      case 38:
        selectItem('up');
        rStop = true;
        break;
      case 40:
        selectItem('down');
        rStop = true;
        break;
    }
    if (rStop === true) return false;

    $autocompleteList.empty();
    var searchTerm = $searchQuery.val();
    searchTerm = encodeURIComponent(searchTerm).replace(/%20/g, '+');
    var searchURL = 'https://york.funnelback.co.uk/s/search.html?collection=york-uni-campusmap&form=geojson&query=';
    $.getJSON(searchURL+'*'+searchTerm+'*'+'&callback=?', function(data) {
      console.log(data);
      if (data.resp && data.resp.status && data.resp.status === 'ERROR') return false;
      $.each(data.features, function(i, feature) {
        var featureTitle = feature.properties.title;
        var featureItem = $('<li>').addClass("c-autocomplete__item");
        var featureLink = $('<a>').addClass("c-autocomplete__link")
                                     .attr("href", '#'+featureTitle)
                                     .html(featureTitle.replace(searchTerm, '<strong>'+searchTerm+'</strong>'))
                                     .appendTo(featureItem);
        $autocompleteList.append(featureItem);

      });
    });
  });

  // Form submit
  $searchForm.on('submit', function(e) {
    e.preventDefault();
    // Add selected item to value
    var $autocompleteItems = $('.c-autocomplete__item', $autocompleteList);
    var selectedItem = $autocompleteItems.filter('.is-selected');
    if (selectedItem.length > 0) {
      var selectedValue = selectedItem.text();
      console.log('Selected value is '+selectedValue);
      $searchQuery.val(selectedValue);

    }
    var searchTerm = $searchQuery.val();
    // Clean up search
    searchTerm = searchTerm.trim();
    if (searchTerm === '') return false;
    encodedSearchTerm = encodeURIComponent(searchTerm).replace(/%20/g, '+');
    var searchURL = 'https://york.funnelback.co.uk/s/search.html?collection=york-uni-campusmap&form=geojson&query=';
    $.getJSON(searchURL+encodedSearchTerm+'&callback=?', function(data) {
      console.log(data);
      if (typeof data.error !== 'undefined') {
        console.log('Error!');
        return false;
      }
      var $searchResults = $('#search-results');
      var resultCount = data.features.length;
      $searchResults.empty().append($('<h3>').html('Your search for <em>'+searchTerm+'</em> returned '+resultCount+' result(s).'));
      if (resultCount > 0) {
        var $ul = $('<ul>');
        $.each(data.features, function(i, result) {
          console.log(result);
          var resultText = result.properties.title+' ('+result.geometry.coordinates[0]+', '+result.geometry.coordinates[1]+')';
          $ul.append($('<li>').text(resultText));
        });
        $searchResults.append($ul);
        $autocompleteList.empty();
      }
    });
  });


});
