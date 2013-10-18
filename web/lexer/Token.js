define(function(require, exports, module) {
	var Class = require('../util/Class'),
		character = require('../util/character'),
		types,
		Token = Class(function(type, content, val) {
			this.t = type;
			this.c = content;
			if(character.isUndefined(val)) {
				val = content;
			}
			this.v = val;
		}).methods({
			type: function(t) {
				if(!character.isUndefined(t)) {
					this.t = t;
				}
				return this.t;
			},
			content: function(c) {
				if(!character.isUndefined(c)) {
					this.c = c;
				}
				return this.c;
			},
			val: function(v) {
				if(!character.isUndefined(v)) {
					this.v = v;
				}
				return this.v;
			},
			tag: function(t) {
				if(!character.isUndefined(t)) {
					this.t = t;
				}
				return Token.type(this.t);
			}
		}).statics({
			IGNORE: -2,
			VIRTUAL: -1,
			OTHER: 0,
			BLANK: 1,
			TAB: 2,
			LINE: 3,
			NUMBER: 4,
			ID: 5,
			COMMENT: 6,
			STRING: 7,
			SIGN: 8,
			REG: 9,
			KEYWORD: 10,
			ANNOT: 11,
			HEAD: 12,
			TEMPLATE: 13,
			ENTER: 14,
			PROPERTY: 15,
			VARS: 16,
			HACK: 17,
			IMPORTANT: 18,
			type: function(tag) {
				if(character.isUndefined(types)) {
					types = [];
					Object.keys(Token).forEach(function(o) {
						if(typeof Token[o] == 'number') {
							types[Token[o]] = o;
						}
					});
				}
				return types[tag];
			}
		});
	module.exports = Token;
});