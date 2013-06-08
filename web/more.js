define(function(require, exports) {
	var CssLexer = require('./lexer/CssLexer'),
		CssRule = require('./lexer/rule/CssRule'),
		Token = require('./lexer/Token'),
		Parser = require('./parser/Parser'),
		Node = require('./parser/Node'),
		character = require('./util/character'),
		res,
		node,
		token,
		index,
		stack;

	function init(ignore) {
		res = '';
		index = 0;
		while(ignore[index]) {
			if(ignore[index].type() == Token.IGNORE) {
				res += ignore[index].content().replace(/\S/g, ' ');
			}
			else {
				res += ignore[index].content();
			}
			index++;
		}
		stack = [];
	}
	function join(node, ignore, inHead) {
		var isToken = node.name() == Node.TOKEN,
			isVirtual = isToken && node.token().type() == Token.VIRTUAL;
		if(isToken) {
			if(!isVirtual) {
				var token = node.token();
				//忽略的token
				if(['var', '...', 'static'].indexOf(token.content()) == -1) {
					if(token.content() == 'let' || token.content() == 'const') {
						res += 'var';
					}
					else {
						res += token.content();
					}
				}
				while(ignore[++index]) {
					var ig = ignore[index];
					if(ig.type() == Token.IGNORE) {
						res += ig.content().replace(/\S/g, ' ');
					}
					else {
						res += ig.content();
					}
				}
			}
		}
		else {
			if(!inHead && [Node.FONTFACE, Node.MEDIA, Node.CHARSET, Node.IMPORT, Node.PAGE, Node.KEYFRAMES].indexOf(node.name()) != -1) {
				inHead = true;
			}
			//将层级拆开
			if(node.name() == Node.STYLESET && !inHead) {
				layer(true, node);
			}
			//递归子节点
			node.leaves().forEach(function(leaf, i) {
				join(leaf, ignore, inHead);
			});
			if(node.name() == Node.STYLESET & !inHead) {
				layer(false, node);
			}
		}
	}
	function layer(startOrEnd, node) {
		if(startOrEnd) {
			var selector = node.leaves()[0];
			var s = '';
			var i = index;
			selector.leaves().forEach(function(o) {
				var token = o.leaves();
				s += token.content();
			});console.log(s)
		}
		else {
		}
	}

	exports.parse = function(code) {
		var lexer = new CssLexer(new CssRule()),
			parser = new Parser(lexer),
			ignore = {};
		try {
			token = lexer.parse(code);
			node = parser.program();
			ignore = parser.ignore();
		} catch(e) {
			if(window.console) {
				console.error(e);
			}
			return e.toString();
		}
		init(ignore);
		join(node, ignore);console.log(node);
		return character.escapeHTML(res);
	};
	exports.tree = function() {
		return node;
	};
	exports.token = function() {
		return token;
	};
});