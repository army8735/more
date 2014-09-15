define(function(require, exports, module){var fs=require('fs');
var homunculus=require('homunculus');
var preVar=function(){var _310=require('./preVar');return _310.hasOwnProperty("preVar")?_310.preVar:_310.hasOwnProperty("default")?_310.default:_310}()
var getVar=function(){var _311=require('./getVar');return _311.hasOwnProperty("getVar")?_311.getVar:_311.hasOwnProperty("default")?_311.default:_311}()
var preFn=function(){var _312=require('./preFn');return _312.hasOwnProperty("preFn")?_312.preFn:_312.hasOwnProperty("default")?_312.default:_312}()
var getFn=function(){var _313=require('./getFn');return _313.hasOwnProperty("getFn")?_313.getFn:_313.hasOwnProperty("default")?_313.default:_313}()
var ignore=function(){var _314=require('./ignore');return _314.hasOwnProperty("ignore")?_314.ignore:_314.hasOwnProperty("default")?_314.default:_314}()
var clone=function(){var _315=require('./clone');return _315.hasOwnProperty("clone")?_315.clone:_315.hasOwnProperty("default")?_315.default:_315}()
var join=function(){var _316=require('./join');return _316.hasOwnProperty("join")?_316.join:_316.hasOwnProperty("default")?_316.default:_316}()
var concatSelector=function(){var _317=require('./concatSelector');return _317.hasOwnProperty("concatSelector")?_317.concatSelector:_317.hasOwnProperty("default")?_317.default:_317}()
var eventbus=function(){var _318=require('./eventbus.js');return _318.hasOwnProperty("eventbus")?_318.eventbus:_318.hasOwnProperty("default")?_318.default:_318}()
var checkLevel=function(){var _319=require('./checkLevel.js');return _319.hasOwnProperty("checkLevel")?_319.checkLevel:_319.hasOwnProperty("default")?_319.default:_319}()

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var global = {
  var: {},
  fn: {},
  style: {},
  suffix: 'css'
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
            var str = getVar(token, self.varHash, global.var);
            if(token.import) {
              if(!/\.\w+['"]?$/.test(str)) {
                str = str.replace(/(['"]?)$/, '.css$1');
              }
              self.importStack.push(str);
            }
            self.res += str;
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
          self.preExtend(true, node);
          break;
        case Node.IMPORT:
          self.impt(node);
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
        case Node.EXTEND:
          self.preExtend(false, node);
          break;
      }
    }
  }
  More.prototype.styleset = function(start, node) {
    if(start) {
      var block = node.leaf(1);
      block.hasLevel = checkLevel(block);
      if(block.hasLevel || this.selectorStack.length) {
        ignore(node.first(), this.ignores, this.index);
      }
      //二级以上选择器样式集需先结束
      if(this.selectorStack.length) {
        //忽略掉所有二级以上选择器，由block之前生成
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
      if(node.hasLevel || this.selectorStack.length > 1) {
        this.res += s;
      }
      this.styleHash[s] = this.styleHash[s] || [];
      this.styleHash[s].push(this.res.length);
    }
  }
  More.prototype.preExtend = function(start, node) {
    if(start) {
      ignore(node, this.ignores, this.index);
      var i = this.index;
      var o = {
        start: this.res.length
      };
      while(this.ignores[++i]) {
      }
      var s = join(node.leaf(1), this.ignores, i);
      o.selectors = s.split(',');
      this.extendStack.push(o);
    }
    else {
      this.extendStack[this.extendStack.length - 1].end = this.res.length;
    }
  }
  More.prototype.extend = function() {
//    console.log(this.extendStack)
  }
  More.prototype.impt = function(node) {
    var url = node.leaf(1);
    if(url.size() == 1) {
      url.first().token().import = true;
    }
    else {
      url.leaf(2).token().import = true;
    }
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
    if(data===void 0)data={};Object.keys(data).forEach(function(k) {
      if(k == 'suffix') {
        data[k] = data[k].replace('.', '');
      }
      global[k] = data[k];
    });
  }


exports.default=More;});