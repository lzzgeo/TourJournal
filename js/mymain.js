/*! main js */

var GOOGLE_API_KEY	= "AIzaSyAQuYu169H8bwAGnAk6BY2pg3LcfPllq7Q";
var GOOGLE_API_URL_PRE = "https://maps.googleapis.com/maps/api/directions/json?KEY=" + GOOGLE_API_KEY;

var CLIENT_ID 		= "RNQUQH4BIXGH44HXXWD1ZAUOTFRLE03HIVZ3REHT4KLPYPGM";
var CLIENT_SECRET 	= "0Q3TWW4VZ2QLTCM4UCL2ZH4FDM2INLR0LEARPONFQAUN25NA";
var PUSH_SECRET 	= "VWBMJ4PQW20GSNKGARNW2PVQO5L2CO0SYV254PPP5ANLUCIO";

var CLIENT_CONFIG	= "&client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET;
var SEARCH_URL_PRE  = "https://api.foursquare.com/v2/venues/search?&v=20170119&m=foursquare&limit=10" + CLIENT_CONFIG;
var EXPLORE_URL_PRE = "https://api.foursquare.com/v2/venues/explore?&v=20170119&m=foursquare&limit=10" + CLIENT_CONFIG;

var URL_CATEGORIES 	= "https://api.foursquare.com/v2/venues/categories?&v=20170207" + CLIENT_CONFIG;
var mymap;
var search_limit = 10;

var g_categories = [];
var g_search_results = [];	// venues searched with key word
var g_layer_searchedMarks;	// show the searched results with marks
var g_journal_venues = [];	// the venues that the traveler will visit.
var g_layer_journalMarks;	// show stops of a journal
var g_layer_journalPath;	// show the path of a journal

var g_explore_results = [];	// venues explored with key word
var g_layer_exploreMarks;	// show the results nearby stops of the tour
var g_recommended_venues = [];	// recommended vennues around stops
var g_layer_recommendedMarks;	// show recommended vennues around stops

/**
	@brief init the map, with all layers( journal marks, journal path, searched results etc.)
*/
function createMap()
{
	 mymap = L.map('mapid').setView([-43.48898, 172.54045], 13);

	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(mymap);

	g_layer_searchedMarks = L.layerGroup();
    g_layer_searchedMarks.addTo(mymap);
    
	g_layer_exploreMarks = L.layerGroup();
    g_layer_exploreMarks.addTo(mymap);
    
	g_layer_recommendedMarks = L.layerGroup();
    g_layer_recommendedMarks.addTo(mymap);
    
    
	g_layer_journalMarks = L.layerGroup();
    g_layer_journalMarks.addTo(mymap);
    
    g_layer_journalPath = L.polyline([], {
    	color: 'blue',
    	weight: 3,
    	opacity: 0.5,
    	smoothFactor: 1
    });
    g_layer_journalPath.addTo(mymap);
}

/**
	@brief add all results onto the map as marks. and make sure the popup can show a bit more information and the link to detailed page.
*/
function showResult(  )
{
	g_layer_searchedMarks.clearLayers();
	
	var mark_index = 0;
  	for ( var i=0; i<g_search_results.length; i++ )
	{
		var _venue 	= g_search_results[i];
		var _vName 	= _venue['name'];
		var _vID 	= _venue['id'];
		var loc 	= _venue["location"];
		var _addr 	= loc['address'];
		
		var _vUrl	= "https://foursquare.com/v/" + _vName + "/" + _vID + "?ref=" + CLIENT_ID;
		if ( typeof(_addr) == "undefined" )
			_addr = "";
		
		var v_html = "<div>"
			+ "<a href='" + _vUrl + "'target='_blank'> <strong>" + _vName + "</strong></a></br>"
			+ _addr + "</br>"
			+ "<button id='btn_add_to_journal' class='btn-add-to-journal' venue_id='" + _vID + "'>Add To Journal</button>"
			+ "</div>";

		 var myIcon = L.ExtraMarkers.icon({
		    icon: 'fa-number',
		    markerColor: 'blue',
		    shape: 'circle',
		    prefix: 'fa',
		    number: ++mark_index
		});
		L.marker([loc["lat"], loc["lng"]],{icon:myIcon, opacity:0.8, riseOnHover:true})
			.addTo(g_layer_searchedMarks)
			.bindPopup(v_html);
	}
}

/**
	@brief show shops, sights, restuarants nearby the stops of the tour
*/
function showNearbyExplore( )
{
	g_layer_exploreMarks.clearLayers();
	
	var id_cache = {};
	var mark_index = 0;
  	for ( var i=0; i<g_explore_results.length; i++ )
	{
		var groups = g_explore_results[i]["groups"];
		for ( var j=0; j<groups.length; ++j )
		{
			var items = groups[j]["items"];
			for ( var k=0; k<items.length; ++k )
			{
				var _venue 	= items[k]["venue"];
				var _vID 	= _venue['id'];
				if ( id_cache[_vID]==1 )
					break;
				else
					id_cache[_vID]=1;

				var _vName 	= _venue['name'];
				var loc 	= _venue["location"];
				var _addr 	= loc['formattedAddress'].join("<br/>");

				var _vUrl	= "https://foursquare.com/v/" + _vName + "/" + _vID + "?ref=" + CLIENT_ID;
				if ( typeof(_addr) == "undefined" )
					_addr = "";

				var v_html = "<div>"
					+ "<a href='" + _vUrl + "'target='_blank'> <strong>" + _vName + "</strong></a></br>"
					+ "<span style='font-weight:900, background-color:" + _venue['ratingColor'] + "'> rating :" + _venue['rating'] + "</span></br>"
					+ _addr + "</br>"
					+ "<button id='btn_add_to_nearby' class='btn-add-to-journal' venue_id='" + _vID + "'>Add To Nearby</button>"
					+ "</div>";

				 var myIcon = L.ExtraMarkers.icon({
				    icon: 'fa-number',
				    markerColor: 'green',
				    shape: 'circle',
				    prefix: 'fa',
				    number: ++mark_index
				  });
				L.marker([loc["lat"], loc["lng"]],{icon:myIcon, opacity:0.9, riseOnHover:true})
					.addTo(g_layer_exploreMarks)
					.bindPopup(v_html);
			}
		}
	};
}


/**
	@brief search the venues in the extent of current view.
*/
function generalSearch( key_word )
{
	var curr_bound 	= mymap.getBounds();
	var loc 		= curr_bound.getCenter();
	var bound_ne	= curr_bound.getNorthEast();
	var bound_sw	= curr_bound.getSouthWest();
	var _suff 		= "&ll=" + loc["lat"] + "," + loc["lng"] 
						+ "&sw=" + bound_sw["lat"] + "," + bound_sw["lng"] 
						+ "&ne=" + bound_ne["lat"] + "," + bound_ne["lng"] 
						+ "&query=" + key_word;
	var _url 		= SEARCH_URL_PRE + _suff;
	$.ajax({
        url: _url,
        dataType:'json',
        success: function (data) { 
	        g_search_results = data.response.venues;
	        showResult( ); 
        }
    });
}

/**
	@brief explore shops, sights, restuarants nearby the stops of the tour
*/
function nearbyExplore( cat )
{
	g_explore_results = [];
	
	var curr_bound 	= mymap.getBounds();
	var bound_ne	= curr_bound.getNorthEast();
	var bound_sw	= curr_bound.getSouthWest();

	// first try to find some nearby the stops in the extent of the window
	for ( var i=0; i<g_journal_venues.length; i++ )
	{
		var _venue 	= g_journal_venues[i];
		var loc 	= _venue["location"];
		
		if ( loc["lat"]<bound_sw["lat"] && loc["lat"]>bound_ne["lat"]
			&& loc["lng"]<bound_sw["lng"] && loc["lng"]>bound_ne["lng"] )
		{
			break;
		}

		var _suff 		= "&ll=" + loc["lat"] + "," + loc["lng"] 
							+ "&sw=" + bound_sw["lat"] + "," + bound_sw["lng"] 
							+ "&ne=" + bound_ne["lat"] + "," + bound_ne["lng"] 
							+ "&Section=" + cat;
		var _url 		= EXPLORE_URL_PRE + _suff;
		$.ajax({
	        url: _url,
	        dataType:'json',
	        success: function (data) { 
		        g_explore_results.push(data.response);
		        showNearbyExplore( );
	        }
	    });
	}

	// if get nothing, then try to find some others in the extent of the windows
	if ( g_explore_results.length<1 )
	{
		var loc 	= curr_bound.getCenter();
		var _suff 	= "&ll=" + loc["lat"] + "," + loc["lng"] 
						+ "&sw=" + bound_sw["lat"] + "," + bound_sw["lng"] 
						+ "&ne=" + bound_ne["lat"] + "," + bound_ne["lng"] 
						+ "&Section=" + cat;
		var _url 	= EXPLORE_URL_PRE + _suff;
		$.ajax({
		    url: _url,
		    dataType:'json',
		    success: function (data) { 
		        g_explore_results.push(data.response);
		        showNearbyExplore( );
		    }
		});
	}
}

/**
	@brief show the longitude and latitude  of the current postion.
*/
function onMapClick(e) {
	var popup = L.popup();
	popup
        .setLatLng(e.latlng)
        .setContent( "You clicked the map at " + mymap.getCenter().toString() )
        .openOn(mymap);
}

/**
	@brief refresh the tour infomation: marks and path.
*/
function refresh_TourRoutes( )
{
	g_layer_journalMarks.clearLayers();
	var points_count = g_journal_venues.length;

	var mark_index = 0;
	var waypoints_param = [];
	var dir_param = {  travelMode: google.maps.TravelMode.DRIVING, optimizeWaypoints: true };
	for ( var i=0; i<g_journal_venues.length; i++ )
	{
		var _venue 	= g_journal_venues[i];
		var _vName 	= _venue['name'];
		var _vID 	= _venue['id'];
		var loc 	= _venue["location"];
		var _addr 	= loc['formattedAddress'].join("<br/>");
		
		// init the param for direction
		if ( 0==i )
			dir_param.origin = loc.lat + "," + loc.lng;
		else if ( 0!=i && g_journal_venues.length-1==i )
			dir_param.destination = loc.lat + "," + loc.lng;
		else{
			waypoints_param.push({
				location: loc.lat + "," + loc.lng,
				stopover: true
      		});
		}
		
		// init the mark
		var _vUrl	= "https://foursquare.com/v/" + _vName + "/" + _vID + "?ref=" + CLIENT_ID;
		if ( typeof(_addr) == "undefined" ) _addr = "";
		var v_html = "<div>"
			+ "<a href='" + _vUrl + "'target='_blank'> <strong>" + _vName + "</strong></a></br>"
			+ _addr + "</br>"
			+ "</div>";

		var myIcon = L.ExtraMarkers.icon({
		    icon: 'fa-number',
		    markerColor: 'pink',
		    shape: 'square',
		    prefix: 'fa',
		    number: ++mark_index
		});
		L.marker([loc.lat, loc.lng],{riseOnHover:true, icon: myIcon})
			.addTo(g_layer_journalMarks)
			.bindPopup(v_html);
	}
	
	
	if ( points_count<2 )
		return;

	if ( waypoints_param.length>0 )
		dir_param.waypoints = waypoints_param;

	var multipolyline = [];
	var directionsService = new google.maps.DirectionsService();
    directionsService.route(dir_param, function(result, status) {
    	
    	if ( status != google.maps.DirectionsStatus.OK )
    		return;
    	
    	for ( var i=0; i<result.routes.length; i++ )
    	{
    		var route = result.routes[i];
			var polyline = route["overview_polyline"];
			var path;
			if ( typeof(polyline)=="string" )path = google.maps.geometry.encoding.decodePath(polyline );
			else							 path = google.maps.geometry.encoding.decodePath( polyline["points"] );
			
			var points = [];
			for ( var j=0; j<path.length; ++j )
				points.push( L.latLng( path[j].lat(), path[j].lng() ) );

			multipolyline.push( points );
		}

		g_layer_journalPath.setLatLngs( multipolyline );
	});
}

/*
	refresh the recommended venues nearby the stops
*/
function refresh_TourNearby( )
{
	var mark_index = 0;
	for ( var i=0; i<g_recommended_venues.length; i++ )
	{
		var _venue 	= g_recommended_venues[i];
		var _vName 	= _venue['name'];
		var _vID 	= _venue['id'];
		var loc 	= _venue["location"];
		var _addr 	= loc['formattedAddress'].join("<br/>");
		var _vUrl	= "https://foursquare.com/v/" + _vName + "/" + _vID + "?ref=" + CLIENT_ID;
		if ( typeof(_addr) == "undefined" )
			_addr = "";

		var v_html = "<div>"
			+ "<a href='" + _vUrl + "'target='_blank'> <strong>" + _vName + "</strong></a></br>"
			+ "<span style='font-weight:900, background-color:" + _venue['ratingColor'] + "'> rating :" + _venue['rating'] + "</span></br>"
			+ _addr + "</br>"
			+ "</div>";

		var myIcon = L.ExtraMarkers.icon({
		    icon: 'fa-number',
		    markerColor: 'yellow',
		    shape: 'penta',
		    prefix: 'fa',
		    number: ++mark_index
		});
		L.marker([loc.lat, loc.lng],{riseOnHover:true, icon: myIcon})
			.addTo(g_layer_recommendedMarks)
			.bindPopup(v_html);
	}
}

/*
	@brief get all categories once at the beginning of the app
*/
function getAllCategories( ){
	$.ajax({
        url: URL_CATEGORIES,
        dataType:'json',
        success: function (data) { g_categories = data.response.categories; }
    });
}

/*
	@brief some stuff to do when initializing
*/
$(document).ready(function()
{
	getAllCategories();

	createMap();

	$( "#datepicker_from" ).datepicker( );
	$( "#datepicker_to" ).datepicker( );

	$(".search_button").button();
	$(".btn-nav-function").button();

	// search venues
	$('#txt_search').keypress(function(event){
		var keycode = (event.keyCode ? event.keyCode : event.which);
		if(keycode == '13')
			generalSearch( $("#txt_search").val() );
	});
	
	$("#btn_search").button().css("width", "80px");
	$("#btn_search").click(function(){ generalSearch( $("#txt_search").val() ); } );

	//remove all marks of results from the map
	$("#btn_clear_search_results").click( function( ){ g_layer_searchedMarks.clearLayers(); } );

	//remove all marks, and the path of journal tour from the map
	$("#btn_clear_journal").click( function( ){
		g_journal_venues = [];
		g_layer_journalMarks.clearLayers();
		g_layer_journalPath.setLatLngs([]);
	} );


	var temp = $("#nearby-cat").selectmenu( {width:"120px"} );

	$("#btn_nearby_explore").click( function( ){ 
		var val = $("#nearby-cat option:selected").text();
		nearbyExplore( val );
	});

	$("#btn_neary_clear_reults").click( function( ){ 
		g_explore_results = [];
		g_layer_exploreMarks.clearLayers();
	} );

	$("#btn_neary_clear_nearby").click( function( ){ 
		g_recommended_venues = [];
		g_layer_recommendedMarks.clearLayers();
	} );
	
	// add the venue into the joural as one stop
	$("#mapid").on('click', '#btn_add_to_journal', function() {
		
		var id = $("#btn_add_to_journal").attr("venue_id");
		for ( var i=0; i<g_search_results.length; i++ )
		{
			if (g_search_results[i]['id'] == id)
			{
				g_journal_venues.push( g_search_results[i] );
				break;
			}
		}
	
		refresh_TourRoutes( );
	});
	

	$("#mapid").on('click', '#btn_add_to_nearby', function() {
		
		var id = $("#btn_add_to_nearby").attr("venue_id");
		
		for ( var i=0; i<g_explore_results.length; i++ )
		{
			var groups = g_explore_results[i]["groups"];
			for ( var j=0; j<groups.length; ++j )
			{
				var items = groups[j]["items"];
				for ( var k=0; k<items.length; ++k )
				{
					var _venue = items[k]["venue"];
					if ( id==_venue['id'] )
					{
						g_recommended_venues.push( items[k]["venue"] );
						id = "FOUND";
						break;
					}
				}
				
				if (id == "FOUND")	break;
			}
			
			if (id == "FOUND")	break;
		}

		refresh_TourNearby( );
	});
});

