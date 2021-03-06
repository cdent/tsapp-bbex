/*jslint vars: true, browser: true */
/*global tiddlyweb, Backbone */
/*
 * A simple experiment to list the tiddlers in the current
 * space's public bag using backbone.js
 */
(function() {

	"use strict";

	var root = this,
		Tiddler,
		Tiddlers,
		TiddlerView,
		TiddlerListView,
		templateSource = $("#tiddler-template").text(),
		tiddlerTemplate = Handlebars.compile(templateSource);

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

		/*
		 * Construct the url for this tiddler, appending
		 * render=1 so we get the rendered text and .json
		 * to force the underlying ajax calls to behave.
		 */
		url: function() {
			return this.get('uri');
		}

	});

	/*
	 * All the tiddlers in one bag, which we can fetch.
	 */
	Tiddlers = Backbone.Collection.extend({
		model: Tiddler
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
			'click .tiddler-container': 'toList'
		},

		/*
		 * Remove the current tiddler view from the dom.
		 */
		toList: function() {
			this.$el.html(this.model.get('title'));
		},

		/*
		 * Render this tiddler's text. Use render
		 * if present, otherwise fiddle to display text
		 * as a nice pre, or an image if it is one.
		 */
		render: function() {
			var tiddler = this.model,
				type = tiddler.get('type'),
				render = tiddler.get('render'),
				text = tiddler.escape('text'),
				nest;

			if (render) {
				text = render;
			} else if (type && type.match(/^image/)) {
				text = '<img src="data:'
					+ type
					+ ';base64,'
					+ text + '">';
			} else {
				text = '<pre>' + text + '</pre>';
			}
			nest = tiddlerTemplate({
				text: text,
				modifier: tiddler.get('modifier'),
				modified: tiddler.get('modified')
			});
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
			_.bindAll(this, 'render', 'renderOne');
			this.collection.bind('reset', this.render);
			this.collection.bind('add', this.renderOne);
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
					model.fetch({url: model.url() + '.json?render=1'});
				} else {
					view.render();
				}
			}
			return false;
		},

		/*
		 * Add one title to list.
		 */
		renderOne: function(model) {
			var liEl = $('<li>').addClass('tiddler-title').text(
				model.get('title')
			);
			this.$el.prepend(liEl);
		},

		/*
		 * List all the tiddler titles.
		 */
		render: function() {
			this.$el.empty();
			this.collection.each(this.renderOne);
			return this;
		}
	});


	/*
	 * Construct a sort comparator for any field.
	 * If options.toInt the field is turned into
	 * a number. If options.reverse, sort in 
	 * reverse.
	 */
	function makeSort(field, options) {
		options = options || {};


		// helpers
		function reverse(arg) {
			return -arg;
		}
		function compose(invoking, argF) {
			return function() {
				return invoking.call(this, argF.apply(this, arguments));
			};
		}

		var sorter = function(modelA, modelB) {
			var valueA = modelA.get(field),
				valueB = modelB.get(field);
			if (!valueA || !valueB) {
				return 0;
			}
			if (isNaN(valueA)) {
				valueA = valueA.toLowerCase();
				valueB = valueB.toLowerCase();
			}
			if (options.toInt) {
				valueA = parseInt(valueA, 10);
				valueB = parseInt(valueB, 10);
			}
			if (valueA > valueB) {
				return 1;
			}
			if (valueB > valueA) {
				return -1;
			}
			return 0;
		};
		if (options.reverse) {
			sorter = compose(reverse, sorter);
		}
		// reverse because we render by prepend not append
		return compose(reverse, sorter);
	}

	/*
	 * Do the actual work to get started. That is:
	 * make a Tiddlers, add it is a view, using a particular
	 * element to contain it, and fetch the tiddlers.
	 */
	var tiddlers = new Tiddlers();
	new TiddlerListView({
		collection: tiddlers,
		el: $('#tiddlers')[0]
	});
	tiddlers.url = '/bags/'
		+ tiddlyweb.status.space.name
		+ '_public/tiddlers';
	tiddlers.comparator = makeSort('modified', {toInt: true, reverse: true});
	tiddlers.fetch();
	root.tiddlers = tiddlers;
}).call(this);
