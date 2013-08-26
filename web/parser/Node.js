define(function(require, exports, module) {
	var Class = require('../util/Class'),
		Node = Class(function(type, children) {
			this.type = type;
			if(type == Node.TOKEN) {
				this.children = children;
			}
			else if(Array.isArray(children)) {
				this.children = children;
			}
			else {
				this.children = children ? [children] : [];
			}
			return this;
		}).methods({
			name: function() {
				return this.type;
			},
			leaves: function() {
				return this.children;
			},
			add: function() {
				var self = this,
					args = Array.prototype.slice.call(arguments, 0);
				args.forEach(function(node) {
					if(Array.isArray(node)) {
						self.children = self.children.concat(node);
					}
					else {
						self.children.push(node);
					}
				});
				return self;
			},
			token: function() {
				return this.children;
			}
		}).statics({
			TOKEN: 'token',
			PROGRAME: 'program',
			ELEMENT: 'element',
			IMPORT: 'import',
			MEDIA: 'media',
			CHARSET: 'charset',
			MEDIAQLIST: 'mediaqlist',
			EXPR: 'expression',
			BLOCK: 'block',
			STYLESET: 'styleset',
			STYLE: 'style',
			SELECTORS: 'selectors',
			SELECTOR: 'selector',
			KEY: 'key',
			VALUE: 'value',
			FONTFACE: 'fontface',
			KEYFRAMES: 'kframes',
			PAGE: 'page',
			URL: 'url',
			LINEARGRADIENT: 'lineargradient',
			LENGTH: 'length',
			COLOR: 'color',
			VARS: 'vars'
		});
	module.exports = Node;
});