var fs=require('fs');
var homunculus=require('homunculus');
var preVar=function(){var _0=require('./preVar');return _0.hasOwnProperty("preVar")?_0.preVar:_0.hasOwnProperty("default")?_0.default:_0}()
var getVar=function(){var _1=require('./getVar');return _1.hasOwnProperty("getVar")?_1.getVar:_1.hasOwnProperty("default")?_1.default:_1}()
var preFn=function(){var _2=require('./preFn');return _2.hasOwnProperty("preFn")?_2.preFn:_2.hasOwnProperty("default")?_2.default:_2}()
var ignore=function(){var _3=require('./ignore');return _3.hasOwnProperty("ignore")?_3.ignore:_3.hasOwnProperty("default")?_3.default:_3}()
var clone=function(){var _4=require('./clone');return _4.hasOwnProperty("clone")?_4.clone:_4.hasOwnProperty("default")?_4.default:_4}()

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var global = {
  var: {},
  fn: {},
  style: {}
};


  function More(data) {
    if(data===void 0)data={code:''};this.data = data;
    this.node = null;
    this.parser = null;
  }
  More.prototype.parse = function(data) {
    if(Object.prototype.toString.call(data) == '[object String]') {
      this.data.code = data;
    }
    else if(data) {
      this.data = data;
    }
    this.parser = homunculus.getParser('css');
    try {
      this.node = this.parser.parse(this.data.code);
      this.ignores = this.parser.ignore();
    }
    catch(e) {
      if(typeof console != 'undefined') {
        console.error(e);
      }
      return e.toString();
    }
    this.init();

    //初始化变量
    if(this.data.var) {
      Object.keys(this.data.var).forEach(function(k) {
        this.varHash[k] = this.data.var[k];
      });
    }
    //初始化函数
    if(this.data.fn) {
      Object.keys(this.data.fn).forEach(function(k) {
        this.fnHash[k] = this.data.fn[k];
      });
    }
    //初始化继承
    if(this.data.style) {
      Object.keys(this.data.style).forEach(function(k) {
        this.styleHash[k] = this.data.style[k];
      });
    }

    this.varHash = preVar(this.node, this.ignores, this.preIndex);
    this.fnHash = preFn(this.node, this.ignores, this.preIndex);
    this.join(this.node);
    this.extend();
    return this.res;
  }
  More.prototype.init = function() {
    this.res = '';
    this.index = 0;
    while(this.ignores[this.index]) {
      if(this.ignores[this.index].type() == Token.ignores) {
        this.res += this.ignores[this.index].content().replace(/\S/g, ' ');
      }
      else {
        this.res += this.ignores[this.index].content();
      }
      this.index++;
    }
    this.preIndex = this.index;
    this.autoSplit = false;
    this.stack = [];
    this.imports = [];

    this.varHash = {};
    this.styleHash = {};
    this.fnHash = {};
  }
  More.prototype.join = function(node, config) {
    if(config===void 0)config={};var self = this;
    var isToken = node.name() == Node.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        var token = node.token();
        //标识下一个string是否自动拆分
        if(token.content() == '~') {
          self.autoSplit = true;
          ignore(token, self.ignores, self.index);
        }
        else if(token.type() != Token.STRING) {
          self.autoSplit = false;
        }
        if(!token.ignore) {
          if(config.inHead) {
            var s = getVar(token, self.varHash, global.var);
            if(config.isImport && token.type() == Token.STRING) {
              if(!/\.css['"]?$/.test(s)) {
                s = s.replace(/(['"]?)$/, '.css$1');
                self.imports.push(token.val() + '.css');
              }
              else {
                self.imports.push(token.val());
              }
            }
            self.res += s;
          }
          //~String拆分语法
          if(self.autoSplit && token.type() == Token.STRING) {
            var s = getVar(token, self.varHash, global.var);
            var c = s.charAt(0);
            if(c != "'" && c != '"') {
              c = '"';
              s = c + s + c;
            }
            s = s.replace(/,\s*/g, c + ',' + c);
            self.res += s;
            self.autoSplit = false;
          }
          else {
            self.res += getVar(token, self.varHash, global.var);
          }
        }
        while(self.ignores[++self.index]) {
          var ig = self.ignores[self.index];
          var s = ig.type() == Token.ignores ? ig.content().replace(/\S/g, ' ') : ig.content();
          if(!ig.ignore) {
            self.res += s;
          }
        }
      }
    }
    else {
      var newConfig = clone(config);
      newConfig.isSelectors = node.name() == Node.SELECTORS;
      newConfig.isSelector = node.name() == Node.SELECTOR;
      if(!newConfig.inHead && [Node.FONTFACE, Node.MEDIA, Node.CHARSET, Node.IMPORT, Node.PAGE, Node.KEYFRAMES].indexOf(node.name()) != -1) {
        newConfig.inHead = true;
        if(node.name() == Node.IMPORT) {
          newConfig.isImport = true;
        }
      }
      //将层级拆开
      else if(node.name() == Node.STYLESET && !newConfig.inHead) {
        self.styleset(true, node, newConfig);
      }
      else if(node.name() == Node.BLOCK && !newConfig.inHead) {
        self.block(true, node);
      }
      else if(node.name() == Node.EXTEND) {
        //
      }
      else if(node.name() == Node.FN || node.name() == Node.FNC) {
        //
      }
      var leaves = node.leaves();
      //递归子节点
      leaves.forEach(function(leaf) {
        self.join(leaf, newConfig);
      });
      if(node.name() == Node.STYLESET && !newConfig.inHead) {
        self.styleset(false, node, newConfig);
      }
      else if(node.name() == Node.BLOCK && !newConfig.inHead) {
        self.block(false, node);
      }
    }
  }
  More.prototype.styleset = function() {

  }
  More.prototype.block = function() {

  }
  More.prototype.extend = function(node) {

  }
  More.prototype.ast = function() {
    return this.node;
  }
  More.prototype.tokens = function() {
    return this.parser.lexer.tokens();
  }
  More.global=function(data) {
    if(data===void 0)data={};global = data;
  }


exports.default=More;