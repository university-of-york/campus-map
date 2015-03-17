 $(document).ready(function(){
	//work out how far down the hierarchy we are:
	// - find all the ul elements with class that starts with "multilevel-linkul-" and put them in an array
	// - count the array size
	var arr = new Array;
	arr = $("#lhcolumn #nav ul[class^='multilevel-linkul-']"); 
	var highestMulti = arr.length - 1; 
	var parentMulti = highestMulti - 1; 
	
	if (highestMulti>=0) {
		$("li .currentbranch"+highestMulti+",  li .currentbranch"+highestMulti+" a").addClass("parent"); 
		$("#nav ul.multilevel-linkul-"+highestMulti+" li a,   #nav ul.multilevel-linkul-"+highestMulti+" li span").addClass("children"); 
	}
	
	// special case for top level menu items that have no children
	if (highestMulti<0) {
		$(".currentbranch0").addClass("parent"); 
	}
	
	//find all the spans that contain a link, remove the right hand padding and left positioning
	$("#lhcolumn #nav span>a").each(function() {
		$(this).parent().css("padding","0"); 
		$(this).css("left","0");
	}); 

	//Style quotations
	$("blockquote.quote p:first-child").addClass("quotation"); 
	$("blockquote.quote p:last-child").addClass("attribution"); 
	
	//zebra stipes for tables
	$("table.zebra tbody tr:nth-child(even)").addClass("even");
	
	//zebra stripes for upcoming events
	$("#mdcolumn #upcomingevents>div:nth-child(odd)").addClass("odd");	
	
	//Staff profiles
	$("#profile, #research, #publications, #teaching, #external").wrapAll('<div id="tabs"></div>'); 	
	$('#profile').before('<ul class="tabNavigation"><li><a href="#profile">Profile</a> </li>\n</ul>'); 
	
	var linkList = ''; 
	if ( $('#research').length > 0 ) {
		linkList += '<li><a href="#research">Research</a> </li>\n '; 
	}
	if ( $('#publications').length > 0 ) {
		linkList += '<li><a href="#publications">Publications</a> </li>\n '; 
	}
	if ( $('#teaching').length > 0 ) {
		linkList += '<li><a href="#teaching">Teaching</a> </li>\n '; 
	}
	if ( $('#external').length > 0 ) {
		linkList += '<li><a href="#external">External activity</a> </li>'; 
	}
	
	$('ul.tabNavigation').append(linkList); 
	$('#publications-full').hide().before('<a href="#publications-full" id="showfull">Show full list of publications </a>'); 
	$('a#showfull').click(function(){
		$('#publications-full').show(); 
	}); 
	
	//Tabbed content
	$('div#tabs > ul').addClass('tabNavigation');
	var tabContainers = $('div#tabs > div');
	
	tabContainers.hide().filter(':first').show();
	$('#tabs h2.tab').hide(); 
	
	$('div#tabs ul.tabNavigation a').click(function () {
			tabContainers.hide();
			tabContainers.filter(this.hash).show();
			$('div#tabs ul.tabNavigation a').removeClass('selected');
			$(this).addClass('selected');
		   return false;
	}).filter(':first').click();
	
	//Frequently asked questions
	var qs = $(".q"); 
	var as = $(".a"); 
	
	as.hide(); 
	qs.wrapInner('<a href="#"></a>'); 
	qs.click(function(){
		$(this).next().slideToggle("fast"); 
		return false; 
	}); 
	
	//add a "show all" link before the questions
	$(".faq:first").before('<p class="showhide"><a href="#" class="show">Show all</a> / <a href="#" class="hide">Hide all</a></p>'); 
	$("a.show").click(function(){
		as.show(); 
		return false; 
	}); 
	$("a.hide").click(function(){
		as.hide(); 
		return false; 
	}); 
	
	//Sortable tables
	if ( $("table.sortable").length > 0){
		$.getScript("/media/global/scripts/jquery.tablesorter.metadata.min.js",function(){
			$("table.sortable").tablesorter(); 
		});
	}
	if ( $("table.sortable-zebra").length > 0){
		$.getScript("/media/global/scripts/jquery.tablesorter.metadata.min.js",function(){
			$("table.sortable-zebra").tablesorter({
				widgets: ['zebra']
			}); 
		});
	}
	
	//Calendar popup
	$("a#calendar-feed").click(function(){
		$("#calendar-feed-menu").toggle(); 
		return false; 
	}); 
	
	$("a#close-calendar").click(function(){
		$("#calendar-feed-menu").toggle(); 
		return false; 
	}); 
	
	
	//Sort function
	jQuery.fn.sort = function() {  
		return this.pushStack([].sort.apply(this, arguments), []);  
    };  
	function sortAlpha(a,b){  
		return a.id > b.id ? 1 : -1;  
    };  
	
	//Sort PhD listing
	$('#phdlist div').sort(sortAlpha).appendTo("#phdlist");  
	//Sort staff listing
	$('#stafflist div').sort(sortAlpha).appendTo("#stafflist");  
	
	//Forms
	$('#mdcolumn input[type=radio]').addClass('radio');
	$('#mdcolumn input[type=checkbox]').addClass('checkbox');
	$('#mdcolumn input[type=text]').addClass('text');
	$('#mdcolumn input[type=textarea]').addClass('textarea');
	
	if ($("p.instruct").length == 0) {
		$("body").addClass("noI"); 		
	}; 
	
	$(".text,textarea,.radio,.checkbox,select").focus(function(){
		$("form li").removeClass("focused"); 
		$(this).closest("li").addClass("focused"); 
	});
	
	if ( $("input.email, input.required, input.digits, input.number").length > 0){
		$.getScript("http://www.york.ac.uk/media/global/scripts/jquery.validate.min.js",function(){
			 $("#content-container form").validate();
		});
	}
	
	//Remove breadcrumb from header files
	$("#breadcrumb li:last-child:contains('Header')").remove(); 
	
	//Height correction for media player
	var videoIframes = $("iframe.video"); 
	videoIframes.each(function() {
		var videoHeight = $(this).height(); 
		videoHeight = videoHeight + 50; 
		$(this).height(videoHeight); 
	}); 
 });