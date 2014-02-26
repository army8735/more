var character = require('../util/character'),
	Class = require('../util/Class'),
	Node = Class(function(id, params, body, fhash) {
		this.id = id;
		this.params = params; //形参数组
		this.body = body; //函数�?
		this.fhash = fhash; //形参在函数体中的位置hash
		this.gvs = {}; //全局变量
	}).methods({
		compile: function(aparams, gvs) {
			var self = this;
			self.global(gvs);
			var res = this.body;
			//将所有位置变量替换为�?
			Object.keys(self.fhash).reverse().forEach(function(pos) {
				var o = self.fhash[pos];
				//�?��变量优先于全�?���?
				var v = aparams[o.index];
				if(character.isUndefined(v)) {
					var va = o.v.replace(/^\$/, '');
					if(self.gvs.hasOwnProperty(va)) {
						v = self.gvs[va];
					}
				}
				if(character.isUndefined(v)) {
					console.error('@function ' + self.id + ': ' + o.v + ' is undefined');
					v = '';
				}
				res = res.slice(0, pos) + v + res.slice(parseInt(pos) + o.v.length);
			});
			return res;
		},
		global: function(gvs) {
			if(!character.isUndefined(gvs)) {
				this.gvs = gvs;
			}
			return this.gvs;
		}
	});
module.exports = Node;
