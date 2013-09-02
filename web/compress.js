define(function(require, exports) {
	var CssLexer = require('./lexer/CssLexer'),
		CssRule = require('./lexer/rule/CssRule'),
		Token = require('./lexer/Token'),
		Parser = require('./parser/Parser'),
		Node = require('./parser/Node'),
		cleanCSS = require('clean-css'),
		index,
		head,
		body,
		plus;

	function getHead(node, ignore) {
		var leaves = node.leaves();
		leaves.forEach(function(leaf) {
			if([Node.FONTFACE, Node.MEDIA, Node.CHARSET, Node.IMPORT, Node.PAGE, Node.KEYFRAMES].indexOf(leaf.name()) > -1) {
				joinHead(leaf, ignore);
			}
		});
	}
	function joinHead(node, ignore) {
		var isToken = node.name() == Node.TOKEN;
		if(isToken) {
			var token = node.token();
			if(token.type() != Token.VIRTUAL) {
				head += token.content();
				while(ignore[++index]) {
					var ig = ignore[index];
					head += ig.content();
					delete ignore[index];
				}
			}
		}
		else {
			node.leaves().forEach(function(leaf, i) {
				joinHead(leaf, ignore);
			});
		}
	}
	var currentStyle;
	var currentValue;
	var currentHack;
	var currentImpt;
	function rebuild(node, ignore, arr) {
		var leaves = node.leaves();
		leaves.forEach(function(leaf) {
			if([Node.FONTFACE, Node.MEDIA, Node.CHARSET, Node.IMPORT, Node.PAGE, Node.KEYFRAMES].indexOf(leaf.name()) == -1) {
				rb(leaf, ignore, arr);
			}
		});
		return arr;
	}
	function rb(node, ignore, arr, isSelector, isValue) {
		var isToken = node.name() == Node.TOKEN;
		if(isToken) {
			var token = node.token();
			if(token.type() != Token.VIRTUAL) {
				if(isSelector) {
					currentSelector += token.content();
				}
				else if(isValue) {
					if(token.type() == Token.HACK) {
						currentHack = token.content();
					}
					else if(token.type() == Token.IMPORTANT) {
						currentImpt = true;
					}
					else {
						currentValue += token.content();
					}
				}
				while(ignore[++index]) {
					var ig = ignore[index];
					if(isSelector) {
						currentSelector += ig.content();
					}
					else if(isValue) {
						currentValue += ig.content();
					}
				}
			}
		}
		else {
			if(node.name() == Node.STYLESET) {
				arr.push({
					selectors: [],
					block: []
				});
			}
			else if(node.name() == Node.SELECTOR) {
				currentSelector = '';
				isSelector = true;
			}
			else if(node.name() == Node.KEY) {
				currentStyle = {
					key: node.leaves()[0].token().content()
				};
			}
			else if(node.name() == Node.VALUE) {
				currentValue = '';
				isValue = true;
				currentHack = null;
				currentImpt = null;
			}
			node.leaves().forEach(function(leaf) {
				rb(leaf, ignore, arr, isSelector, isValue);
			});
			if(node.name() == Node.SELECTOR) {
				arr[arr.length - 1].selectors.push(currentSelector);
			}
			else if(node.name() == Node.VALUE) {
				currentStyle.value = currentValue;
				currentStyle.hack = currentHack;
				currentStyle.impt = currentImpt;
				arr[arr.length - 1].block.push(currentStyle);
			}
		}
	}
	function merge(node) {
		var hash = {};
		for(var i = 0; i < node.length; i++) {
			var o = node[i];
			//先排序选择器，可能会出现反过顺序来写多个选择器的情况，其实同为一个集
			o.selectors.sort(function(a, b) {
				return a > b;
			});
			var s = o.selectors.join(',');
			if(hash[s]) {
				hash[s].block = hash[s].block.concat(o.block);
				node.splice(i, 1);
				i--;
			}
			else {
				hash[s] = o;
			}
		}
	}
	function duplicate(node) {
		node.forEach(function(o) {
			if(o.block.length > 1) {
				var hash = {};
				for(var i = 0; i < o.block.length; i++) {
					var style = o.block[i];
					//以样式名+hack为键，去除hack的影响
					var key = style.key;
					if(style.hack) {
						key += style.hack;
					}
					//没有声明优先级为0，普通声明为1，!important为2，删除低优先级和先出现的
					var priority = style.impt ? 2 : 1;
					if(hash[key]) {
						if(priority >= hash[key].priority) {
							o.block.splice(hash[key].index, 1);
							i--;
							hash[key] = {
								index: i,
								priority: priority
							};
						}
						else {
							o.block.splice(i, 1);
							i--;
						}
					}
					else {
						hash[key] = {
							index: i,
							priority: priority
						}
					}
				}
			}
		});
	}
	function union(node) {
		var hash = {};
		for(var i = 0; i < node.length; i++) {
			var key = '';
			node[i].block.sort(function(a, b) {
				return a.key > b.key;
			});
			node[i].block.forEach(function(style, j) {
				key += style.key + ':' + style.value;
				if(style.hack) {
					key += style.hack;
				}
				if(style.impt) {
					key += '!important';
				}
				if(j < node[i].block.length - 1) {
					key += ';';
				}
			});
			hash[key] = hash[key] || [];
			hash[key].push(node[i]);
		}
		Object.keys(hash).forEach(function(o) {
			if(hash[o].length > 1) {
				//后面的选择器合并到第一个上，并做标识标识忽略
				hash[o].forEach(function(item, i) {
					if(i) {
						hash[o][0].selectors = hash[o][0].selectors.concat(item.selectors);
						item.union = true;
					}
				});
			}
		});
	}
	function extract(node) {
		var hash = {};
		node.forEach(function(o) {
			if(o.union) {
				return;
			}
			o.block.forEach(function(style) {
				var key = style.key + ':' + style.value;
				if(style.hack) {
					key += style.hack;
				}
				if(style.impt) {
					key += '!important';
				}
				hash[key] = hash[key] || [];
				hash[key].push({
					selectors: o.selectors,
					style: style
				});
			});
		});
		Object.keys(hash).forEach(function(o) {
			if(hash[o].length > 1) {
				hash[o].forEach(function(item, i) {
					//供join时忽略
					item.style.extract = true;
					plus += item.selectors.join(',');
					if(i < hash[o].length - 1) {
						plus += ',';
					}
				});
				plus += '{';
				plus += o;
				plus += '}';
			}
		});
	}
	function join(node) {
		node.forEach(function(o) {
			if(o.union) {
				return;
			}
			//提取合并可能会出现空的情况
			var num = 0;
			o.block.forEach(function(style) {
				if(style.extract) {
					num++;
				}
			});
			if(num == o.block.length) {
				return;
			}
			body += o.selectors.join(',');
			body += '{';
			o.block.forEach(function(style, i) {
				if(style.extract) {
					return;
				}
				body += style.key;
				body += ':';
				body += style.value;
				if(style.hack) {
					body += style.hack;
				}
				if(style.impt) {
					body += '!important';
				}
				if(i < o.block.length - 1) {
					body += ';';
				}
			});
			body += '}'
		});
	}
	function compress(src) {
		var node,
			ignore = {},
			lexer = new CssLexer(new CssRule()),
			parser = new Parser(lexer);
		try {
			lexer.parse(src);
			node = parser.program();
			ignore = parser.ignore();
		} catch(e) {
			if(console) {
				console.error(e);
			}
			return e.toString();
		}
		index = 0;
		head = '';
		body = '';
		plus = '';
		getHead(node, ignore);
		//将ast重构成更直接的形式并添加附加信息
		node = rebuild(node, ignore, []);
		//合并相同选择器
		merge(node);
		//去除同一选择器中重复样式声明
		duplicate(node);
		//聚集相同样式的选择器
		union(node);
		//提取同类项
		extract(node);
		//结果
		join(node);
		return head + body + plus;
	}

	exports.compress = compress;
});