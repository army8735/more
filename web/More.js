define(function(require, exports, module){var fs=require('fs');
var homunculus=require('homunculus');
var preVar=function(){var _1111=require('./preVar');return _1111.hasOwnProperty("preVar")?_1111.preVar:_1111.hasOwnProperty("default")?_1111.default:_1111}()
var getVar=function(){var _1112=require('./getVar');return _1112.hasOwnProperty("getVar")?_1112.getVar:_1112.hasOwnProperty("default")?_1112.default:_1112}()
var preFn=function(){var _1113=require('./preFn');return _1113.hasOwnProperty("preFn")?_1113.preFn:_1113.hasOwnProperty("default")?_1113.default:_1113}()
var getFn=function(){var _1114=require('./getFn');return _1114.hasOwnProperty("getFn")?_1114.getFn:_1114.hasOwnProperty("default")?_1114.default:_1114}()
var ignore=function(){var _1115=require('./ignore');return _1115.hasOwnProperty("ignore")?_1115.ignore:_1115.hasOwnProperty("default")?_1115.default:_1115}()
var clone=function(){var _1116=require('./clone');return _1116.hasOwnProperty("clone")?_1116.clone:_1116.hasOwnProperty("default")?_1116.default:_1116}()
var join=function(){var _1117=require('./join');return _1117.hasOwnProperty("join")?_1117.join:_1117.hasOwnProperty("default")?_1117.default:_1117}()
var concatSelector=function(){var _1118=require('./concatSelector');return _1118.hasOwnProperty("concatSelector")?_1118.concatSelector:_1118.hasOwnProperty("default")?_1118.default:_1118}()
var eventbus=function(){var _1119=require('./eventbus.js');return _1119.hasOwnProperty("eventbus")?_1119.eventbus:_1119.hasOwnProperty("default")?_1119.default:_1119}()
var checkLevel=function(){var _1120=require('./checkLevel.js');return _1120.hasOwnProperty("checkLevel")?_1120.checkLevel:_1120.hasOwnProperty("default")?_1120.default:_1120}()
var normalize=function(){var _1121=require('./normalize.js');return _1121.hasOwnProperty("normalize")?_1121.normalize:_1121.hasOwnProperty("default")?_1121.default:_1121}()

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

    this.varHash = preVar(this.node, this.ignores, this.index);
    this.fnHash = preFn(this.node, this.ignores, this.index);
    this.join(this.node);
    this.saveStyle();
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
          self.preExtend(node);
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
      }
    }
  }
  More.prototype.styleset = function(start, node) {
    var self = this;
    if(start) {
      var block = node.leaf(1);
      block.hasLevel = checkLevel(block);
      //忽略掉所有二级以上选择器，由block之前生成
      if(block.hasLevel || self.selectorStack.length) {
        ignore(node.first(), self.ignores, self.index);
      }
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
          var s = concatSelector(self.selectorStack);
          normalize(s).split(',').forEach(function(se) {
            self.styleHash[se] = self.styleHash[se] || [];
            self.styleHash[se].push(self.res.length);
          });
          self.res += '}';
        }
      }
      //存储当前层级父选择器集合
      var s = join(node.first(), self.ignores, self.index, true);
      self.selectorStack.push(s.split(','));
    }
    else {
      if(node.last().last().prev().name() != Node.STYLESET) {
        var s = concatSelector(self.selectorStack);
        var temp = self.res.lastIndexOf('}');
        normalize(s).split(',').forEach(function(se) {
          self.styleHash[se] = self.styleHash[se] || [];
          self.styleHash[se].push(temp);
        });
      }
      self.selectorStack.pop();
      if(self.selectorStack.length) {
        var s = concatSelector(self.selectorStack);
        var next = node.next();
        //当多级styleset结束时下个是styleset或}，会造成空白样式
        if(next && (next.name() == Node.STYLESET
          || next.name() == Node.TOKEN
            && next.token().content() == '}')) {
          //
        }
        else {
          self.res += s + '{';
          normalize(s).split(',').forEach(function(se) {
            self.styleHash[se] = self.styleHash[se] || [];
            self.styleHash[se].push(self.res.length);
          });
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
    var s = concatSelector(this.selectorStack);
    var first = node.leaf(1);
    if(first.name() == Node.STYLESET) {
      eventbus.on(first.prev().nid(), function() {
        ignore(first.prev(), self.ignores, self.index);
      });
    }
    else {
      if(node.hasLevel || this.selectorStack.length > 1) {
        self.res += s;
      }
      normalize(s).split(',').forEach(function(se) {
        self.styleHash[se] = self.styleHash[se] || [];
        self.styleHash[se].push(self.res.length + 1);
      });
    }
  }
  More.prototype.preExtend = function(node) {
    ignore(node, this.ignores, this.index);
    var i = this.index;
    var o = {
      start: this.res.length
    };
    while(this.ignores[++i]) {
    }
    var s = normalize(join(node.leaf(1), this.ignores, i));
    o.selectors = s.split(',');
    this.extendStack.push(o);
  }
  More.prototype.extend = function() {
    console.log(this.extendStack);
    var temp = 0;
    this.extendStack.forEach(function(o) {
      //
    });
  }
  More.prototype.saveStyle = function() {
    var self = this;
    Object.keys(self.styleHash).forEach(function(key) {
      var arr = self.styleHash[key];
      self.styleHash[key] = '';
      for(var i = 0; i < arr.length; i += 2) {
        var s = self.res.slice(arr[i], arr[i+1]).trim().replace(/\n/g, '');
        if(s.length && s.charAt(s.length - 1) != ';') {
          s += ';';
        }
        self.styleHash[key] += s;
      }
    });
    console.log(this.styleHash);
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
  More.prototype.config = function(data) {
    if(data===void 0)data={};More.config(data);
  }
  More.config=function(data) {
    if(data===void 0)data={};Object.keys(data).forEach(function(k) {
      if(k == 'suffix') {
        data[k] = data[k].replace('.', '');
      }
      global[k] = data[k];
    });
  }


exports.default=More;});