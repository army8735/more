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
			compile: function(aparams, gvs) {
				this.global(gvs);
				return this.body;
			},
			global: function(gvs) {
				if(!character.isUndefined(gvs)) {
					this.gvs = gvs;
				}
				return this.gvs;
			}
		});
	module.exports = Node;
});