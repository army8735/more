define(function(require, exports, module) {
	var Lexer = require('./Lexer'),
		Token = require('./Token'),
		character = require('../util/character'),
		CssLexer = Lexer.extend(function(rule) {
			Lexer.call(this, rule);
			this.isValue = false;
			this.parenthese = false;
			this.isUrl = false;
		}).methods({
			//@override
			scan: function(temp) {
				var length = this.code.length,
					count = 0;
				outer:
				while(this.index < length) {
					if(this.cacheLine > 0 && count >= this.cacheLine) {
						break;
					}
					this.readch();
					for(var i = 0, matches = this.rule.matches(), len = matches.length; i < len; i++) {
						var match = matches[i];
						if(match.match(this.peek, this.code, this.index)) {
							var token = new Token(match.tokenType(), match.content(), match.val()),
								matchLen = match.content().length;
							//(之后的字符串可省略"号
							if(this.parenthese) {
								if([Token.BLANK, Token.TAB, Token.LINE, Token.ENTER].indexOf(token.type()) != -1) {
									//
								}
								else if(token.type() == Token.STRING) {
									//
								}
								else if(token.content() == ')') {
									this.parenthese = false;
								}
								else {
									this.dealPt(temp);
									continue outer;
								}
							}
							//将id区分出属性名和属性值
							if(token.type() == Token.ID) {
								//ie hack也算关键字
								if(/[*\-_]/.test(token.content().charAt(0))) {
									if(this.rule.keyWords().hasOwnProperty(token.content().slice(1))) {
										token.type(Token.KEYWORD);
									}
								}
								else {
									//分属性和值
									if(this.rule.keyWords().hasOwnProperty(token.content())) {
										token.type(Token.KEYWORD);
									}
									else {
										var s = token.content();
										if(/\\\d$/.test(s)) {
											s = s.slice(0, s.length - 2);
										}
										else if(/!important$/.test(s)) {
											s = s.slice(0, s.length - 10);
										}
										if(this.rule.values().hasOwnProperty(s)) {
											token.type(Token.PROPERTY);
										}
									}
								}
							}
							//@import和@media之后进入值状态
							if(token.type() == Token.HEAD && ['@import', '@media'].indexOf(token.content()) != -1) {
								this.isValue = true;
							}
							else if(token.type() == Token.SIGN) {
								if(token.content() == ':') {
									this.isValue = true;
								}
								else if(token.content() == ';' || token.content == '}' || token.content == '{') {
									this.isValue = false;
								}
								else if(token.content() == '(' && this.isUrl) {
									this.parenthese = true;
								}
							}
							//非值状态的属性被当作id
							if(token.type() == Token.PROPERTY && !this.isValue) {
								token.type(Token.ID);
							}
							//非值状态的数字被当作id
							if(token.type() == Token.NUMBER && !this.isValue && token.content().charAt(0) == '#') {
								token.type(Token.ID);
							}
							if(token.content() == 'url') {
								this.isUrl = true;
							}
							else if([Token.BLANK, Token.TAB, Token.ENTER, Token.LINE, Token.COMMENT].indexOf(token.type()) != -1) {
								this.isUrl = false;
							}
							this.isUrl = token.content() == 'url';
							temp.push(token);
							this.tokenList.push(token);
							this.index += matchLen - 1;
							var n = character.count(token.val(), character.LINE);
							count += n;
							this.totalLine += n;
							if(n) {
								var i = match.content().indexOf(character.LINE),
									j = match.content().lastIndexOf(character.LINE);
								this.colMax = Math.max(this.colMax, this.colNum + i);
								this.colNum = match.content().length - j;
							}
							else {
								this.colNum += matchLen;
							}
							this.colMax = Math.max(this.colMax, this.colNum);
							continue outer;
						}
					}
					if(this.parenthese) {
						this.dealPt(temp);
						continue outer;
					}
					//如果有未匹配的，css默认忽略，查找下一个;
					var j = this.code.indexOf(';', this.index);
					if(j == -1) {
						j = this.code.length;
					}
					var s = this.code.slice(this.index - 1, ++j);
					var token = new Token(Token.IGNORE, s);
					temp.push(token);
					this.tokenList.push(token);
					this.index = j;
				}
				return this;
			},
			dealPt: function(temp) {
				var k = this.code.indexOf(')', this.index);
				//()未结束直接跳出
				if(k == -1) {
					var token = new Token(Token.IGNORE, this.code.slice(this.index - 1, this.code.length));
					temp.push(token);
					this.tokenList.push(token);
					this.index = this.code.length;
					var n = character.count(token.val(), character.LINE);
					if(n > 0) {
						var i = token.content().indexOf(character.LINE),
							j = token.content().lastIndexOf(character.LINE);
						this.colMax = Math.max(this.colMax, this.colNum + i);
						this.colNum = match.content().length - j;
					}
					else {
						this.colNum += token.content().length;
					}
					this.colMax = Math.max(this.colMax, this.colNum);
					return;
				}
				var s = this.code.slice(this.index - 1, k),
					reg = /[\s\r\n]+\)$/.exec(s);
				//)之前的空白要判断
				if(reg) {
					s = s.slice(0, s.length - reg[0].length);
				}
				var token = new Token(Token.STRING, s);
				temp.push(token);
				this.tokenList.push(token);
				this.index += s.length - 1;
				this.parenthese = false;
				var n = character.count(token.val(), character.LINE);
				if(n > 0) {
					var i = token.content().indexOf(character.LINE),
						j = token.content().lastIndexOf(character.LINE);
					this.colMax = Math.max(this.colMax, this.colNum + i);
					this.colNum = match.content().length - j;
				}
				else {
					this.colNum += token.content().length;
				}
				this.colMax = Math.max(this.colMax, this.colNum);
			}
		});
	module.exports = CssLexer;
});