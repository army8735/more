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
	function join(node, ignore, inHead, isSelector) {
		var isToken = node.name() == Node.TOKEN,
			isVirtual = isToken && node.token().type() == Token.VIRTUAL;
		if(isToken) {
			if(!isVirtual) {
				var token = node.token();
				if(!isSelector && ['{', '}'].indexOf(token.content()) == -1 || inHead) {
					res += token.content();
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
			isSelector = (node.name() == Node.SELECTOR || node.name() == Node.SELECTORS);
			//递归子节点
			node.leaves().forEach(function(leaf, i) {
				join(leaf, ignore, inHead, isSelector);
			});
			if(node.name() == Node.STYLESET & !inHead) {
				layer(false, node);
			}
		}
	}
	function concatSt(i, s, arr) {
		if(i == stack.length) {
			arr.push(s);
		}
		else {
			for(var j = 0, se = stack[i], len = se.length; j < len; j++) {
				var ns = s + (s.length ? ' ' : '') + se[j];
				concatSt(i + 1, ns, arr);
			}
		}
		return arr;
	}
	function layer(startOrEnd, node) {
		if(startOrEnd) {
			//先结束上级block
			if(stack.length) {
				res += '}';
			}
			var selectors = node.leaves()[0];
			var i = index;
			var temp = [];
			stack.push(temp);
			selectors.leaves().forEach(function(selector, i) {
				if(i % 2 == 0) {
					var s;
					selector.leaves().forEach(function(o, j) {
						var token = o.leaves();
						if(j == 0) {
							s = token.content();
						}
						else {
							s += ' ' + token.content();
						}
					});
					temp.push(s);
				}
			});
			//将上级选择器拼接起来
			var concat = concatSt(0, '', []);console.log(concat)
			res += concat.join(', ') + '{';
		}
		else {
			stack.pop();
			if(!stack.length) {
				res += '}';
			}
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