/* ===================================================
 * synacor.js v0.0.1
 * http://twitter.github.com/bootstrap/javascript.html#transitions
 * ===================================================
 * Copyright 2012 Twitter, Inc.
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

 // Only run after the DOM is finished loading:

//jQuery(document).ready(function() {


/**
 * Define application specific variables.
 */
var service  		= 'http://api.flickr.com/services/rest/';
var method   		= 'flickr.photos.search';
var api_key  		= 'caaeaba3442d5b600c67acdf3ff295d2';
var tags     		= '';
var per_page 		= 9;
var page     		= 1;
var format   		= 'json';
var nojsoncallback	= 1;

var cols			= 3;

var current_page	= 1;
var max_pages		= 1;

var error			= false;
var logging_enabled = false;

var Photo = Backbone.Model.extend({
	events: {}
});

var PhotoView = Backbone.View.extend({
	el: '',
	
	template : _.template("<img src='http://farm<%= farm %>.staticflickr.com/<%= server %>/<%= id %>_<%= secret %>_m.jpg'>"),

	initialize: function(){
		this.model.on('change', this.render, this);
	},	
	
	events: {},
	
	render: function(){
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
});

var Photos = Backbone.Collection.extend({
	url: 'http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=caaeaba3442d5b600c67acdf3ff295d2&per_page=9&tags=sunset&format=json&nojsoncallback=1',
	model: Photo
});

var photos = new Photos();

// Could add events to handle changes to collection.
photos.on('add',function(photo){});
photos.on('remove',function(photo){});
photos.on('reset',function(){});

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
				
				var count = 0;
				var row = 1;
				var col = 1;
				photos.forEach(function(photo){

					log(photo);
					var photoView = new PhotoView({el: '#photo_' + row + col, model: photo});
					photoView.render();

					count++;
					col < cols ? col++ : col=1;
					count % cols ? {} : row++;
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

function log(object){
	if (logging_enabled) {
		$('#log').append(JSON.stringify(object));
	}
}


function searchFlickr(input){
	tags = input.value;
	current_page=1;
	fetchFlickr();
}

function enablePreviousLinks(){
	$('#previous_page').removeClass('disabled').addClass('enabled');	
	$('#first_page').removeClass('disabled').addClass('enabled');	
}

function disablePreviousLinks(){
	$('#previous_page').removeClass('enabled').addClass('disabled');
	$('#first_page').removeClass('enabled').addClass('disabled');
}

function enableNextLinks(){
	$('#next_page').removeClass('disabled').addClass('enabled');
	$('#last_page').removeClass('disabled').addClass('enabled');	
}

function disableNextLinks(){
	$('#next_page').removeClass('enabled').addClass('disabled');
	$('#last_page').removeClass('enabled').addClass('disabled');
}

$('#first_page').click(function(){
    if ($(this).hasClass('disabled')) return false;

	current_page = 1;
	fetchFlickr();
	disablePreviousLinks();
	if (current_page < max_pages) enableNextLinks();
});

$('#last_page').click(function(){
    if ($(this).hasClass('disabled')) return false;

	current_page = max_pages;
	fetchFlickr();
	disableNextLinks();
	if (max_pages > 1) enablePreviousLinks();	
});

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

function showError(msg){
	var html = "<img class='error' src='img/yellow-warning-sign.png' title='" + msg + "'/>";
	$('#error').append(html);
}

function clearError(){
	$('#error').html('');
}
