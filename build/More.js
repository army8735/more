var fs=require('fs');
var homunculus=require('homunculus');
var preVar=function(){var _845=require('./preVar');return _845.hasOwnProperty("preVar")?_845.preVar:_845.hasOwnProperty("default")?_845.default:_845}()
var getVar=function(){var _846=require('./getVar');return _846.hasOwnProperty("getVar")?_846.getVar:_846.hasOwnProperty("default")?_846.default:_846}()
var preFn=function(){var _847=require('./preFn');return _847.hasOwnProperty("preFn")?_847.preFn:_847.hasOwnProperty("default")?_847.default:_847}()
var getFn=function(){var _848=require('./getFn');return _848.hasOwnProperty("getFn")?_848.getFn:_848.hasOwnProperty("default")?_848.default:_848}()
var ignore=function(){var _849=require('./ignore');return _849.hasOwnProperty("ignore")?_849.ignore:_849.hasOwnProperty("default")?_849.default:_849}()
var clone=function(){var _850=require('./clone');return _850.hasOwnProperty("clone")?_850.clone:_850.hasOwnProperty("default")?_850.default:_850}()
var join=function(){var _851=require('./join');return _851.hasOwnProperty("join")?_851.join:_851.hasOwnProperty("default")?_851.default:_851}()
var concatSelector=function(){var _852=require('./concatSelector');return _852.hasOwnProperty("concatSelector")?_852.concatSelector:_852.hasOwnProperty("default")?_852.default:_852}()
var eventbus=function(){var _853=require('./eventbus.js');return _853.hasOwnProperty("eventbus")?_853.eventbus:_853.hasOwnProperty("default")?_853.default:_853}()

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
    this.extendStack = [];

    this.varHash = {};
    this.styleHash = {};
    this.fnHash = {};
  }
  More.prototype.join = function(node) {
    var self = this;
    var isToken = node.name() == Node.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        eventbus.emit(node.nid());
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
      switch(node.name()) {
        case Node.STYLESET:
          self.styleset(true, node);
          break;
        case Node.BLOCK:
          self.block(node);
          break;
        case Node.FNC:
          self.res += getFn(node, self.ignores, self.index, self.fnHash, global.fn, self.varHash, global.var);
          break;
        case Node.EXTEND:
          self.preExtend(node);
          break;
      }
      //递归子节点
      var leaves = node.leaves();
      leaves.forEach(function(leaf) {
        self.join(leaf);
      });
      switch(node.name()) {
        case Node.STYLESET:
          self.styleset(false, node);
          break;
      }
    }
  }
  More.prototype.styleset = function(start, node) {
    if(start) {
      //忽略掉所有选择器，由block之前生成
      ignore(node.first(), this.ignores, this.index);
      //二级以上选择器样式集需先结束
      if(this.selectorStack.length) {
        var prev = node.prev();
        //前一个是styleset或者{时，会造成空样式
        if(prev.name() == Node.STYLESET
          || prev.name() == Node.TOKEN
            && prev.token().content() == '{') {
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
      this.selectorStack.pop();
      if(this.selectorStack.length) {
        var next = node.next();
        //当多级styleset结束时下个是styleset或}，会造成空白样式
        if(next && (next.name() == Node.STYLESET
          || next.name() == Node.TOKEN
            && next.token().content() == '}')) {
          //
        }
        else {
          this.res += concatSelector(this.selectorStack) + '{';
        }
      }
    }
  }
  More.prototype.block = function(node) {
    var self = this;
    var last = node.last();
    var prev = last.prev();
    //当多级block的最后一个是styleset或}，会造成空白样式
    if(prev.name() == Node.STYLESET) {
      eventbus.on(last.nid(), function() {
        ignore(last, self.ignores, self.index);
      });
    }
    var first = node.leaf(1);
    if(first.name() == Node.STYLESET) {
      eventbus.on(first.prev().nid(), function() {
        ignore(first.prev(), self.ignores, self.index);
      });
    }
    else {
      var s = concatSelector(this.selectorStack);
      this.res += s;
    }
  }
  More.prototype.preExtend = function(node) {

  }
  More.prototype.extend = function() {

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