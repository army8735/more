var Class = require('../util/Class'),
	character = require('../util/character'),
	Lexer = require('../lexer/Lexer'),
	Token = require('../lexer/Token'),
	Node = require('./Node'),
	S = {};
S[Token.BLANK] = S[Token.TAB] = S[Token.COMMENT] = S[Token.LINE] = S[Token.ENTER] = true;
var Parser = Class(function(lexer) {
		this.lexer = lexer;
		this.look = null;
		this.tokens = null;
		this.lastLine = 1;
		this.lastCol = 1;
		this.line = 1;
		this.col = 1;
		this.index = 0;
		this.length = 0;
		this.ignores = {};
		this.invalids = {};
		this.node = null;
	}).methods({
		program: function() {
			this.tokens = this.lexer.tokens();
			this.length = this.tokens.length;
			if(this.tokens.length) {
				this.move();
			}
			this.node = new Node(Node.PROGRAME);
			while(this.look) {
				var element = this.element();
				if(element) {
					this.node.add(element);
				}
			}
			return this.node;
		},
		result: function() {
			return this.node;
		},
		element: function() {
			if(this.look.type() == Token.HEAD) {
				return this.head();
			}
			else if(this.look.type() == Token.VARS) {
				return this.vars();
			}
			else if(['}', ';', ','].indexOf(this.look.content()) > -1) {
				return this.match();
			}
			else {
				return this.styleset();
			}
		},
		head: function() {
			switch(this.look.content()) {
				case '@import':
					return this.impt();
				case '@media':
					return this.media();
				case '@charset':
					return this.charset();
				case '@font-face':
					return this.fontface();
				case '@keyframes':
					return this.kframes();
				case '@page':
					return this.page();
				default:
					//兼容less
					this.look.type(Token.VARS);
					return this.vars();
			}
		},
		impt: function() {
			var node = new Node(Node.IMPORT);
			node.add(this.match());
			node.add(this.url(true));
			var m = {
				'only': true,
				'not': true,
				'all': true,
				'aural': true,
				'braille': true,
				'handheld': true,
				'print': true,
				'projection': true,
				'screen': true,
				'tty': true,
				'embossed': true,
				'tv': true
			};
			if(m[this.look.content()]) {
				node.add(this.mediaQList());
			}
			node.add(this.match(';'));
			return node;
		},
		media: function() {
			var node = new Node(Node.MEDIA);
			node.add(this.match());
			var m = {
				'only': true,
				'not': true,
				'all': true,
				'aural': true,
				'braille': true,
				'handheld': true,
				'print': true,
				'projection': true,
				'screen': true,
				'tty': true,
				'embossed': true,
				'tv': true,
				'(': true
			};
			if(!this.look) {
				return node;
			}
			if(m[this.look.content()]) {
				node.add(this.mediaQList());
			}
			while(this.look && this.look.content() == ',') {
				node.add(this.match());
				node.add(this.mediaQList());
			}
			if(this.look && this.look.content() == '{') {
				node.add(this.block());
			}
			return node;
		},
		mediaQList: function() {
			var node = new Node(Node.MEDIAQLIST);
			if(['only', 'not'].indexOf(this.look.content()) != -1) {
				node.add(this.match());
			}
			if(!this.look) {
				return node;
			}
			if(this.look.type() == Token.PROPERTY) {
				node.add(this.match(Token.PROPERTY));
			}
			else if(this.look.content() == '(') {
				node.add(this.expr());
			}
			else {
				return node;
			}
			while(this.look && this.look.content() == 'and') {
				node.add(this.match());
				node.add(this.expr());
			}
			return node;
		},
		expr: function() {
			var node = new Node(Node.EXPR);
			node.add(this.match('('));
			var key = new Node(Node.KEY);
			key.add(this.match(Token.KEYWORD));
			node.add(key);
			node.add(this.match(':'));
			var value = new Node(Node.VALUE);
			if([Token.PROPERTY, Token.NUMBER, Token.SIGN].indexOf(this.look.type())== -1) {
				this.error('missing value');
			}
			while(this.look && this.look.content() != ')' && [Token.PROPERTY, Token.NUMBER, Token.SIGN].indexOf(this.look.type()) > -1) {
				value.add(this.match());
			}
			node.add(value);
			node.add(this.match(')'));
			return node;
		},
		charset: function() {
			var node = new Node(Node.CHARSET);
			node.add(this.match());
			node.add(this.match(Token.STRING));
			node.add(this.match(';'));
			return node;
		},
		fontface: function() {
			var node = new Node(Node.FONTFACE);
			node.add(this.match());
			var node2 = new Node(Node.BLOCK);
			node2.add(this.match('{'));
			var style = new Node(Node.STYLE);
			var key = new Node(Node.KEY);
			var value = new Node(Node.VALUE);
			key.add(this.match('font-family'));
			style.add(key);
			style.add(this.match(':'));
			if(this.look.type() == Token.STRING) {
				value.add(this.match());
			}
			else {
				value.add(this.match(Token.ID));
			}
			style.add(value);
			style.add(this.match(';'));
			node2.add(style);
			style = new Node(Node.STYLE);
			key = new Node(Node.KEY);
			value = new Node(Node.VALUE);
			key.add(this.match('src'));
			style.add(key);
			style.add(this.match(':'));
			value.add(this.url());
			if(this.look && this.look.content() == 'format') {
				value.add(this.format());
			}
			while(this.look && this.look.content() == ',') {
				value.add(this.match());
				value.add(this.url());
				if(this.look && this.look.content() == 'format') {
					value.add(this.format());
				}
			}
			style.add(value);
			style.add(this.match(';'));
			node2.add(style);
			while(this.look && this.look.content() == 'src') {
				style = new Node(Node.STYLE);
				key = new Node(Node.KEY);
				value = new Node(Node.VALUE);
				key.add(this.match('src'));
				style.add(key);
				style.add(this.match(':'));
				value.add(this.url());
				if(this.look && this.look.content() == 'format') {
					value.add(this.format());
				}
				while(this.look && this.look.content() == ',') {
					value.add(this.match());
					value.add(this.url());
					if(this.look && this.look.content() == 'format') {
						value.add(this.format());
					}
				}
				style.add(value);
				style.add(this.match(';'));
				node2.add(style);
			}
			while(this.look && this.look.content() != '}') {
				node2.add(this.style());
			}
			node2.add(this.match('}'));
			node.add(node2);
			return node;
		},
		kframes: function() {
			var node = new Node(Node.KEYFRAMES);
			node.add(this.match());
			node.add(this.match(Token.ID));
			var node2 = new Node(Node.BLOCK);
			node2.add(this.match('{'));
			while(this.look && [Token.ID, Token.NUMBER].indexOf(this.look.type()) != -1) {
				node2.add(this.styleset(true));
			}
			node2.add(this.match('}'));
			node.add(node2);
			return node;
		},
		page: function() {
			var node = new Node(Node.PAGE);
			node.add(this.match());
			node.add(this.styleset());
			return node;
		},
		vars: function() {
			var node = new Node(Node.VARS);
			node.add(this.match());
			if([':', '='].indexOf(this.look.content()) > -1) {
				node.add(this.match());
			}
			node.add(this.value());
			node.add(this.match(';'));
			return node;
		},
		styleset: function(numCanBeKey) {
			var node = new Node(Node.STYLESET);
			node.add(this.selectors(numCanBeKey));
			node.add(this.block());
			return node;
		},
		selectors: function(numCanBeKey) {
			var node = new Node(Node.SELECTORS);
			node.add(this.selector(numCanBeKey));
			while(this.look && this.look.content() == ',') {
				node.add(this.match());
				node.add(this.selector(numCanBeKey));
			}
			return node;
		},
		selector: function(numCanBeKey) {
			var node = new Node(Node.SELECTOR);
			var sign = {
				'*': true,
				'>': true,
				'~': true,
				'::': true,
				':': true,
				'[': true,
				']': true,
				'$=': true,
				'|=': true,
				'*=': true,
				'~=': true,
				'^=': true,
				'=': true,
				'(': true,
				')': true
			};
			if(!this.look) {
				this.error();
			}
			if([Token.STRING, Token.ID].indexOf(this.look.type()) != -1) {
				node.add(this.match());
			}
			else if(sign[this.look.content()]) {
				node.add(this.match());
			}
			else if(numCanBeKey && this.look.type() == Token.NUMBER) {
				node.add(this.match());
			}
			else {
				this.error();
			}
			while(this.look) {
				if([Token.STRING, Token.ID].indexOf(this.look.type()) != -1) {
					node.add(this.match());
				}
				else if(sign[this.look.content()]) {
					node.add(this.match());
				}
				else {
					break;
				}
			}
			return node;
		},
		block: function() {
			var node = new Node(Node.BLOCK);
			node.add(this.match('{'));
			while(this.look) {
				if(this.look.type() == Token.ID) {
					for(var i = this.index; i < this.length; i++) {
						var token = this.tokens[i];
						if(!S[token.type()]) {
							if(token.content() == ':') {
								node.add(this.style(true));
							}
							else {
								node.add(this.styleset());
							}
							break;
						}
					}
				}
				else if(['*', '>', '~', ':', '&'].indexOf(this.look.content()) != -1) {
					node.add(this.styleset());
				}
				else if(this.look.type() == Token.KEYWORD) {
					node.add(this.style());
				}
				else if(this.look.content() == ';') {
					node.add(this.match());
				}
				else if(this.look.content() == '@extend') {
					node.add(this.extend());
				}
				else if(this.look.type() == Token.VARS) {
					node.add(this.match());
				}
				else {
					break;
				}
			}
			node.add(this.match('}'));
			return node;
		},
		extend: function() {
			var node = new Node(Node.EXTEND);
			node.add(this.match());
			node.add(this.selectors());
			node.add(this.match(';'));
			return node;
		},
		style: function(unknow) {
			var node = new Node(Node.STYLE);
			node.add(this.key(unknow));
			node.add(this.match(':'));
			node.add(this.value());
			node.add(this.match(';'));
			return node;
		},
		key: function(unknow) {
			var node = new Node(Node.KEY);
			if(unknow) {
				node.add(this.match(Token.ID));
			}
			else {
				node.add(this.match(Token.KEYWORD));
			}
			return node;
		},
		value: function() {
			var node = new Node(Node.VALUE);
			if(!this.look) {
				this.error();
			}
			if([Token.VARS, Token.ID, Token.PROPERTY, Token.NUMBER, Token.STRING, Token.HEAD].indexOf(this.look.type()) > -1) {
				node.add(this.match());
			}
			else if(['(', ')', '/', '~'].indexOf(this.look.content()) != -1) {
				node.add(this.match());
			}
			while(this.look) {
				if([Token.VARS, Token.ID, Token.PROPERTY, Token.NUMBER, Token.STRING, Token.HEAD, Token.KEYWORD].indexOf(this.look.type()) > -1) {
					node.add(this.match());
				}
				else if([',', '(', ')', '/', '=', ':'].indexOf(this.look.content()) != -1) {
					node.add(this.match());
				}
				else {
					break;
				}
			}
			if(this.look && this.look.type() == Token.HACK) {
				node.add(this.match());
			}
			if(this.look && this.look.type() == Token.IMPORTANT) {
				node.add(this.match());
			}
			return node;
		},
		url: function(ellipsis) {
			if(!this.look) {
				this.error();
			}
			var node = new Node(Node.URL);
			if(ellipsis && this.look.type() == Token.STRING) {
				if(['"', '"'].indexOf(this.look.content().charAt(0)) > -1) {
					node.add(this.match());
				}
				else {
					this.error('missing quotation');
				}
			}
			else {
				node.add(
					this.match('url'),
					this.match('('),
					this.match([Token.VARS, Token.STRING, Token.HEAD]),
					this.match(')')
				);
			}
			return node;
		},
		format: function() {
			var node = new Node(Node.FORMAT);
			node.add(this.match());
			node.add(this.match('('));
			node.add(this.match(Token.STRING));
			node.add(this.match(')'));
			return node;
		},
		match: function(type, msg) {
			//未定义为所有
			if(character.isUndefined(type)) {
				if(this.look) {
					var l = this.look;
					this.move();
					return new Node(Node.TOKEN, l);
				}
				else {
					this.error('syntax error' + (msg || ''));
				}
			}
			//数组为其中一个即可
			else if(Array.isArray(type)) {
				if(this.look) {
					for(var i = 0, len = type.length; i < len; i++) {
						var t = type[i];
						if(typeof t == 'string' && this.look.content() == t) {
							var l = this.look;
							this.move();
							return new Node(Node.TOKEN, l);
						}
						else if(typeof t == 'number' && this.look.type() == t) {
							var l = this.look;
							this.move();
							return new Node(Node.TOKEN, l);
						}
					}
				}
				this.error('missing ' + type.join('|') + (msg || ''));
			}
			//或者根据token的type或者content匹配
			else if(typeof type == 'string') {
				if(this.look && this.look.content() == type) {
					var l = this.look;
					this.move();
					return new Node(Node.TOKEN, l);
				}
				else if(type == ';' && this.look && this.look.content() == '}') {
					var l = new Token(Token.VIRTUAL, ';');
					return new Node(Node.TOKEN, l);
				}
				else {
					this.error('missing ' + type + (msg || ''));
				}
			}
			else if(typeof type == 'number') {
				if(this.look && this.look.type() == type) {
					var l = this.look;
					this.move();
					return new Node(Node.TOKEN, l);
				}
				else {
					this.error('missing ' + Token.type(type) + (msg || ''));
				}
			}
		},
		error: function(msg) {
			msg = 'SyntaxError: ' + (msg || ' syntax error');
			throw new Error(msg + ' line ' + this.lastLine + ' col ' + this.lastCol);
		},
		move: function() {
			this.lastLine = this.line;
			this.lastCol = this.col;
			do {
				this.look = this.tokens[this.index++];
				if(!this.look) {
					return;
				}
				//存下忽略的token
				if([Token.BLANK, Token.TAB, Token.ENTER, Token.LINE, Token.COMMENT, Token.IGNORE].indexOf(this.look.type()) != -1) {
					this.ignores[this.index - 1] = this.look;
				}
				if(this.look.type() == Token.LINE) {
					this.line++;
					this.col = 1;
				}
				else if(this.look.type() == Token.COMMENT) {
					var s = this.look.content(),
						n = character.count(s, character.LINE);
					if(n > 0) {
						this.line += n;
						var i = s.lastIndexOf(character.LINE);
						this.col += s.length - i - 1;
					}
				}
				else if(this.look.type() == Token.IGNORE) {
					var s = this.look.content(),
						n = character.count(s, character.LINE);
					if(n > 0) {
						this.line += n;
						var i = s.lastIndexOf(character.LINE);
						this.col += s.length - i - 1;
					}
				}
				else {
					this.col += this.look.content().length;
					if([Token.BLANK, Token.TAB, Token.ENTER].indexOf(this.look.type()) == -1) {
						break;
					}
				}
			} while(this.index <= this.length);
		},
		ignore: function() {
			return this.ignores;
		},
		invalid: function() {
			return this.invalids;
		}
	});
module.exports = Parser;
