define(function(require, exports, module) {
	var character = require('../util/character'),
		Class = require('../util/Class'),
		Node = Class(function(id, params, phash, body, fhash) {
			this.id = id;
			this.params = params;
			this.phash = phash;
			this.body = body;
			this.fhash = fhash;
			this.gvs = {};
		}).methods({
			compile: function(global) {
				return this.body;
			}
		});
	module.exports = Node;
});