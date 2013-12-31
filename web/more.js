define(function(require, exports) {
	var CssLexer = require('./lexer/CssLexer'),
		CssRule = require('./lexer/rule/CssRule'),
		Token = require('./lexer/Token'),
		Parser = require('./parser/Parser'),
		Node = require('./parser/Node'),
		Func = require('./parser/Func'),
		character = require('./util/character'),
		compress = require('./compress'),
		cleanCSS = require('clean-css'),
		fs = require('fs'),
		suffix = 'css',
		res,
		node,
		token,
		index,
		preIndex,
		preIndex2,
		stack,
		varHash,
		imports,
		autoSplit,
		exHash,
		styleMap,
		funcMap,
		levels,
		exArr,
		global;

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
		preIndex2 = preIndex = index;
		stack = [];
		varHash = {};
		imports = [];
		autoSplit = false;
		exHash = {};
		styleMap = {};
		funcMap = {};
		levels = [];
		exArr = [];
		global = global || {};
	}
	function preVar(node, ignore) {
		var isToken = node.name() == Node.TOKEN;
		var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
		if(!isToken) {
			if(node.name() == Node.VARS) {
				var leaves = node.leaves(),
					k = leaves[0].leaves().content().slice(1),
					v = '';
				while(ignore[++preIndex]) {}
				while(ignore[++preIndex]) {}
				leaves[2].leaves().forEach(function(leaf) {
					var token = leaf.leaves();
					v += replaceVar(token.content(), token.type());
					while(ignore[++preIndex]) {
						v += ignore[preIndex].content();
					}
				});
				while(ignore[++preIndex]) {}
				varHash[k] = v;
			}
			else {
				node.leaves().forEach(function(leaf) {
					preVar(leaf, ignore);
				});
			}
		}
		else if(!isVirtual) {
			while(ignore[++preIndex]) {}
		}
	}
	function replaceVar(s, type) {
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
							var vara = varHash[c] || global[c];
							if(vara) {
								s = s.slice(0, i) + (type == Token.STRING && /^['"]/.test(s) ? vara.replace(/^(['"])(.*)\1$/, '$2') : vara) + s.slice(j + 1);
							}
						}
					}
					else if(/[\w-]/.test(c)) {
						c = /^[\w-]+/.exec(s.slice(i + 1))[0];
						var vara = varHash[c] || global[c];
						if(vara) {
							s = s.slice(0, i) + (type == Token.STRING && /^['"]/.test(s) ? vara.replace(/^(['"])(.*)\1$/, '$2') : vara) + s.slice(i + c.length + 1);
						}
					}
				}
			}
		}
		return s;
	}
	function preFn(node, ignore) {
		var isToken = node.name() == Node.TOKEN;
		var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
		if(!isToken) {
			if(node.name() == Node.FN) {
				var leaves = node.leaves();
				if(leaves[0].leaves().type() != Token.VIRTUAL) {
					while(ignore[++preIndex2]) {}
				}
				var id = leaves[1].leaves().content();
				while(ignore[++preIndex2]) {}
				var params = leaves[3].leaves();
				while(ignore[++preIndex2]) {}
				var p = [];
				var phash = {};
				params.forEach(function(o, i) {
					if(i % 2 == 0) {
						var v = o.leaves().content();
						p.push(v);
						phash[v] = Math.floor(i / 2);
					}
					while(ignore[++preIndex2]) {}
				});
				while(ignore[++preIndex2]) {}
				var block = leaves[5];
				var b = block.leaves().slice(0);
				b.shift();
				while(ignore[++preIndex2]) {}
				b.pop();
				var s = '';
				var fhash = {};
				b.forEach(function(style) {
					style = style.leaves();
					var key = style[0].leaves()[0].leaves();
					s += key.content();
					while(ignore[++preIndex2]) {
						var ig = ignore[preIndex2];
						s += ig.content().replace(/[\r\n]/g, '');
					}
					s += style[1].leaves().content();
					while(ignore[++preIndex2]) {
						var ig = ignore[preIndex2];
						s += ig.content().replace(/[\r\n]/g, '');
					}
					var values = style[2].leaves();
					values.forEach(function(value) {
						var v = value.leaves().content();
						var noDollar = v.replace(/^$/, '');
						if(phash.hasOwnProperty(noDollar) || phash.hasOwnProperty('$' + noDollar)) {
							fhash[s.length] = {
								v: v
							};
							if(phash.hasOwnProperty(noDollar)) {
								fhash[s.length].index = phash[noDollar];
							}
							else {
								fhash[s.length].index = phash['$' + noDollar];
							}
						}
						s += v;
						while(ignore[++preIndex2]) {
							var ig = ignore[preIndex2];
							s += ig.content().replace(/[\r\n]/g, '');
						}
					});
					var end = style[3].leaves();
					if(end.type() != Node.VIRTUAL) {
						s += end.content();
						while(ignore[++preIndex2]) {
							var ig = ignore[preIndex2];
							s += ig.content().replace(/[\r\n]/g, '');
						}
					}
				});
				while(ignore[++preIndex2]) {}
				funcMap[id] = new Func(id, p, phash, s, fhash);
			}
			else {
				node.leaves().forEach(function(leaf) {
					preFn(leaf, ignore);
				});
			}
		}
		else if(!isVirtual) {
			while(ignore[++preIndex2]) {}
		}
	}
	function join(node, ignore, inHead, isSelectors, isSelector, isVar, isImport, isExtend, isFunc, prev, next) {
		var isToken = node.name() == Node.TOKEN,
			isVirtual = isToken && node.token().type() == Token.VIRTUAL;
		if(isToken) {
			if(!isVirtual) {
				var token = node.token();
				if(inHead) {
					var s = replaceVar(token.content(), token.type());
					if(isImport && token.type() == Token.STRING) {
						if(!/\.css['"]?$/.test(s)) {
							s = s.replace(/(['"]?)$/, '.css$1');
							imports.push(token.val() + '.css');
						}
						else {
							imports.push(token.val());
						}
						//兼容less，相对路径为根路径
						if(less) {
							if(/^(['"]?)\//.test(s)) {
								s = s.replace(/^(['"]?)\//, '$1' + root);
							}
							else {
								s = s.replace(/^(['"]?)([\w-])/, '$1' + root + '$2');
							}
						}
						else {
							s = s.replace(/^(['"]?)\//, '$1' + root);
						}
					}
					res += s;
				}
				else if(isVar) {
					//忽略变量声明
				}
				else if(isSelectors || isSelector && !isExtend) {
					var temp = stack[stack.length - 1];
					if(isSelectors) {
						temp.push('');
					}
					else {
						temp[temp.length - 1] += token.content();
					}
				}
				//继承和方法直接忽略
				else if(!isExtend && !isFunc) {
					//兼容less的~String拆分语法
					if(autoSplit && token.type() == Token.STRING) {
						var s = token.content();
						var c = s.charAt(0);
						if(c != "'" && c != '"') {
							c = '"';
							s = c + s + c;
						}
						s = s.replace(/,/g, c + ',' + c);
						res = res.replace(/~\s*$/, '');
						res += replaceVar(s, token.type());
					}
					else {
						res += replaceVar(token.content(), token.type());
					}
					if(token.content() == '~') {
						autoSplit = true;
					}
					else {
						autoSplit = false;
					}
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
			isSelectors = node.name() == Node.SELECTORS;
			isSelector = node.name() == Node.SELECTOR;
			if(!inHead && [Node.FONTFACE, Node.MEDIA, Node.CHARSET, Node.IMPORT, Node.PAGE, Node.KEYFRAMES].indexOf(node.name()) != -1) {
				inHead = true;
				if(node.name() == Node.IMPORT) {
					isImport = true;
				}
			}
			else if(node.name() == Node.VARS) {
				isVar = true;
			}
			//将层级拆开
			else if(node.name() == Node.STYLESET && !inHead) {
				styleset(true, node, prev, next);
			}
			else if(node.name() == Node.BLOCK && !inHead) {
				block(true, node);
			}
			else if(node.name() == Node.EXTEND) {
				//占位符
				res += '@extend';
				isExtend = true;
				record(node);
			}
			else if(node.name() == Node.FN) {
				isFunc = true;
			}
			var leaves = node.leaves();
			//递归子节点
			leaves.forEach(function(leaf, i) {
				join(leaf, ignore, inHead, isSelectors, isSelector, isVar, isImport, isExtend, isFunc, leaves[i - 1], leaves[i + 1]);
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
			if(levels.length) {
				exHash[levels[levels.length - 1]].end.push(res.lastIndexOf('}'));
			}
		}
		else {
			stack.pop();
			if(stack.length) {
				//当多级styleset结束时下个还是styleset或}，会造成空白样式表
				if(next && next.name() == Node.STYLESET) {
				}
				else {
					res += concatSt(0, '', [], true).join(',') + '{';
				}
			}
			if(levels.length) {
				exHash[levels[levels.length - 1]].start.push(res.length);
			}
		}
		//去除层级造成的空样式
		if(/{}([\s\r\n]*)$/.test(res)) {
			var i = res.lastIndexOf('{');
			i = res.lastIndexOf('}', i);
			if(i == -1) {
				i = 0;
			}
			res = res.slice(0, i) + res.slice(i).replace(/([\s\r\n]*)[^}]+{}([\s\r\n]*)$/, '$1$2');
		}
	}
	function block(startOrEnd, node) {
		if(startOrEnd) {
			var s = concatSt(0, '', [], stack.length > 1).join(',').replace(/\s*&\s*/g, ''); 
			res += s;
			exHash[s] = {
				start: [res.length + 1],
				end: []
			};
			levels.push(s);
		}
		else {
			exHash[levels[levels.length - 1]].end.push(res.lastIndexOf('}'));
			levels.pop();
		}
	}
	function getSimpleSelector(s) {
		s = s.trim().replace(/\s{2,}/g, ' ').replace(/\s+:/g, ':').replace(/\s+\[/g, '[').replace(/\]\s+/g, ']').replace(/\s*([>+~\]])+\s*/g, '$1');
		return s.split(',');
	}
	function record(node) {
		var s = '';
		node.leaves()[1].leaves().forEach(function(selector, i) {
			if(i % 2 == 0) {
				selector.leaves().forEach(function(token, j) {
					token = token.leaves();
					s += ' ' + token.content();
				});
			}
			else {
				s += ',';
			}
		});
		exArr.push({
			index: res.length,
			fathers: getSimpleSelector(s),
			selectors: getSimpleSelector(levels[levels.length - 1])
		});
	}
	function dealExtend(selector, father, hash, list) {
		hash = hash || {};
		list = list || [selector];
		if(hash[selector]) {
			throw new Error('cyclic extend:\n' + list.join('\n'));
		}
		hash[selector] = true;
		list.push(father);
		styleMap[selector] += styleMap[father] || '';
	}
	function extend() {
		Object.keys(exHash).forEach(function(s) {
			var o = exHash[s];
			var selectors = getSimpleSelector(s);
			var v = '';
			o.start.forEach(function(start, i) {
				v += res.slice(start, o.end[i]).replace(/\s*\n\s*/g, '').trim();
			});
			selectors.forEach(function(selector) {
				styleMap[selector] = v;
			});
		});
		exArr.forEach(function(o) {
			o.selectors.forEach(function(selector) {
				o.fathers.forEach(function(father) {
					dealExtend(selector, father);
				});
			});
		});
		for(var i = exArr.length - 1; i >= 0; i--) {
			var o = exArr[i];
			var s = '';
			var after = '';
			o.fathers.forEach(function(father, l) {
				s += styleMap[father] || '';
				//将father的子选择器们进行深度继承
				Object.keys(styleMap).forEach(function(k, m) {
					if(k.indexOf(father) == 0 && k != father) {
						o.selectors.forEach(function(se, n) {
							var ke = se + k.slice(father.length);
							var v = styleMap[k];
							after += ke + '{' + v + '}';
						});
					}
				});
			});
			if(after) {
				var end = res.indexOf('}', o.index) + 1;
				if(end == -1) {
					end = res.length;
				}
				res = res.slice(0, end) + after + res.slice(end);
			}
			//去掉@extend占位符
			res = res.slice(0, o.index - 7) + s + res.slice(o.index);
		}
	}

	exports.parse = function(code, vars, style, func) {
		vars = vars || {};
		style = style || {};
		func = func || {};
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
		//传入初始化变量
		Object.keys(vars).forEach(function(k) {
			varHash[k] = vars[k];
		});
		//传入初始化继承
		Object.keys(style).forEach(function(k) {
			styleMap[k] = style[k];
		});
		//传入初始化函数
		Object.keys(func).forEach(function(k) {
			funcMap[k] = style[k];
		});
		preVar(node, ignore);
		preFn(node, ignore);
		join(node, ignore);
		extend();
		return character.escapeHTML(res);
	};
	exports.tree = function() {
		return node;
	};
	exports.token = function() {
		return token;
	};
	exports.vars = function() {
		return varHash;
	};
	exports.global = function(g) {
		global = g;
		return global;
	};
	var less;
	exports.less = function(l) {
		less = l;
		return less;
	};
	exports.imports = function() {
		return imports;
	};
	exports.styles = function() {
		return styleMap;
	};
	exports.fns = function() {
		return funcMap;
	};
	exports.compress = function(src, agressive) {
		src = src || '';
		if(cleanCSS.process) {
			src = cleanCSS.process(src, {
				removeEmpty: true
			});
		}
		if(agressive) {
			src = compress.compress(src);
		}
		return src;
	};
	var localRoot = '';
	exports.localRoot = function(r) {
		if(r) {
			localRoot = r;
		}
		return localRoot;
	};
	var root = '';
	exports.root = function(r) {
		if(r) {
			if(r.charAt(0) != '/') r = '/' + r;
			if(r.lastIndexOf('/') != r.length - 1) r += '/';
			root = r;
		}
		return root;
	};
	exports.suffix = function(s) {
		if(s) {
			suffix = s;
		}
		return suffix;
	};
	function removeImport(s) {
		//0初始，1字符串
		var state = 0;
		for(var i = 0; i < s.length; i++) {
			var c = s.charAt(i);
			if(c == '/') {
				c = s.charAt(i + 1);
				if(c == '/') {
					i = s.indexOf('\n', i + 2);
					if(i == -1) {
						i = s.length;
					}
				}
				else if(c == '*') {
					i = s.indexOf('*/', i + 2);
					if(i == -1) {
						i = s.length;
					}
				}
			}
			else if(c == '"' || c == "'") {
				for(var j = i + 1; j < s.length; j++) {
					var c2 = s.charAt(j);
					if(c == c2) {
						i = j;
						break;
					}
					else if(c2 == '\\') {
						j++;
					}
				}
			}
			else if(c == '@' && s.slice(i, i + 7) == '@import') {
				var j = s.indexOf(';', i + 7) + 1;
				s = s.slice(0, i) + s.slice(j);
			}
		}
		return s;
	}
	function build(file, res, noImport, depth) {
		depth = depth || 1;
		if(suffix != 'css') {
			file = file.replace(/\.css$/, '.' + suffix);
		}
		var s = fs.readFileSync(file, {
			encoding: 'utf-8'
		});
		var cur = file.replace(/[\w-]+\.(less|css)$/, '');
		s = module.exports.parse(s, buildHash[file]);
		if(!noImport) {
			s = removeImport(s);
			var impts = module.exports.imports();
			var vars = module.exports.vars();
			impts.forEach(function(impt) {
				if(less) {
					if(impt.charAt(0) == '.') {
						impt = cur + impt.replace(/[\w-]+\.\css$/g, '');
						while(impt.indexOf('../') > 0)
							impt = impt.replace(/[\w-.]+[\\/]\.\.\//, '');
						impt = impt.replace(/\.\//g, '');
					}
					else {
						if(!localRoot) {
							throw new Error('构建@import的相对根路径文件需要首先设置root:\n' + file + ' -> ' + impt);
						}
						impt = localRoot.replace(/[/\\]$/, '') + '/' + impt.replace(/^[/\\]/, '');
					}
				}
				else {
					if(impt.charAt(0) == '/') {
						if(!localRoot) {
							throw new Error('构建@import的相对根路径文件需要首先设置root:\n' + file + ' -> ' + impt);
						}
						impt = localRoot.replace(/[/\\]$/, '') + impt;
					}
					else {
						impt = cur + impt.replace(/[\w-]+\.\css$/g, '');
						while(impt.indexOf('../') > 0)
							impt = impt.replace(/[\w-.]+[\\/]\.\.\//, '');
						impt = impt.replace(/\.\//g, '');
					}
				}
				var trace = '';
				for(var i = 0; i < depth; i++) trace += '\t';
				if(suffix != 'css') {
					console.log(trace + impt.replace(/\.css$/, '.' + suffix));
				}
				else {
					console.log(trace + impt);
				}
				buildHash[impt] = vars;
				build(impt, res, noImport, depth+1);
			});
		}
		res.push(s);
	}
	var buildHash;
	exports.build = function(file, noImport) {
		buildHash = {};
		var res = [];
		if(fs.readFileSync) {
			build(file, res, noImport);
		}
		return res.join('');
	}
});