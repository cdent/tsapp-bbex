
var urlRoot = '/bags/' + tiddlyweb.status.space.name + '_public/tiddlers';

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
	url: urlRoot + '?fat=1;render=1;sort=-modified',
});


var TiddlerView = Backbone.View.extend({

	events: {
		'click .tiddler-body': 'toList',
	},

	toList: function(args) {
		var title = this.model.get('title');
		$(args.currentTarget).remove();
		//return false;
	},

	initialize: function() {
		_.bindAll(this, 'render');
	},

	render: function() {
		var tiddler = this.model,
			type = tiddler.get('type'),
			render = tiddler.get('render'),
			text = tiddler.get('text'),
			nest;

		if (render) {
			text = render;
		} else if (type && type.match(/^image/)) {
			text = '<img src="data:' + type + ';base64,' + text + '">';
		} else if (type && type.match(/^text\/html/)) {
			text = '<pre>' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
				+ '</pre>';
		} else {
			text = '<pre>' + text + '</pre>';
		}
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
			$(target).addClass('visited');
			new TiddlerView({model: model, el: target}).render();
		}
		return false;
	},

	initialize: function() {
		_.bindAll(this, 'render');
		this.collection.bind('reset', this.render);
	},

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

var tiddlers = new Tiddlers();
var tiddlerList = new TiddlerList({collection: tiddlers, el: $('#tiddlers')[0]});
tiddlers.fetch();
