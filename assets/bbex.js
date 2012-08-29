
var urlRoot = '/bags/bbex_public/tiddlers';

var Tiddler = Backbone.Model.extend({
	defaults: {
		title: '',
		tags: [],
		text: '',
		fields: {}
	},
	idAttribute: 'title',
	urlRoot: urlRoot,
});

var Tiddlers = Backbone.Collection.extend({
	model: Tiddler,
	url: urlRoot + '?fat=1;render=1',
});


var TiddlerView = Backbone.View.extend({

	events: {
		'click .tiddler-body': 'toList',
	},

	toList: function(args) {
		var title = this.model.get('title');
		$(args.currentTarget).remove();
		return false;
	},

	initialize: function() {
		_.bindAll(this, 'render');
	},

	render: function() {
		var tiddler = this.model,
			text = tiddler.get('render') ||
				'<pre>' + tiddler.get('text') + '</pre>',
			nest = $('<div>').html(text).attr('class', 'tiddler-body');
		this.$el.append(nest);
		return this;
	}
});

var TiddlerList = Backbone.View.extend({

	events: {
		'click li.tiddler-title': 'show',
	},

	show: function(args) {
		var target = args.currentTarget,
			title = $(target).text(),
			model = this.collection.get(title);
		if ($(target).children('div').length === 0) {
			new TiddlerView({model: model, el: target}).render();
		}
		return false;
	},

	initialize: function() {
		_.bindAll(this, 'render');
	},

	render: function() {
		var that = this,
			titles = this.collection.map(
			function(tiddler) {
				return tiddler.get('title');
			}
		);
		_.each(titles, function(title) {
			var liEl = $('<li>').attr('class', 'tiddler-title').text(title);
			that.$el.append(liEl);
		});
		return this;
	}
});

var tiddlers = new Tiddlers();
var tiddlerList = new TiddlerList({collection: tiddlers, el: $('#tiddlers')[0]});
tiddlers.fetch({success: tiddlerList.render});
