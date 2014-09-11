var fs=require('fs');
var homunculus=require('homunculus');
var preVar=function(){var _1016=require('./preVar');return _1016.hasOwnProperty("preVar")?_1016.preVar:_1016.hasOwnProperty("default")?_1016.default:_1016}()
var getVar=function(){var _1017=require('./getVar');return _1017.hasOwnProperty("getVar")?_1017.getVar:_1017.hasOwnProperty("default")?_1017.default:_1017}()
var preFn=function(){var _1018=require('./preFn');return _1018.hasOwnProperty("preFn")?_1018.preFn:_1018.hasOwnProperty("default")?_1018.default:_1018}()
var getFn=function(){var _1019=require('./getFn');return _1019.hasOwnProperty("getFn")?_1019.getFn:_1019.hasOwnProperty("default")?_1019.default:_1019}()
var ignore=function(){var _1020=require('./ignore');return _1020.hasOwnProperty("ignore")?_1020.ignore:_1020.hasOwnProperty("default")?_1020.default:_1020}()
var clone=function(){var _1021=require('./clone');return _1021.hasOwnProperty("clone")?_1021.clone:_1021.hasOwnProperty("default")?_1021.default:_1021}()
var join=function(){var _1022=require('./join');return _1022.hasOwnProperty("join")?_1022.join:_1022.hasOwnProperty("default")?_1022.default:_1022}()
var concatSelector=function(){var _1023=require('./concatSelector');return _1023.hasOwnProperty("concatSelector")?_1023.concatSelector:_1023.hasOwnProperty("default")?_1023.default:_1023}()
var eventbus=function(){var _1024=require('./eventbus.js');return _1024.hasOwnProperty("eventbus")?_1024.eventbus:_1024.hasOwnProperty("default")?_1024.default:_1024}()

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
          self.block(true, node);
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
        case Node.BLOCK:
          self.block(false, node);
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
  More.prototype.block = function(start, node) {
    var self = this;
    if(start) {
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
  }
  More.prototype.preExtend = function(node) {
    ignore(node, this.ignores, this.index);
    var i = this.index;
    var o = {
      start: this.res.length
    };
    while(this.ignores[++i]) {}
    var s = join(node.leaf(1), this.ignores, i);
    o.selectors = s.split(',');
    this.extendStack.push(o);
  }
  More.prototype.extend = function() {
    console.log(this.extendStack)
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