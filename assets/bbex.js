
var Tiddler = Backbone.Model.extend({
	defaults: {
		title: '',
		tags: [],
		text: '',
		fields: {}
	},
});

var Tiddlers = Backbone.Collection.extend({
	model: Tiddler
});

var TiddlerDisplay = Backbone.View.extend({
	events: {
		'click h1': 'hide'
	},
	className: 'tiddler',
	initialize: function() {
		_.bindAll(this, 'render');
		this.model.on('change', this.render);
		this.model.on('destroy', this.remove);
	},
	render: function( event ) {
		var templateString = $('#tiddler-display-template').html(),
			template = _.template(templateString);
			data = this.model.toJSON();
		console.log(data);
		if (data.render && data.render.match(/<div>/)) {
			data.text = data.render;
		}
		this.$el.html(template(data));
		return this;
	},
	remove: function() {
		this.$el.remove();
	},
	hide: function() {
		this.remove();
	}
});

var TiddlerListDisplay = Backbone.View.extend({
	initialize: function() {
		_(this).bindAll('add', 'remove');
		this._tiddlerViews = [];
		// add the existing members 
		this.collection.each(this.add);

		this.collection.bind('add', this.add);
		this.collection.bind('remove', this.remove);
	},

	add: function(tiddler) {
		var view = new TiddlerDisplay({
			tagName: 'li',
			model: tiddler
		});

		this._tiddlerViews.push(view);

		if (this._rendered) {
			$(this.el).append(view.render().el);
		}
	},

	remove: function(model) {
		var viewToRemove = _(this._tiddlerViews).select(function(cv) {
			return cv.model === model;
		})[0];
		this._tiddlerViews = _(this._tiddlerViews).without(viewToRemove);

		if (this._rendered) $(viewToRemove.el).remove();
	},

	render: function() {
		console.log('calling render');
		this._rendered = true;
		$(this.el).empty();

		_(this._tiddlerViews).each(function(view) {
			$('ul#tiddlers').append(view.render().el);
		});

		return this;
	}
});

var tiddlers = new Tiddlers();
var view = new TiddlerListDisplay({
	collection: tiddlers,
	el: $('ul#tiddlers')[0]
});
//view.render();
tiddlers.url = '/bags/bbex_public/tiddlers?fat=1;render=1';
console.log('calling fetch');
tiddlers.fetch({add: true});
