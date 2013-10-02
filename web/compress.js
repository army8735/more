define(function(require, exports) {
	var CssLexer = require('./lexer/CssLexer'),
		CssRule = require('./lexer/rule/CssRule'),
		Token = require('./lexer/Token'),
		Parser = require('./parser/Parser'),
		Node = require('./parser/Node'),
		cleanCSS = require('clean-css'),
		sort = require('./util/sort'),
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
		//将每一组选择器顺序排列，比较时即可直接==比较
		arr.forEach(function(o) {
			sort(o.selectors);
			o.s2s = o.selectors.join(',');
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

	function getK(s) {
		if(s.indexOf('-webkit-') == 0) {
			s = s.slice(8);
		}
		else if(s.indexOf('-moz-') == 0) {
			s = s.slice(5);
		}
		else if(s.indexOf('-ms-') == 0) {
			s = s.slice(4);
		}
		else if(/^[*_-]/.test(s)) {
			s = s.slice(1);
		}
		return s;
	}
	function noImpact(node, first, other) {
		//紧邻选择器无优先级影响
		if(first == other - 1) {
			return true;
		}
		//非紧邻则若无相同样式或后声明有important更高优先级或后声明与中间夹杂的值相同亦无影响
		else {
			var hash = {};
			var keys = {
				background: true,
				font: true,
				margin: true,
				padding: true,
				'list-style': true,
				overflow: true,
				border: true,
				'border-left': true,
				'border-top': true,
				'border-right': true,
				'border-bottom': true
			};
			for(var i = first + 1; i < other; i++) {
				node[i].block.forEach(function(o) {
					var k = getK(o.key);
					if(hash[k]) {
						hash[k].p = Math.max(hash[k].p, o.impt ? 2 : 1);
						//多次出现不同值无需记录，因为后声明的不可能同时等于两个值，将其置true说明冲突
						hash[k].v = hash[k].v == o.value ? o.value : true;
					}
					else {
						hash[k] = {
							p: o.impt ? 2 : 1,
							v: o.value
						};
					}
				});
			}
			var res = true;
			node[other].block.forEach(function(o) {
				if(res) {
					var key = getK(o.key);
					var n = hash[key];
					if(n && n.p >= (o.impt ? 2 : 1)) {
						if(n.v === true || n.v != o.value) {
							res = false;
						}
					}
					//后出现的总样式和先出现的分样式有冲突，反之则无
					else if(keys[key]) {
						switch(key) {
							case 'background':
								if( (hash['background-position'] && n.p <= hash['background-position'].p) ||
									(hash['background-color'] && n.p <= hash['background-color'].p) ||
									(hash['background-repeat'] && n.p <= hash['background-repeat'].p) ||
									(hash['background-attachment'] && n.p <= hash['background-attachment'].p) ||
									(hash['background-image'] && n.p <= hash['background-image'].p) ) {
									res = true;
								}
							break;
							case 'font':
								if( (hash['font-style'] && n.p <= hash['font-style'].p) ||
									(hash['line-height'] && n.p <= hash['line-height'].p) ||
									(hash['font-family'] && n.p <= hash['font-family'].p) ||
									(hash['font-variant'] && n.p <= hash['font-variant'].p) ||
									(hash['font-size'] && n.p <= hash['font-size'].p) ) {
									res = true;
								}
							break;
							case 'margin':
								if( (hash['margin-top'] && n.p <= hash['margin-top'].p) ||
									(hash['margin-right'] && n.p <= hash['margin-right'].p) ||
									(hash['margin-bottom'] && n.p <= hash['margin-bottom'].p) ||
									(hash['margin-left'] && n.p <= hash['margin-left'].p) ) {
									res = true;
								}
							break;
							case 'padding':
								if( (hash['padding-top'] && n.p <= hash['padding-top'].p) ||
									(hash['padding-right'] && n.p <= hash['padding-right'].p) ||
									(hash['padding-bottom'] && n.p <= hash['padding-bottom'].p) ||
									(hash['padding-left'] && n.p <= hash['padding-left'].p) ) {
									res = true;
								}
							break;
							case 'list-style':
								if( (hash['list-style-image'] && n.p <= hash['list-style-image'].p) ||
									(hash['list-style-position'] && n.p <= hash['list-style-position'].p) ||
									(hash['list-style-type'] && n.p <= hash['list-style-type'].p) ) {
									res = true;
								}
							break;
							case 'overflow':
								if( (hash['overflow-x'] && n.p <= hash['overflow-x'].p) ||
									(hash['overflow-y'] && n.p <= hash['overflow-y'].p) ) {
									res = true;
								}
							break;
							case 'border':
								if( (hash['border-left'] && n.p <= hash['border-left'].p) ||
									(hash['border-top'] && n.p <= hash['border-top'].p) ||
									(hash['border-right'] && n.p <= hash['border-right'].p) ||
									(hash['border-bottom'] && n.p <= hash['border-bottom'].p) ||
									(hash['border-width'] && n.p <= hash['border-width'].p) ||
									(hash['border-color'] && n.p <= hash['border-color'].p) ||
									(hash['border-style'] && n.p <= hash['border-style'].p) ||
									(hash['border-left-width'] && n.p <= hash['border-left-width'].p) ||
									(hash['border-left-color'] && n.p <= hash['border-left-color'].p) ||
									(hash['border-left-style'] && n.p <= hash['border-left-style'].p) ||
									(hash['border-top-width'] && n.p <= hash['border-top-width'].p) ||
									(hash['border-top-color'] && n.p <= hash['border-top-color'].p) ||
									(hash['border-top-style'] && n.p <= hash['border-top-style'].p) ||
									(hash['border-right-width'] && n.p <= hash['border-right-width'].p) ||
									(hash['border-right-color'] && n.p <= hash['border-right-color'].p) ||
									(hash['border-right-style'] && n.p <= hash['border-right-style'].p) ||
									(hash['border-bottom-width'] && n.p <= hash['border-bottom-width'].p) ||
									(hash['border-bottom-color'] && n.p <= hash['border-bottom-color'].p) ||
									(hash['border-bottom-style'] && n.p <= hash['border-bottom-style'].p) ) {
									res = true;
								}
							break;
							case 'border-left':
								if( (hash['border-left-width'] && n.p <= hash['border-left-width'].p) ||
									(hash['border-left-color'] && n.p <= hash['border-left-color'].p) ||
									(hash['border-left-style'] && n.p <= hash['border-left-style'].p) ) {
									res = true;
								}
							break;
							case 'border-top':
								if( (hash['border-top-width'] && n.p <= hash['border-top-width'].p) ||
									(hash['border-top-color'] && n.p <= hash['border-top-color'].p) ||
									(hash['border-top-style'] && n.p <= hash['border-top-style'].p) ) {
									res = true;
								}
							break;
							case 'border-right':
								if( (hash['border-right-width'] && n.p <= hash['border-right-width'].p) ||
									(hash['border-right-color'] && n.p <= hash['border-right-color'].p) ||
									(hash['border-right-style'] && n.p <= hash['border-right-style'].p) ) {
									res = true;
								}
							break;
							case 'border-bottom':
								if( (hash['border-bottom-width'] && n.p <= hash['border-bottom-width'].p) ||
									(hash['border-bottom-color'] && n.p <= hash['border-bottom-color'].p) ||
									(hash['border-bottom-style'] && n.p <= hash['border-bottom-style'].p) ) {
									res = true;
								}
							break;
						}
					}
				}
			});
			return res;
		}
		return false;
	}
	function clean(node) {
		//清空null
		node.forEach(function(o) {
			for(var i = o.block.length - 1; i >= 0; i--) {
				if(!o.block[i]) {
					o.block.splice(i, 1);
				}
			}
		});
	}

	function merge(node) {
		//冒泡处理，因为可能处理后留有多个相同选择器，但后面的选择器可继续递归过程
		for(var i = 0; i < node.length - 1; i++) {
			var hash = {};
			var index = {};
			for(var j = i; j < node.length; j++) {
				var o = node[j];
				var s = o.s2s;
				if(hash[s]) {
					//当无优先级冲突时可合并分开的相同选择器
					if(noImpact(node, index[s], j)) {
						hash[s].block = hash[s].block.concat(o.block);
						node.splice(j, 1);
						j--;
					}
				}
				else {
					hash[s] = o;
					index[s] = j;
				}
			}
		}
	}
	function duplicate(node) {
		var hash = {};
		node.forEach(function(o) {
			hash[o.s2s] = hash[o.s2s] || {};
			for(var i = 0; i < o.block.length; i++) {
				var style = o.block[i];
				//以样式名+hack为键，去除hack的影响
				var key = style.key;
				if(style.hack) {
					key += style.hack;
				}
				//优先级普通声明为1，!important为2，删除低优先级和先出现的
				var priority = style.impt ? 2 : 1;
				if(hash[o.s2s][key]) {
					if(priority >= hash[o.s2s][key].priority) {
						//置空后统一删除，防止干扰index
						hash[o.s2s][key].parent.block[hash[o.s2s][key].index] = null;
						hash[o.s2s][key] = {
							index: i,
							priority: priority,
							parent: o
						};
					}
					else {
						o.block.splice(i, 1);
						i--;
					}
				}
				else {
					hash[o.s2s][key] = {
						index: i,
						priority: priority,
						parent: o
					}
				}
			}
		});
		//清空null
		clean(node);
		//后出现的普通样式会覆盖掉前面的hack
		hash = {};
		for(var i = node.length - 1; i >=0; i--) {
			var o = node[i];
			hash[o.s2s] = hash[o.s2s] || {};
			for(var j = o.block.length - 1; j >= 0; j--) {
				var style = o.block[j];
				var key = getK(style.key);
				if(key == style.key && !style.hack) {
					hash[o.s2s][style.key] = style.impt ? 2 : 1;
				}
				else if(hash[o.s2s][key] && hash[o.s2s][key] >= (style.impt ? 2 : 1)) {
					o.block.splice(j, 1);
				}
			}
		}
	}
	function override(node) {
		var hash = {};
		var keys = {
			background: true,
			font: true,
			margin: true,
			padding: true,
			'list-style': true,
			overflow: true,
			border: true,
			'border-left': true,
			'border-top': true,
			'border-right': true,
			'border-bottom': true
		};
		for(var j = node.length - 1; j >= 0; j--) {
			var o = node[j];
			hash[o.s2s] = hash[o.s2s] || {};
			//从后往前遍历，后面出现的总样式会覆盖掉前面的分样式
			for(var i = o.block.length - 1; i >= 0; i--) {
				var style = o.block[i];
				//hack的分样式也会被覆盖，但hahc的总样式没有覆盖权利
				var k = getK(style.key);
				if(k == style.key && keys[k] && !style.hack) {
					hash[o.s2s][k] = style.impt ? 2 : 1;
					//以下4个即可作为总样式也可作为分样式
					if(!{
						'border-left': true,
						'border-top': true,
						'border-right': true,
						'border-bottom': true
					}[k]) {
						continue;
					}
				}
				switch(k) {
					case 'background-position':
					case 'background-color':
					case 'background-repeat':
					case 'background-attachment':
					case 'background-image':
						if(hash[o.s2s]['background'] == 2) {
							o.block.splice(i, 1);
						}
						else if(hash[o.s2s]['background'] && !style.impt) {
							o.block.splice(i, 1);
						}
					break;
					case 'font-style':
					case 'line-height':
					case 'font-family':
					case 'font-variant':
					case 'font-size':
						if(hash[o.s2s]['font'] == 2) {
							o.block.splice(i, 1);
						}
						else if(hash[o.s2s]['font'] && !style.impt) {
							o.block.splice(i, 1);
						}
					break;
					case 'margin-top':
					case 'margin-right':
					case 'margin-bottom':
					case 'margin-left':
						if(hash[o.s2s]['margin'] == 2) {
							o.block.splice(i, 1);
						}
						else if(hash[o.s2s]['margin'] && !style.impt) {
							o.block.splice(i, 1);
						}
					break;
					case 'padding-top':
					case 'padding-right':
					case 'padding-bottom':
					case 'padding-left':
						if(hash[o.s2s]['padding'] == 2) {
							o.block.splice(i, 1);
						}
						else if(hash[o.s2s]['padding'] && !style.impt) {
							o.block.splice(i, 1);
						}
					break;
					case 'list-style-image':
					case 'list-style-position':
					case 'list-style-type':
						if(hash[o.s2s]['list-style'] == 2) {
							o.block.splice(i, 1);
						}
						else if(hash[o.s2s]['list-style'] && !style.impt) {
							o.block.splice(i, 1);
						}
					break;
					case 'overflow-x':
					case 'overflow-y':
						if(hash[o.s2s]['overflow'] == 2) {
							o.block.splice(i, 1);
						}
						else if(hash[o.s2s]['overflow'] && !style.impt) {
							o.block.splice(i, 1);
						}
					break;
					case 'border-width':
					case 'border-color':
					case 'border-style':
					case 'border-left':
					case 'border-top':
					case 'border-right':
					case 'border-bottom':
						if(hash[o.s2s]['border'] == 2) {
							o.block.splice(i, 1);
						}
						else if(hash[o.s2s]['border'] && !style.impt) {
							o.block.splice(i, 1);
						}
					break;
					case 'border-left-width':
					case 'border-left-color':
					case 'border-left-style':
						if(hash[o.s2s]['border-left'] == 2 || hash[o.s2s]['border'] == 2) {
							o.block.splice(i, 1);
						}
						else if(hash[o.s2s]['border-left'] || hash[o.s2s]['border'] && !style.impt) {
							o.block.splice(i, 1);
						}
					break;
					case 'border-top-width':
					case 'border-top-color':
					case 'border-top-style':
						if(hash[o.s2s]['border-top'] == 2 || hash[o.s2s]['border'] == 2) {
							o.block.splice(i, 1);
						}
						else if(hash[o.s2s]['border-top'] || hash[o.s2s]['border'] && !style.impt) {
							o.block.splice(i, 1);
						}
					break;
					case 'border-right-width':
					case 'border-right-color':
					case 'border-right-style':
						if(hash[o.s2s]['border-right'] == 2 || hash[o.s2s]['border'] == 2) {
							o.block.splice(i, 1);
						}
						else if(hash[o.s2s]['border-right'] || hash[o.s2s]['border'] && !style.impt) {
							o.block.splice(i, 1);
						}
					break;
					case 'border-bottom-width':
					case 'border-bottom-color':
					case 'border-bottom-style':
						if(hash[o.s2s]['border-bottom'] == 2 || hash[o.s2s]['border'] == 2) {
							o.block.splice(i, 1);
						}
						else if(hash[o.s2s]['border-bottom'] || hash[o.s2s]['border'] && !style.impt) {
							o.block.splice(i, 1);
						}
					break;
				}
			}
		}
	}
	function union(node) {
		var hash = {};
		for(var i = 0; i < node.length; i++) {
			var key = [];
			node[i].block.forEach(function(style) {
				var k = style.key + ':' + style.value;
				if(style.hack) {
					k += style.hack;
				}
				if(style.impt) {
					k += '!important';
				}
				key.push(k);
			});
			sort(key);
			key = key.join(';');
			hash[key] = hash[key] || [];
			hash[key].push({
				n: node[i],
				i: i
			});
		}
		Object.keys(hash).forEach(function(o) {
			if(hash[o].length > 1) {
				var queue = hash[o];
				//后面的选择器冒泡合并到第一个上，并置空
				for(var i = 0; i < queue.length - 1; i++) {
					for(var j = i + 1; j < queue.length; j++) {
						if(queue[i].n.block.length && queue[j].n.block.length && noImpact(node, queue[i].i, queue[j].i)) {
							queue[i].n.selectors = queue[i].n.selectors.concat(queue[j].n.selectors);
							queue[j].n.block = [];
						}
					}
				}
			}
		});
	}
	function extract(node) {
		var hash = {};
		node.forEach(function(o) {
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
		//去除同一选择器中被覆盖的样式声明
		override(node);
		//聚合相同样式的选择器
		union(node);
		//提取同类项
		//extract(node);
		//结果
		join(node);
		return head + body + plus;
	}

	exports.compress = compress;
});