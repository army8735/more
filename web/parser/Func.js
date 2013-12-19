define(function(require, exports, module) {
	var Class = require('../util/Class'),
		Node = Class(function(id, params, body, hash) {
			this.id = id;
			this.params = params;
			this.body = body;
			this.hash = hash;
		}).methods({
			compile: function() {
			}
		});
	module.exports = Node;
});