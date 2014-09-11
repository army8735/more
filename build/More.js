var fs=require('fs');
var homunculus=require('homunculus');
var preVar=function(){var _4=require('./preVar');return _4.hasOwnProperty("preVar")?_4.preVar:_4.hasOwnProperty("default")?_4.default:_4}()
var getVar=function(){var _5=require('./getVar');return _5.hasOwnProperty("getVar")?_5.getVar:_5.hasOwnProperty("default")?_5.default:_5}()
var preFn=function(){var _6=require('./preFn');return _6.hasOwnProperty("preFn")?_6.preFn:_6.hasOwnProperty("default")?_6.default:_6}()
var getFn=function(){var _7=require('./getFn');return _7.hasOwnProperty("getFn")?_7.getFn:_7.hasOwnProperty("default")?_7.default:_7}()
var ignore=function(){var _8=require('./ignore');return _8.hasOwnProperty("ignore")?_8.ignore:_8.hasOwnProperty("default")?_8.default:_8}()
var clone=function(){var _9=require('./clone');return _9.hasOwnProperty("clone")?_9.clone:_9.hasOwnProperty("default")?_9.default:_9}()
var join=function(){var _10=require('./join');return _10.hasOwnProperty("join")?_10.join:_10.hasOwnProperty("default")?_10.default:_10}()
var concatSelector=function(){var _11=require('./concatSelector');return _11.hasOwnProperty("concatSelector")?_11.concatSelector:_11.hasOwnProperty("default")?_11.default:_11}()

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
    this.selectorStack = [];
    this.importStack = [];

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
                self.importStack.push(token.val() + '.css');
              }
              else {
                self.importStack.push(token.val());
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
      switch(node.name()) {
        case Node.STYLESET:
          !newConfig.inHead && self.styleset(true, node);
          break;
        case Node.BLOCK:
          !newConfig.inHead && self.block(true, node);
          break;
        case Node.FNC:
          self.res += getFn(node, self.ignores, self.index, self.fnHash, global.fn, self.varHash, global.var);
          break;
      }
      //递归子节点
      var leaves = node.leaves();
      leaves.forEach(function(leaf) {
        self.join(leaf, newConfig);
      });
      switch(node.name()) {
        case Node.STYLESET:
          !newConfig.inHead && self.styleset(false, node);
          break;
        case Node.BLOCK:
          !newConfig.inHead && self.block(false, node);
          break;
      }
    }
  }
  More.prototype.styleset = function(start, node) {
    if(start) {
      var prev = node.prev();
      ignore(node.first(), this.ignores, this.index);
      //二级以上选择器样式集需先结束
      if(this.selectorStack.length) {
        if(prev && prev.name() == Node.STYLESET) {
          //
        }
        else {
          this.res += '}';
        }
      }
      //存储当前层级父选择器集合
      var s = join(node.first(), this.ignores, this.index, true);
      this.selectorStack.push(s.split(','));
    }
    else {
      var next = node.next();
      this.selectorStack.pop();
      if(this.selectorStack.length) {
        //当多级styleset结束时下个还是styleset或}，会造成空白样式
        if(next && next.name() == Node.STYLESET) {
          //
        }
        else {
          this.res += concatSelector(this.selectorStack) + '{';
        }
      }
    }
  }
  More.prototype.block = function(start, node) {
    if(start) {
      var s = concatSelector(this.selectorStack);
      this.res += s;
    }
  }
  More.prototype.extend = function(node) {

  }
  More.prototype.ast = function() {
    return this.node;
  }
  More.prototype.tokens = function() {
    return this.parser.lexer.tokens();
  }
  More.prototype.imports = function() {
    return this.importStatck;
  }
  More.prototype.global = function(data) {
    if(data===void 0)data={};More.global(data);
  }
  More.global=function(data) {
    if(data===void 0)data={};global = data;
  }


exports.default=More;