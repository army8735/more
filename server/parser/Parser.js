var Class = require('../util/Class'),
	character = require('../util/character'),
	Lexer = require('../lexer/Lexer'),
	Token = require('../lexer/Token'),
	Node = require('./Node'),
	Parser = Class(function(lexer) {
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
					if(this.tokens[this.index] && this.tokens[this.index].content() == ':') {
						this.look.type(Token.VARS);
						return this.vars();
					}
					else {
						this.error('unknow head rules');
					}
			}
		},
		impt: function() {
			var node = new Node(Node.IMPORT);
			node.add(this.match());
			node.add(this.url(true));
			if(['only', 'not', 'all', 'aural', 'braille', 'handheld', 'print', 'projection', 'screen', 'tty', 'embossed', 'tv'].indexOf(this.look.content()) != -1) {
				node.add(this.mediaQList());
			}
			node.add(this.match(';'));
			return node;
		},
		media: function() {
			var node = new Node(Node.MEDIA);
			node.add(this.match());
			if(!this.look) {
				return node;
			}
			if(['only', 'not', 'all', 'aural', 'braille', 'handheld', 'print', 'projection', 'screen', 'tty', 'embossed', 'tv'].indexOf(this.look.content()) != -1) {
				node.add(this.mediaQList());
			}
			else {
				return node;
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
			value.add(this.match(Token.ID));
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
			style.add(value);
			style.add(this.match(';'));
			node2.add(style);
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
			node.add(this.match(':'));
			node.add(this.match([Token.STRING, Token.NUMBER]));
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
			if(!this.look) {
				this.error();
			}
			if([Token.STRING, Token.ID].indexOf(this.look.type()) != -1) {
				node.add(this.match());
			}
			else if(['*', '>', '~', ':'].indexOf(this.look.content()) != -1) {
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
				else if(['*', '>', '~', ':'].indexOf(this.look.content()) != -1) {
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
				if(this.look.type() == Token.ID || ['*', '>', '~', ':'].indexOf(this.look.content()) != -1) {
					node.add(this.styleset());
				}
				else if(this.look.type() == Token.KEYWORD) {
					node.add(this.style());
				}
				else {
					break;
				}
			}
			node.add(this.match('}'));
			return node;
		},
		style: function() {
			var node = new Node(Node.STYLE);
			var key = this.key();
			node.add(key);
			node.add(this.match(':'));
			node.add(this.value(key));
			node.add(this.match(';'));
			return node;
		},
		key: function() {
			var node = new Node(Node.KEY);
			node.add(this.match(Token.KEYWORD));
			return node;
		},
		value: function(key) {
			var node = new Node(Node.VALUE);
			if(!this.look) {
				this.error();
			}
			var kw = key.leaves()[0].leaves().content().toLowerCase();
			if(/^[\-_*].*/.test(kw)) {
				if(/^-(webkit|moz|o|ms)-.*/.test(kw)) {
					kw = kw.replace(/^-(webkit|moz|o|ms)-/, '');
				}
				else {
					kw = kw.slice(1);
				}
			}
			switch(kw) {
				case 'background-attachment':
					node.add(this.match(['fixed', 'local', 'scroll']));
					while(this.look && this.look.content() == ',') {
						node.add(this.match());
						node.add(this.match(['fixed', 'local', 'scroll']));
					}
				break;
				case 'background-clip':
					node.add(this.match(['border-box', 'padding-box', 'content-box', 'text']));
					while(this.look && this.look.content() == ',') {
						node.add(this.match());
						node.add(this.match(['border-box', 'padding-box', 'content-box', 'text']));
					}
				break;
				case 'background-color':
					if(this.look.content() == 'transparent' || this.look.type() == Token.NUMBER) {
						node.add(this.match());
					}
					else {
						node.add(this.color());
					}
				break;
				case 'background-image':
					if(this.look.content() == 'none') {
						node.add(this.match());
					}
					else if(this.look.content() == 'url') {
						node.add(this.url());
					}
					else if(this.look.content() == 'linear-gradient') {
						node.add(this.lineargradient());
					}
				break;
				default:
					if([Token.VARS, Token.ID, Token.PROPERTY, Token.NUMBER, Token.STRING, Token.HEAD].indexOf(this.look.type()) > -1) {
						node.add(this.match());
					}
					else if([',', '(', ')', '/'].indexOf(this.look.content()) != -1) {
						node.add(this.match());
					}
					while(this.look) {
						if([Token.VARS, Token.ID, Token.PROPERTY, Token.NUMBER, Token.STRING, Token.HEAD].indexOf(this.look.type()) > -1) {
							node.add(this.match());
						}
						else if([',', '(', ')', '/'].indexOf(this.look.content()) != -1) {
							node.add(this.match());
						}
						else {
							break;
						}
					}
			}
			if(this.look && this.look.content() == '!important') {
				node.add(this.look);
			}
			return node;
		},
		color: function() {
			var node = new Node(Node.COLOR);
			if(!this.look) {
				this.error();
			}
			switch(this.look.content().toLowerCase()) {
				case 'rgb':
				case 'hsl':
					node.add(this.match());
					node.add(this.match('('));
					node.add(this.match([Token.VARS, Token.NUMBER, Token.HEAD]));
					node.add(this.match(','));
					node.add(this.match([Token.VARS, Token.NUMBER, Token.HEAD]));
					node.add(this.match(','));
					node.add(this.match([Token.VARS, Token.NUMBER, Token.HEAD]));
					node.add(this.match(')'));
				break;
				case 'rgba':
				case 'hsla':
					node.add(this.match());
					node.add(this.match('('));
					node.add(this.match([Token.VARS, Token.NUMBER, Token.HEAD]));
					node.add(this.match(','));
					node.add(this.match([Token.VARS, Token.NUMBER, Token.HEAD]));
					node.add(this.match(','));
					node.add(this.match([Token.VARS, Token.NUMBER, Token.HEAD]));
					node.add(this.match(','));
					node.add(this.match([Token.VARS, Token.NUMBER, Token.HEAD]));
					node.add(this.match(')'));
				break;
				default:
					if(this.look.type() == Token.NUMBER && /^#/.test(this.look.content())) {
						node.add(this.match());
					}
					else if([Token.VARS, Token.HEAD].indexOf(this.look.type()) > -1) {
						node.add(this.match());
					}
					else {
						this.error('not a color');
					}
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
		lineargradient: function() {
			var node = new Node(Node.LINEARGRADIENT);
			node.add(this.match('linear-gradient'));
			node.add(this.match('('));
			if(!this.look) {
				this.error();
			}
			var point = false;
			while(['left', 'right', 'top', 'bottom'].indexOf(this.look.content()) != -1 || (this.look.type() == Token.NUMBER && /deg$/.test(this.look.content()))) {
				node.add(this.match());
				point = true;
			}
			if(point) {
				node.add(this.match(','));
			}
			node.add(this.color());
			if([Token.VARS, Token.NUMBER, Token.HEAD].indexOf(this.look.type()) > -1) {
				node.add(this.match());
			}
			while(this.look && this.look.content() == ',') {
				node.add(this.match(','));
				node.add(this.color());
				if([Token.VARS, Token.NUMBER, Token.HEAD].indexOf(this.look.type()) > -1) {
					node.add(this.match());
				}
			}
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
