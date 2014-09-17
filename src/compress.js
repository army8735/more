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
	//将每�?��选择器顺序排列，比较时即可直�?=比较
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
	else if(s.indexOf('-o-') == 0) {
		s = s.slice(3);
	}
	else if(/^[*_-]/.test(s)) {
		s = s.slice(1);
	}
	return s;
}
var imCache = {};
function noImpact(node, first, other, child) {
	var mode = false;
	if(typeof child == 'number') {
		mode = true;
	}
	//类似::-ms-clear�?���?
	for(var i = first; i <= other; i++) {
		if(node[i].s2s.indexOf(':-ms-') > -1) {
			return false;
		}
	}
	//紧邻选择器无优先级影�?
	if(first == other - 1) {
		return true;
	}
	else if(!mode && typeof imCache[first + ',' + other] == 'boolean') {
		return imCache[first + ',' + other];
	}
	//非紧邻则若无相同样式或后声明有important更高优先级或后声明与中间夹杂的�?相同亦无影响
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
			//缓存
			if(imCache[i + ',' + (i + 1)]) {
				continue;
			}
			node[i].block.forEach(function(o) {
				var k = getK(o.key);
				if(hash[k]) {
					hash[k].p = Math.max(hash[k].p, o.impt ? 2 : 1);
					//多次出现不同值无�?��录，因为后声明的不可能同时等于两个�?，将其置true说明冲突
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
		//有child索引时仅�?��other样式的索引冲突，否则为other全部
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
		//缓存留以后用
		if(!mode) {
			imCache[first + ',' + other] = res;
			//如果first到other之间无优先级冲突，将first和other之间也做标记
			if(res) {
				for(var i = first + 1; i < other; i++) {
					imCache[i + ',' + other] = res;
				}
			}
		}
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
	//节点变化必须清空imcache
	imCache = {};
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
				//当无优先级冲突时可合并分�?��相同选择�?
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
			//以样式名+hack为键，去除hack的影�?
			var key = style.key;
			if(style.hack) {
				key += style.hack;
			}
			//优先级普通声明为1�?important�?，删除低优先级和先出现的
			var priority = style.impt ? 2 : 1;
			if(hash[o.s2s][key]) {
				if(priority >= hash[o.s2s][key].priority) {
					//置空后统�?��除，防止干扰index
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
	//后出现的普�?样式会覆盖掉前面的hack
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
		//从后�?��遍历，后面出现的总样式会覆盖掉前面的分样�?
		for(var i = o.block.length - 1; i >= 0; i--) {
			var style = o.block[i];
			//hack的分样式也会被覆盖，但hahc的�?样式没有覆盖权利
			var k = getK(style.key);
			if(k == style.key && keys[k] && !style.hack) {
				hash[o.s2s][k] = style.impt ? 2 : 1;
				//以下4个即可作为�?样式也可作为分样�?
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
			//后面的�?择器冒泡合并到第�?��上，并置�?
			for(var i = 0; i < queue.length - 1; i++) {
				for(var j = i + 1; j < queue.length; j++) {
					if(queue[i].n.block.length && queue[j].n.block.length && noImpact(node, queue[i].i, queue[j].i)) {
						queue[i].n.selectors = queue[i].n.selectors.concat(queue[j].n.selectors);
						sort(queue[i].n.selectors);
						queue[i].n.s2s = queue[i].n.selectors.join(',');
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
	//将只�?次出现的删除，多次出现的保留，将留下的组成一个二维数�?
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
		map.push(arr);
	});
	//同列相同部分视为�?��矩形面积，不同列拥有相同位置和高度可合并计算面积—�?即拥有相同样式的不同选择器�?优先取最大面积�?合并。当然至少要2列，因为1列为只出现在�?��选择器中没必要提
	//to do 面积择优算法。目前想到的复杂度过高，无法用于实际场景
	//舍弃之采用单行合并，即拥有某�?��样式的所有�?择器尝试合并，当然因为优先级冲突不一定能够整行合并，应该递归其所有组合尝试，代价太大暂时忽略
	var record = [];
	var insert = [];
	map.forEach(function(row, i) {
		var start = row.indexOf(1);
		var end = row.lastIndexOf(1);
		//列操作可能将后面的某行清空，判断�?
		if(start == end) {
			return;
		}
		var style = keys[i];
		var same = hash[style];
		//优先本行合并，若冲突，进行相邻列合并。因为相邻出现一定无冲突
		if(noImpact(node, start, end, same[same.length - 1].j)) {
			//没有冲突还要看合并后是否缩小体积，即减少的样式字数要比�?择器拼接�?
			var reduce = style.length * (same.length - 1);
			var add = 0;
			same.forEach(function(o, i) {
				add += o.parent.s2s.length;
			});
			//提取合并�?个�?择器之间会多1�?且样式表会多2个字符{}，抵消后为增加same.length
			if(reduce > add + same.length) {
				var ss = [];
				same.forEach(function(o) {
					ss = ss.concat(o.parent.selectors);
					record.push(o);
				});
				sort(ss);
				//插入提取合并结果的位置在第一个之�?
				insert.push({
					i: same[0].i + 1,
					selectors: ss,
					block: [same[0].parent.block[same[0].j]],
					s2s: ss.join(',')
				});
			}
			//本行清空
			for(var j = 0; j < row.length; j++) {
				row[j] = 0;
			}
		}
		else {
			for(var m = 0; m < row.length - 1; m++) {
				//相邻必须�?个以上才合并
				if(row[m] && row[m + 1]) {
					for(var n = m + 2; n < row.length; n++) {
						if(!row[n]) {
							break;
						}
					}
					//同时进行纵向相同可合并行搜索，即这些选择器拥有的相同样式合并
					var ri = [i];
					var reduce = style.length * (n - m - 1);
					for(var l = 0, compare = row.slice(m, n).join(''); l < map.length; l++) {
						if(l != i && map[l].slice(m, n).join('') == compare) {
							ri.push(l);
							reduce += keys[l].length * (n - m - 1);
						}
					}
					var add = 0;
					var first;
					same.forEach(function(o) {
						if(o.i > m && o.i < n) {
							if(!first) {
								first = o;
							}
							add += o.parent.s2s.length;
						}
					});
					if(reduce > add + n - m - 1) {
						var ss = [];
						same.forEach(function(o) {
							if(o.i >= m && o.i < n) {
								ss = ss.concat(o.parent.selectors);
								record.push(o);
							}
						});
						sort(ss);
						var ins = {
							i: first.i + 1,
							selectors: ss,
							block: [],
							s2s: ss.join(',')
						};
						ri.forEach(function(l) {
							var same = hash[keys[l]];
							for(var k = m; k < n; k++) {
								map[l][k] = 0;
							}
							ins.block.push(same[0].parent.block[same[0].j]);
						});
						insert.push(ins);
					}
					m = n;
				}
			}
		}
	});
	//清空记录的提取项，插入提取结�?
	record.forEach(function(o) {
		o.parent.block[o.j] = null;
	});
	sort(insert, function(a, b) {
		return a.i < b.i;
	});
	insert.forEach(function(o) {
		node.splice(o.i, 0, o);
	});
	clean(node);
	//再次合并因提取公因子产生的具有相同样式的选择�?
	if(insert.length) {
		union(node);
	}
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
	//合并相同选择�?
	merge(node);
	//去除同一选择器中重复样式声明
	duplicate(node);
	//去除同一选择器中被覆盖的样式声明
	override(node);
	//聚合相同样式的�?择器
	union(node);
	//提取公因�?
	extract(node);
	//结果
	join(node);
	return head + body;
}

exports.compress = compress;
