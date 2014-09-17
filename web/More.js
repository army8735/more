define(function(require, exports, module){var fs=require('fs');
var homunculus=require('homunculus');
var preVar=function(){var _4=require('./preVar');return _4.hasOwnProperty("preVar")?_4.preVar:_4.hasOwnProperty("default")?_4.default:_4}()
var getVar=function(){var _5=require('./getVar');return _5.hasOwnProperty("getVar")?_5.getVar:_5.hasOwnProperty("default")?_5.default:_5}()
var preFn=function(){var _6=require('./preFn');return _6.hasOwnProperty("preFn")?_6.preFn:_6.hasOwnProperty("default")?_6.default:_6}()
var getFn=function(){var _7=require('./getFn');return _7.hasOwnProperty("getFn")?_7.getFn:_7.hasOwnProperty("default")?_7.default:_7}()
var ignore=function(){var _8=require('./ignore');return _8.hasOwnProperty("ignore")?_8.ignore:_8.hasOwnProperty("default")?_8.default:_8}()
var clone=function(){var _9=require('./clone');return _9.hasOwnProperty("clone")?_9.clone:_9.hasOwnProperty("default")?_9.default:_9}()
var join=function(){var _10=require('./join');return _10.hasOwnProperty("join")?_10.join:_10.hasOwnProperty("default")?_10.default:_10}()
var concatSelector=function(){var _11=require('./concatSelector');return _11.hasOwnProperty("concatSelector")?_11.concatSelector:_11.hasOwnProperty("default")?_11.default:_11}()
var eventbus=function(){var _12=require('./eventbus.js');return _12.hasOwnProperty("eventbus")?_12.eventbus:_12.hasOwnProperty("default")?_12.default:_12}()
var checkLevel=function(){var _13=require('./checkLevel.js');return _13.hasOwnProperty("checkLevel")?_13.checkLevel:_13.hasOwnProperty("default")?_13.default:_13}()
var normalize=function(){var _14=require('./normalize.js');return _14.hasOwnProperty("normalize")?_14.normalize:_14.hasOwnProperty("default")?_14.default:_14}()

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var global = {
  vars: {},
  fns: {},
  styles: {},
  suffix: 'css',
  root: '',
  localRoot: ''
};

var single;


  function More(code) {
    if(code===void 0)code='';this.code = code;
    this.node = null;
    this.parser = null;
    this.varHash = {};
    this.styleHash = {};
    this.fnHash = {};
  }
  More.prototype.parse = function(code) {
    if(code) {
      this.code = code;
    }
    this.parser = homunculus.getParser('css');
    try {
      this.node = this.parser.parse(this.code);
      this.ignores = this.parser.ignore();
    }
    catch(e) {
      if(typeof console != 'undefined') {
        console.error(e);
      }
      return e.toString();
    }
    this.init();

    preVar(this.node, this.ignores, this.index, this.varHash);
    preFn(this.node, this.ignores, this.index, this.fnHash);
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
            var s = getVar(token, self.varHash, global.vars);
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
            var str = getVar(token, self.varHash, global.vars);
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
      eventbus.emit(node.nid(), true);
      switch(node.name()) {
        case Node.STYLESET:
          self.styleset(true, node);
          break;
        case Node.BLOCK:
          self.block(node);
          break;
        case Node.FNC:
          self.res += getFn(node, self.ignores, self.index, self.fnHash, global.fns, self.varHash, global.vars);
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
      eventbus.emit(node.nid(), false);
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
    var self = this;
    ignore(node, self.ignores, self.index);
    var i = self.index;
    var o = {
      start: self.res.length
    };
    while(self.ignores[++i]) {}
    var s = normalize(join(node.leaf(1), self.ignores, i));
    o.targets = s.split(',');
    var se = normalize(concatSelector(self.selectorStack));
    o.selectors = se.split(',');
    self.extendStack.push(o);
    eventbus.on(node.parent().nid(), function(start) {
      if(!start) {
        o.blockEnd = self.res.length;
      }
    });
  }
  More.prototype.extend = function() {
    var temp = 0;
    var self = this;
    var styleArray = Object.keys(self.styleHash);
    self.extendStack.forEach(function(o) {
      var v = '';
      var v2 = '';
      o.targets.forEach(function(se) {
        v += self.styleHash[se] || '';
        styleArray.forEach(function(se2) {
          if(se2.indexOf(se) == 0 && se2.length != se.length && o.selectors.indexOf(se2) == -1) {
            var pseudo = concatSelector([o.selectors].concat([[se2.slice(se.length)]]));
            pseudo = normalize(pseudo);
            if(self.styleHash[se2]) {
              v2 += pseudo + '{' + self.styleHash[se2] + '}';
              self.styleHash[pseudo] = self.styleHash[pseudo] || '';
              self.styleHash[pseudo] += self.styleHash[se2];
            }
          }
        });
      });
      if(v) {
        self.res = self.res.slice(0, o.start + temp) + v + self.res.slice(o.start + temp);
        temp += v.length;
        o.selectors.forEach(function(se2) {
          self.styleHash[se2] += v;
        });
      }
      if(v2) {
        self.res = self.res.slice(0, o.blockEnd + temp) + v2 + self.res.slice(o.blockEnd + temp);
        temp += v2.length;
      }
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

  More.prototype.vars = function(o) {
    if(o) {
      this.varHash = o;
    }
    return this.varHash;
  }
  More.prototype.fns = function(o) {
    if(o) {
      this.fnHash = o;
    }
    return this.fnHash;
  }
  More.prototype.styles = function(o) {
    if(o) {
      this.styleHash = o;
    }
    return this.styleHash;
  }
  More.prototype.config = function(str) {
    if(str) {
      this.parse(str);
    }
  }
  More.prototype.configFile = function(file) {
    this.config(fs.readFileSync(file, { encoding: 'utf-8' }));
  }
  More.prototype.clean = function() {
    this.varHash = {};
    this.fnHash = {};
    this.styleHash = {};
  }
  More.prototype.build = function(code) {
    //
  }
  More.prototype.buildFile = function(file) {
    return this.build(fs.readFileSync(file, { encoding: 'utf-8' }));
  }

  More.parse=function(code) {
    if(!single) {
      single = new More();
    }
    return single.parse(code);
  }
  More.parseFile=function(file) {
    if(!single) {
      single = new More();
    }
    return single.parseFile(code);
  }
  More.build=function(code) {
    if(!single) {
      single = new More();
    }
    //
  }
  More.buildFile=function(file) {
    return More.build(fs.readFileSync(file, { encoding: 'utf-8' }));
  }
  More.suffix=function(str) {
    if(str===void 0)str=null;if(str) {
      global.suffix = str.replace(/^\./, '');
    }
    return global.suffix;
  }
  More.root=function(str) {
    if(str===void 0)str=null;if(str) {
      global.root = str;
    }
    return global.root;
  }
  More.localRoot=function(str) {
    if(str===void 0)str=null;if(str) {
      global.localRoot = str;
    }
    return global.localRoot;
  }
  More.vars=function(o) {
    if(o) {
      global.varHash = o;
    }
    return global.varHash;
  }
  More.fns=function(o) {
    if(o) {
      global.fnHash = o;
    }
    return global.fnHash;
  }
  More.styles=function(o) {
    if(o) {
      global.styleHash = o;
    }
    return global.styleHash;
  }
  More.config=function(str) {
    if(str) {
      More.parse(str);
      global.vars = single.vars();
      global.fns = single.fns();
      global.styles = single.styles();
    }
  }
  More.configFile=function(file) {
    More.config(fs.readFileSync(file, { encoding: 'utf-8' }));
  }
  More.clean=function() {
    global = {
      vars: {},
      fns: {},
      styles: {},
      suffix: 'css',
      root: '',
      localRoot: ''
    };
  }


exports.default=More;});