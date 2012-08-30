/*jslint vars: true, browser: true */
/*global tiddlyweb, Backbone */
/*
 * A simple experiment to list the tiddlers in the current
 * space's public bag using backbone.js
 */
(function() {

	"use strict";

	var //root = this, // not yet used
		urlRoot = '/bags/' + tiddlyweb.status.space.name + '_public/tiddlers',
		Tiddler,
		Tiddlers,
		TiddlerView,
		TiddlerListView;

	/*
	 * A single tiddler. With idAttribute set, Backbone knows
	 * how to create URIs.
	 */
	Tiddler = Backbone.Model.extend({
		defaults: {
			title: '',
			tags: [],
			fields: {}
		},
		idAttribute: 'title',
		urlRoot: urlRoot,

		/*
		 * Construct the url for this tiddler, appending
		 * render=1 so we get the rendered text and .json
		 * to force the underlying ajax calls to behave.
		 */
		url: function() {
			return Backbone.Model.prototype.url.call(this) + ".json?render=1";
		}

	});

	/*
	 * All the tiddlers in one bag, which we can fetch.
	 */
	Tiddlers = Backbone.Collection.extend({
		model: Tiddler,
		url: urlRoot + '?sort=-modified'
	});


	/*
	 * View on a single tiddler.
	 */
	TiddlerView = Backbone.View.extend({

		initialize: function() {
			_.bindAll(this, 'render');
			this.model.bind('change', this.render);
		},

		/*
		 * When a tiddler body is clicked, close it
		 * with `toList`.
		 */
		events: {
			'click .tiddler-body': 'toList'
		},

		/*
		 * Remove the current tiddler view from the dom.
		 */
		toList: function(args) {
			$(args.currentTarget).remove();
		},

		/*
		 * Render this tiddler's text. Use render
		 * if present, otherwise fiddle to display text
		 * as a nice pre, or an image if it is one.
		 *
		 * Probably should use a template.
		 */
		render: function() {
			var tiddler = this.model,
				type = tiddler.get('type'),
				render = tiddler.get('render'),
				text = tiddler.get('text'),
				nest;

			if (render) {
				text = render;
			} else if (type && type.match(/^image/)) {
				text = '<img src="data:'
					+ type
					+ ';base64,'
					+ text + '">';
			} else if (type && type.match(/^text\/html/)) {
				text = '<pre>'
					+ text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
					+ '</pre>';
			} else {
				text = '<pre>' + text + '</pre>';
			}
			nest = $('<div>').html(text).attr('class', 'tiddler-body');
			this.$el.append(nest);
			return this;
		}
	});

	/*
	 * View of the tiddler collection as a list.
	 */
	TiddlerListView = Backbone.View.extend({

		/*
		 * If the collection is reset, refresh the view.
		 */
		initialize: function() {
			_.bindAll(this, 'render');
			this.collection.bind('reset', this.render);
		},

		/*
		 * If a single tiddler is clicked, show it.
		 */
		events: {
			'click li.tiddler-title': 'show'
		},

		/*
		 * Create a view on one tiddler and render it, only
		 * if not yet rendered.
		 */
		show: function(args) {
			var target = args.currentTarget,
				title = $(target).text(),
				model = this.collection.get(title);
			if ($(target).children('div').length === 0) {
				$(target).addClass('visited');
				var view = new TiddlerView({model: model, el: target});
				if (!model.has('text')) {
					model.fetch();
				} else {
					view.render();
				}
			}
			return false;
		},

		/*
		 * List all the tiddler titles.
		 */
		render: function() {
			var that = this,
				titles = this.collection.map(
					function(tiddler) {
						return tiddler.get('title');
					}
				);
			that.$el.empty();
			_.each(titles, function(title) {
				var liEl = $('<li>').addClass('tiddler-title').text(title);
				that.$el.append(liEl);
			});
			return this;
		}
	});

	/*
	 * Do the actual work to get started. That is:
	 * make a Tiddlers, add it is a view, using a particular
	 * element to contain it, and fetch the tiddlers.
	 */
	var view = new TiddlerListView({
		collection: new Tiddlers(),
		el: $('#tiddlers')[0]
	});
	view.collection.fetch();

}).call(this);
