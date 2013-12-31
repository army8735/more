var Class = require('../util/Class'),
	Node = Class(function(id, params, phash, body, fhash) {
		this.id = id;
		this.params = params;
		this.phash = phash;
		this.body = body;
		this.fhash = fhash;
	}).methods({
		compile: function() {
		}
	});
module.exports = Node;
