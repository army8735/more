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
		body;

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
	function noImpact(node, first, other, child) {
		var mode = false;
		if(typeof child == 'number') {
			mode = true;
		}
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
				'border-bottom': true,
				'border-radius': true,
				'background-position': true,
				'background-color': true,
				'background-repeat': true,
				'background-attachment': true,
				'background-image': true,
				'font-style': true,
				'line-height': true,
				'font-family': true,
				'font-variant': true,
				'font-size': true,
				'margin-left': true,
				'margin-right': true,
				'margin-bottom': true,
				'margin-top': true,
				'padding-left': true,
				'padding-right': true,
				'padding-bottom': true,
				'padding-top': true,
				'list-style-image': true,
				'list-style-position': true,
				'list-style-type': true,
				'overlfow-x': true,
				'overlfow-y': true,
				'border-left-width': true,
				'border-left-color': true,
				'border-left-style': true,
				'border-right-width': true,
				'border-right-color': true,
				'border-right-style': true,
				'border-top-width': true,
				'border-top-color': true,
				'border-top-style': true,
				'border-bottom-width': true,
				'border-bottom-color': true,
				'border-bottom-style': true,
				'border-top-left-radius': true,
				'border-top-right-radius': true,
				'border-bottom-left-radius': true,
				'border-bottom-right-radius': true
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
			var block = node[other].block;
			//有child索引时仅检查other样式的索引冲突，否则为other全部
			if(mode) {
				block = block.slice(child, child + 1);
			}
			block.forEach(function(o) {
				if(res) {
					var key = getK(o.key);
					var n = hash[key];
					if(n && n.p >= (o.impt ? 2 : 1)) {
						if(n.v === true || n.v != o.value) {
							res = false;
						}
					}
					//总样式和分样式有冲突
					else if(keys[key]) {
						switch(key) {
							case 'background':
								if( hash['background-position'] ||
									hash['background-color'] ||
									hash['background-repeat'] ||
									hash['background-attachment'] ||
									hash['background-image'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'background-position':
							case 'background-color':
							case 'background-repeat':
							case 'background-attachment':
							case 'background-image':
								if(hash['background']) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'font':
								if( hash['font-style'] ||
									hash['line-height'] ||
									hash['font-family'] ||
									hash['font-variant'] ||
									hash['font-size'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'font-style':
							case 'line-height':
							case 'font-family':
							case 'font-variant':
							case 'font-size':
								if(hash['font']) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'margin':
								if( hash['margin-top'] ||
									hash['margin-right'] ||
									hash['margin-bottom'] ||
									hash['margin-left'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'margin-left':
							case 'margin-right':
							case 'margin-bottom':
							case 'margin-top':
								if(hash['margin']) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'padding':
								if( hash['padding-top'] ||
									hash['padding-right'] ||
									hash['padding-bottom'] ||
									hash['padding-left'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'padding-left':
							case 'padding-right':
							case 'padding-bottom':
							case 'padding-top':
								if(hash['padding']) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'list-style':
								if( hash['list-style-image'] ||
									hash['list-style-position'] ||
									hash['list-style-type'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'list-style-image':
							case 'list-style-position':
							case 'list-style-type':
								if(hash['list-style']) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'overflow':
								if( hash['overflow-x'] ||
									hash['overflow-y'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'overlfow-x':
							case 'overlfow-y':
								if(hash['overlfow']) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'border':
								if( hash['border-left'] ||
									hash['border-top'] ||
									hash['border-right'] ||
									hash['border-bottom'] ||
									hash['border-width'] ||
									hash['border-color'] ||
									hash['border-style'] ||
									hash['border-left-width'] ||
									hash['border-left-color'] ||
									hash['border-left-style'] ||
									hash['border-top-width'] ||
									hash['border-top-color'] ||
									hash['border-top-style'] ||
									hash['border-right-width'] ||
									hash['border-right-color'] ||
									hash['border-right-style'] ||
									hash['border-bottom-width'] ||
									hash['border-bottom-color'] ||
									hash['border-bottom-style'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'border-left-width':
							case 'border-left-color':
							case 'border-left-style':
								if( hash['border-left'] ||
									hash['border'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'border-right-width':
							case 'border-right-color':
							case 'border-right-style':
								if( hash['border-right'] ||
									hash['border'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'border-top-width':
							case 'border-top-color':
							case 'border-top-style':
								if( hash['border-top'] ||
									hash['border'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'border-bottom-width':
							case 'border-bottom-color':
							case 'border-bottom-style':
								if( hash['border-bottom'] ||
									hash['border'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'border-left':
								if( hash['border'] ||
									hash['border-left-width'] ||
									hash['border-left-color'] ||
									hash['border-left-style'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'border-top':
								if( hash['border'] ||
									hash['border-top-width'] ||
									hash['border-top-color'] ||
									hash['border-top-style'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'border-right':
								if( hash['border'] ||
									hash['border-right-width'] ||
									hash['border-right-color'] ||
									hash['border-right-style'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'border-bottom':
								if( hash['border'] ||
									hash['border-bottom-width'] ||
									hash['border-bottom-color'] ||
									hash['border-bottom-style'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'border-radius':
								if( hash['border-top-left-radius'] ||
									hash['border-top-right-radius'] ||
									hash['border-bottom-left-radius'] ||
									hash['border-bottom-right-radius'] ) {
									res = false;
								}
								else {
									res = true;
								}
							break;
							case 'border-top-left-radius':
							case 'border-top-right-radius':
							case 'border-bottom-left-radius':
							case 'border-bottom-right-radius':
								if(hash['border-radius']) {
									res = false;
								}
								else {
									res = true;
								}
							break;
						}
					}
				}
			});
			return res;
		}
	}
	function clean(node) {
		//清空null
		for(var i = node.length - 1; i >= 0; i--) {
			var o = node[i];
			for(var j = o.block.length - 1; j >= 0; j--) {
				if(!o.block[j]) {
					o.block.splice(j, 1);
				}
			}
			if(!o.block.length) {
				node.splice(i, 1);
			}
		}
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
			'border-bottom': true,
			'border-radius': true
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
					case 'border-top-left-radius':
					case 'border-top-right-radius':
					case 'border-bottom-left-radius':
					case 'border-bottom-right-radius':
						if(hash[o.s2s]['border-radius'] == 2) {
							o.block.splice(i, 1);
						}
						else if(hash[o.s2s]['border-radius'] && !style.impt) {
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
		clean(node);
	}

	function extract(node) {
		var hash = {};
		node.forEach(function(o, i) {
			o.block.forEach(function(style, j) {
				var key = style.key + ':' + style.value;
				if(style.hack) {
					key += style.hack;
				}
				if(style.impt) {
					key += '!important';
				}
				hash[key] = hash[key] || [];
				hash[key].push({
					parent: o,
					i: i,
					j: j
				});
			});
		});
		//将只有1次出现的删除，多次出现的保留，将留下的组成一个二维数组
		var index = [];
		var max = 0;
		var keys = [];
		Object.keys(hash).forEach(function(o) {
			var same = hash[o];
			if(same.length == 1) {
				delete hash[o];
			}
			else {
				keys.push(o);
				var temp = {};
				same.forEach(function(o2) {
					temp[o2.i] = true;
					max = Math.max(max, o2.i);
				});
				index.push(temp);
			}
		});
		//排列好map的位置，索引和位置对应，空的地方填null
		var map = [];
		index.forEach(function(temp, idx) {
			var arr = new Array(max);
			for(var i = 0; i <= max; i++) {
				arr[i] = 0;
			}
			Object.keys(temp).forEach(function(i) {
				arr[parseInt(i)] = 1;
			});
			map.push(arr);console.log(arr, keys[idx]);
		});
		//同列相同部分视为一块矩形面积，不同列拥有相同位置和高度可合并计算面积——即拥有相同样式的不同选择器。优先取最大面积者合并。当然至少要2列，因为1列为只出现在一个选择器中没必要提
		//to do 面积择优算法。目前想到的复杂度过高，无法用于实际场景
		//舍弃之采用单行合并，即拥有某一个样式的所有选择器尝试合并，当然因为优先级冲突不一定能够整行合并，递归其所有组合尝试
		map.forEach(function(row, i) {
			var start = row.indexOf(1);
			var end = row.lastIndexOf(1);console.log(start, end);
			var same = hash[keys[i]];console.log(same);
			if(noImpact(node, start, end, same[same.length - 1].j)) {console.log('m', i);
			}
			else {console.log('confilct');
			}
		});
	}

	function join(node) {
		node.forEach(function(o) {
			body += o.selectors.join(',');
			body += '{';
			o.block.forEach(function(style, i) {
				body += style.key;
				body += ':';
				body += style.value;
				if(style.impt) {
					body += '!important';
				}
				if(style.hack) {
					body += style.hack;
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
		//提取公因子
		extract(node);
		//结果
		join(node);
		return head + body;
	}

	exports.compress = compress;
});