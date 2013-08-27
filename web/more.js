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
		stack,
		varHash;

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
		varHash = {};
	}
	function preVar(node) {
		var isToken = node.name() == Node.TOKEN;
		if(!isToken) {
			if(node.name() == Node.VARS) {
				var leaves = node.leaves(),
					k = leaves[0].leaves().content().slice(1),
					v = leaves[2].leaves().val();
				varHash[k] = v;
			}
			else {
				node.leaves().forEach(function(leaf) {
					preVar(leaf);
				});
			}
		}
	}
	function replaceVar(s) {
		if(s.indexOf('$') > -1 || s.indexOf('@') > -1) {
			for(var i = 0; i < s.length; i++) {
				if(s.charAt(i) == '\\') {
					i++;
					continue;
				}
				if(s.charAt(i) == '$' || s.charAt(i) == '@') {
					var c = s.charAt(i + 1),
						lit;
					if(c == '{') {
						var j = s.indexOf('}', i + 3);
						if(j > -1) {
							c = s.slice(i + 2, j);
							if(varHash[c]) {
								s = s.slice(0, i) + varHash[c] + s.slice(j + 1);
							}
						}
					}
					else if(/[\w-]/.test(c)) {
						c = /^[\w-]+/.exec(s.slice(i + 1))[0];
						if(varHash[c]) {
							s = s.slice(0, i) + varHash[c] + s.slice(i + c.length + 1);
						}
					}
				}
			}
		}
		return s;
	}
	function join(node, ignore, inHead, isSelectors, isSelector, isVar, prev, next) {
		var isToken = node.name() == Node.TOKEN,
			isVirtual = isToken && node.token().type() == Token.VIRTUAL;
		if(isToken) {
			if(!isVirtual) {
				var token = node.token();
				if(inHead) {
					res += replaceVar(token.content());
				}
				else if(isVar) {
					//忽略变量声明
				}
				else if(isSelectors || isSelector) {
					var temp = stack[stack.length - 1];
					if(isSelectors) {
						temp.push('');
					}
					else {
						temp[temp.length - 1] += token.content();
					}
				}
				else {
					res += replaceVar(token.content());
				}
				while(ignore[++index]) {
					var ig = ignore[index];
					var s = ig.type() == Token.IGNORE ? ig.content().replace(/\S/g, ' ') : ig.content();
					if(!inHead && (isSelectors || isSelector)) {
						var temp = stack[stack.length - 1];
						temp[temp.length - 1] += s;
					}
					else {
						res += s;
					}
				}
			}
		}
		else {
			if(!inHead && [Node.FONTFACE, Node.MEDIA, Node.CHARSET, Node.IMPORT, Node.PAGE, Node.KEYFRAMES].indexOf(node.name()) != -1) {
				inHead = true;
			}
			if(node.name() == Node.VARS) {
				isVar = true;
			}
			//将层级拆开
			if(node.name() == Node.STYLESET && !inHead) {
				styleset(true, node, prev, next);
			}
			else if(node.name() == Node.BLOCK && !inHead) {
				block(true, node);
			}
			isSelectors = node.name() == Node.SELECTORS;
			isSelector = node.name() == Node.SELECTOR;
			var leaves = node.leaves();
			//递归子节点
			leaves.forEach(function(leaf, i) {
				join(leaf, ignore, inHead, isSelectors, isSelector, isVar, leaves[i - 1], leaves[i + 1]);
			});
			if(node.name() == Node.STYLESET & !inHead) {
				styleset(false, node, prev, next);
			}
			else if(node.name() == Node.BLOCK && !inHead) {
				block(false, node);
			}
		}
	}
	function concatSt(i, s, arr, needTrim) {
		if(i == stack.length) {
			arr.push(s);
		}
		else {
			for(var j = 0, se = stack[i], len = se.length; j < len; j++) {
				var ns = s + (s.length && !/.*\s$/.test(s) ? ' ' : '') + (needTrim ? se[j].trim() : se[j]);
				concatSt(i + 1, ns, arr, needTrim);
			}
		}
		return arr;
	}
	function styleset(startOrEnd, node, prev, next) {
		if(startOrEnd) {
			//二级等以上选择器先结束上级block
			if(stack.length) {
				if(prev && prev.name() == Node.STYLESET) {
				}
				else {
					res += '}';
				}
			}
			stack.push(['']);
		}
		else {
			stack.pop();
			if(stack.length) {
				//当多级styleset结束时下个还是styleset或}，会造成空白样式表，取消输出
				if(next && next.name() == Node.STYLESET) {
					return;
				}
				res += concatSt(0, '', [], true).join(',') + '{';
			}
		}
	}
	function block(startOrEnd, node) {
		if(startOrEnd) {
			res += concatSt(0, '', [], stack.length > 1).join(',');
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
		preVar(node);
		join(node, ignore);
		return character.escapeHTML(res);
	};
	exports.tree = function() {
		return node;
	};
	exports.token = function() {
		return token;
	};
});