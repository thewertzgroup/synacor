/* ===================================================
 * synacor.js v0.0.1
 * https://github.com/thewertzgroup/synacor.git
 * ===================================================
 * Copyright 2013 The Wertz Group, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


/* ===================================================
 *
 * Define application specific variables
 *
 * ========================================================== */

// Flickr API parameters
var service  		= 'http://api.flickr.com/services/rest/';
var method   		= 'flickr.photos.search';
var api_key  		= 'caaeaba3442d5b600c67acdf3ff295d2';
var tags     		= '';
var per_page 		= 9;
var page     		= 1;
var format   		= 'json';
var nojsoncallback	= 1;

// Help with pagination
var current_page	= 1;
var max_pages		= 1;

// Error handling and debug logging
var error			= false;
var logging_enabled = false;

	
// 
// Define the Flickr Photo Backbone 'model':  *Model* --> View --> DOM
// 
// Could define events on this model here if necessary.
//
var Photo = Backbone.Model.extend({
	events: {}
});


//	
// Define the Flickr Photo Backbone 'view': Model --> *View* --> DOM
// 
//  - Prepare to pass in the element when creating a new view to bind
//    directly to the DOM element.
//  - Create a template to create the views from based on model data.
//
var PhotoView = Backbone.View.extend({
	el: '',
	
	template : _.template("<img title='<%= title %>' src='http://farm<%= farm %>.staticflickr.com/<%= server %>/<%= id %>_<%= secret %>_m.jpg'>"),

	initialize: function(){
		this.model.on('change', this.render, this);
	},	
	
	events: {},
	
	render: function(){
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
});


//
// Define a Backbone 'collection' of Flickr Photos
// 
//  - API parameters will be passsed in on data object during fetch.
//
var Photos = Backbone.Collection.extend({
	url: 'http://api.flickr.com/services/rest/',
	model: Photo
});


//
// Create an instance of the new collection.
//
var photos = new Photos();


		
/* ===================================================
 *
 * Define event handlers
 *
 * ========================================================== */

//
// Could add events to handle changes to collection.
//
photos.on('add',function(photo){});
photos.on('remove',function(photo){});
photos.on('reset',function(){});


//
// Add 'click' event handler to the 'first page' link.
//
$('#first_page').click(function(){
    if ($(this).hasClass('disabled')) return false;

	current_page = 1;
	fetchFlickr();
	disablePreviousLinks();
	if (current_page < max_pages) enableNextLinks();
});


//
// Add 'click' event handler to the 'last page' link.
//
$('#last_page').click(function(){
    if ($(this).hasClass('disabled')) return false;

	current_page = max_pages;
	fetchFlickr();
	disableNextLinks();
	if (max_pages > 1) enablePreviousLinks();	
});


//
// Add 'click' event handler to the 'next page' link.
//
$('#next_page').click(function(){
    if ($(this).hasClass('disabled')) return false;
	
    current_page++;
	
    if (current_page > max_pages) {
		showError('You have exceeded the maximum number of pages.');
		current_page = max_pages;
		return false;
	} else {
		fetchFlickr();
	}
	
	if (current_page > 1 && $('#previous_page').hasClass('disabled')){
		enablePreviousLinks();
	}
	
	if (current_page == max_pages) {
		disableNextLinks();
	}	
});

//
// Add 'click' event handler to the 'previous page' link.
//
$('#previous_page').click(function previousPage(){
    if ($(this).hasClass('disabled')) return false;

    current_page--;

	if (current_page < 1) {
		showError('You are at the beginning of the list.');
		current_page = 1;
		return false;
	} else {
		fetchFlickr();
	}
	
	if (current_page < max_pages && $('#next_page').hasClass('disabled')){
		enableNextLinks();
	}
	
	if (current_page == 1) {
		disablePreviousLinks();
	}
});

	
/* ===================================================
 *
 * Define application functions
 *
 * ========================================================== */

/**
 * Fetch photos from the Flickr REST API:
 *  - Will execute AJAX request for JSON data.
 *  - Sets success handler and error handler.
 *  
 *  @param None
 *  @returns None
 */
function fetchFlickr() {
		
	photos.fetch({
		data: $.param({method: method, api_key: api_key, page: current_page, per_page: per_page, tags: tags, format: format, nojsoncallback: nojsoncallback }),
		
		reset: true,
		
		success: function (collection, resp, options) {
			if ('ok' == resp.stat) {
				if (true == error) {
					clearError();
					error = false;
				}
				
				max_pages		= resp.photos.pages;
				current_page	= resp.photos.page;
				$('#current_page').html(current_page);
				
				log(resp.photos);
				
				// I need to be able to render view on success.
				photos.reset(resp.photos.photo);
				
				var count = 1;
				photos.forEach(function(photo){
					log(photo);
					var photoView = new PhotoView({el: '#photo_' + count, model: photo});
					photoView.render();
					count++;
				});
				
			} else if ('fail' == resp.stat) {
				showError('Flickr is unavailable right now!!');
				error = true;
			} else {
				showError('Something went horribly wrong with Flickr request!!');
				error = true;
			}
			
			if (current_page < max_pages) {
				$('#next_page').removeClass('disabled').addClass('enabled');
				$('#last_page').removeClass('disabled').addClass('enabled');
			}
			
		},

		error: function() {
			alert('Fetch error: ' + arguments);
			showError('Something went horribly wrong with service request!!');
			error = true;
		}
	});
}

	
/**
 *  Write out the contents of the object to the error DIV as JSON.
 *  
 *  @param {object} object The object to be seriazlied and logged.
 *  @return None
 */
function log(object){
	if (logging_enabled) {
		$('#log').append(JSON.stringify(object));
	}
}


/**
 * Search Flickr for photos containing the given category / tags
 * 
 * @param {Input} input Input DOM element containing the tags to be searched for.
 * @return None
 */
function searchFlickr(input){
	tags = input.value;
	
	// Replace spaces with commas, and filter out non-alpha numeric
	tags = tags.replace(/ /g,",");
	tags = tags.replace(/[^A-Za-z0-9,]/g,"");

	current_page=1;
	fetchFlickr();
}


/**
 * Enable the "Previous" and "First" links for page navigation.
 * 
 * @param None
 * @return None
 */
function enablePreviousLinks(){
	$('#previous_page').removeClass('disabled').addClass('enabled');	
	$('#first_page').removeClass('disabled').addClass('enabled');	
}


/**
 * Disable the "Previous" and "First" links for page navigation.
 * 
 * @param None
 * @return None
 */
function disablePreviousLinks(){
	$('#previous_page').removeClass('enabled').addClass('disabled');
	$('#first_page').removeClass('enabled').addClass('disabled');
}


/**
 * Enable the "Next" and "Last" links for page navigation.
 * 
 * @param None
 * @return None
 */
function enableNextLinks(){
	$('#next_page').removeClass('disabled').addClass('enabled');
	$('#last_page').removeClass('disabled').addClass('enabled');	
}


/**
 * Disable the "Next" and "Last" links for page navigation.
 * 
 * @param None
 * @return None
 */
function disableNextLinks(){
	$('#next_page').removeClass('enabled').addClass('disabled');
	$('#last_page').removeClass('enabled').addClass('disabled');
}

/**
 * Show error warning to the user with hover message.
 * 
 * @param {string} msg The message to be displayed when user hovers over warning.
 * @return None
 */
function showError(msg){
	var html = "<img class='error' src='img/yellow-warning-sign.png' title='" + msg + "'/>";
	$('#error').append(html);
}


/**
 * Clear error warning from screen.
 * 
 * @param None
 * @return None
 */
function clearError(){
	$('#error').html('');
}
