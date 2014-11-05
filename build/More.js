var fs=require('fs');
var path=require('path');

var homunculus=require('homunculus');

var preImport=function(){var _8=require('./preImport');return _8.hasOwnProperty("preImport")?_8.preImport:_8.hasOwnProperty("default")?_8.default:_8}();
var preVar=function(){var _9=require('./preVar');return _9.hasOwnProperty("preVar")?_9.preVar:_9.hasOwnProperty("default")?_9.default:_9}();
var getVar=function(){var _10=require('./getVar');return _10.hasOwnProperty("getVar")?_10.getVar:_10.hasOwnProperty("default")?_10.default:_10}();
var preFn=function(){var _11=require('./preFn');return _11.hasOwnProperty("preFn")?_11.preFn:_11.hasOwnProperty("default")?_11.default:_11}();
var getFn=function(){var _12=require('./getFn');return _12.hasOwnProperty("getFn")?_12.getFn:_12.hasOwnProperty("default")?_12.default:_12}();
var ignore=function(){var _13=require('./ignore');return _13.hasOwnProperty("ignore")?_13.ignore:_13.hasOwnProperty("default")?_13.default:_13}();
var clone=function(){var _14=require('./clone');return _14.hasOwnProperty("clone")?_14.clone:_14.hasOwnProperty("default")?_14.default:_14}();
var join=function(){var _15=require('./join');return _15.hasOwnProperty("join")?_15.join:_15.hasOwnProperty("default")?_15.default:_15}();
var concatSelector=function(){var _16=require('./concatSelector');return _16.hasOwnProperty("concatSelector")?_16.concatSelector:_16.hasOwnProperty("default")?_16.default:_16}();
var eventbus=function(){var _17=require('./eventbus');return _17.hasOwnProperty("eventbus")?_17.eventbus:_17.hasOwnProperty("default")?_17.default:_17}();
var checkLevel=function(){var _18=require('./checkLevel');return _18.hasOwnProperty("checkLevel")?_18.checkLevel:_18.hasOwnProperty("default")?_18.default:_18}();
var normalize=function(){var _19=require('./normalize');return _19.hasOwnProperty("normalize")?_19.normalize:_19.hasOwnProperty("default")?_19.default:_19}();
var compress=function(){var _20=require('./compress');return _20.hasOwnProperty("compress")?_20.compress:_20.hasOwnProperty("default")?_20.default:_20}();
var operate=function(){var _21=require('./operate');return _21.hasOwnProperty("operate")?_21.operate:_21.hasOwnProperty("default")?_21.default:_21}();

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var global = {
  vars: {},
  fns: {},
  styles: {},
  suffix: 'css',
  root: ''
};


  function More(code) {
    if(code===void 0)code='';this.code = code;
    this.node = null;
    this.parser = null;
    this.varHash = {};
    this.styleHash = clone(global.styles);
    this.styleTemp = 0;
    this.fnHash = {};
    this.res = '';
    this.index = 0;
    this.msg = null;
    this.autoSplit = false;
    this.selectorStack = [];
    this.importStack = [];
  }
  More.prototype.parse = function(code, ignoreImport) {
    if(code) {
      this.code = code;
    }
    this.preParse(ignoreImport);
    if(this.msg) {
      return this.msg;
    }
    return this.parseOn();
  }
  //combo指明为true时，将全部@import文件合并进来分析
  //简易使用可忽略此参数，此时变量作用域不是页面，而是此文件本身
  //按css规范（草案）及历史设计延续，变量作用域应该以页面为准，后出现拥有高优先级
  More.prototype.parseFile = function(file, combo) {
    var self = this;
    var code = fs.readFileSync(file, { encoding: 'utf-8' });
    self.code = code;
    self.preParse(combo);
    if(self.msg) {
      return self.msg;
    }
    if(combo && self.imports().length) {
      var data = {
        vars: {},
        fns: {},
        styles: {}
      };
      var list = [];
      self.imports().forEach(function(im) {
        if(global.suffix != 'css') {
          im = im.replace(/\.\w+$/, '.' + global.suffix);
        }
        var iFile;
        if(im.charAt(0) == '/') {
          iFile = path.join(More.root(), '.' + im);
        }
        else {
          iFile = path.join(path.dirname(file), im);
        }
        self.mixImport(iFile, data, list);
      });
      var res = '';
      Object.keys(self.varHash).forEach(function(k) {
        data.vars[k] = self.varHash[k];
      });
      Object.keys(self.fnHash).forEach(function(k) {
        data.fns[k] = self.fns[k];
      });
      self.vars(data.vars);
      self.fns(data.fns);
      list.forEach(function(more, i) {
        more.vars(data.vars);
        more.fns(data.fns);
        if(i) {
          more.styles(list[i - 1].styles());
        }
        res += more.msg || more.parseOn();
      });
      self.styles(list[list.length - 1].styles());
      return res += self.parseOn();
    }
    return self.parseOn();
  }
  More.prototype.mixImport = function(file, data, list) {
    var self = this;
    var code = fs.readFileSync(file, { encoding: 'utf-8' });
    var more = new More(code);
    more.preParse(true);
    if(more.msg) {
      return more.msg;
    }
    more.imports().forEach(function(im) {
      if(global.suffix != 'css') {
        im = im.replace(/\.\w+$/, '.' + global.suffix);
      }
      var iFile;
      if(im.charAt(0) == '/') {
        iFile = path.join(More.root(), '.' + im);
      }
      else {
        iFile = path.join(path.dirname(file), im);
      }
      self.mixImport(iFile, data, list);
    });
    list.push(more);
    var vars = more.vars();
    Object.keys(vars).forEach(function(k) {
      data.vars[k] = vars[k];
    });
    var fns = more.fns();
    Object.keys(fns).forEach(function(k) {
      data.fns[k] = fns[k];
    });
  }
  More.prototype.preParse = function(ignoreImport) {
    this.parser = homunculus.getParser('css');
    try {
      this.node = this.parser.parse(this.code);
      this.ignores = this.parser.ignore();
    }
    catch(e) {
      if(typeof console != 'undefined') {
        console.error(e);
      }
      return this.msg = e.toString();
    }
    this.importStack = preImport(this.node, this.ignores, this.index, ignoreImport);
    preVar(this.node, this.ignores, this.index, this.varHash);
    preFn(this.node, this.ignores, this.index, this.fnHash);
  }
  More.prototype.parseOn = function() {
    this.preJoin();
    this.join(this.node);
    return this.res;
  }
  More.prototype.preJoin = function() {
    while(this.ignores[this.index]) {
      if(this.ignores[this.index].type() == Token.ignores) {
        this.res += this.ignores[this.index].content().replace(/\S/g, ' ');
      }
      else {
        var ig = this.ignores[this.index];
        var s = ig.content();
        if(ig.type() == Token.COMMENT && s.indexOf('//') == 0) {
          s = '/*' + s.slice(2) + '*/';
        }
        this.res += s;
      }
      this.index++;
    }
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
              else if(!/\.css+['"]?$/.test(str)) {
                str = str.replace(/\.\w+(['"]?)$/, '.css$1');
              }
            }
            self.res += str;
          }
        }
        while(self.ignores[++self.index]) {
          var ig = self.ignores[self.index];
          var s = ig.type() == Token.ignores ? ig.content().replace(/\S/g, ' ') : ig.content();
          if(ig.type() == Token.COMMENT && s.indexOf('//') == 0) {
            s = '/*' + s.slice(2) + '*/';
          }
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
          self.extend(node);
          break;
        case Node.IMPORT:
          self.impt(node);
          break;
        case Node.ADDEXPR:
        case Node.MTPLEXPR:
        case Node.PRMREXPR:
          if(!node.ignore) {
            self.res += operate(node, self.ignores, self.index, self.varHash, global.vars);
            ignore(node, self.ignores, self.index);
          }
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
            self.saveStyle(se, self.res.slice(self.styleTemp, self.res.length));
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
          self.saveStyle(se, self.res.slice(self.styleTemp, temp));
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
            self.styleTemp = self.res.length;
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
        self.styleTemp = self.res.length + 1;
      });
    }
  }
  More.prototype.extend = function(node) {
    var self = this;
    ignore(node, self.ignores, self.index);
    var i = self.index;
    while(self.ignores[++i]) {}
    var s = normalize(join(node.leaf(1), self.ignores, i));
    var targets = s.split(',');
    targets.forEach(function(se) {
      self.res += self.styleHash[se] || '';
    });
    var se = normalize(concatSelector(self.selectorStack));
    se = se.split(',');
    eventbus.on(node.parent().nid(), function(start) {
      if(!start) {
        var styleArray = Object.keys(self.styleHash);
        targets.forEach(function(se1) {
          styleArray.forEach(function(se2) {
            if(se2.indexOf(se1) == 0
              && se2.length != se1.length
              //确保伪类或孩子元素，防止@extend .test会继承.test1之类
              && !/[\w-]/.test(se2.charAt(se1.length))
              && se1.indexOf(se2) == -1) {
              var pseudo = concatSelector([se].concat([[se2.slice(se1.length)]]));
              pseudo = normalize(pseudo);
              if(self.styleHash[se2]) {
                self.res += pseudo + '{' + self.styleHash[se2] + '}';
                self.styleHash[pseudo] = self.styleHash[pseudo] || '';
                self.styleHash[pseudo] += self.styleHash[se2];
              }
            }
          });
        });
      }
    });
  }
  More.prototype.saveStyle = function(k, v) {
    this.styleHash[k] = this.styleHash[k] || '';
    v = v.trim();
    if(v.length && v.charAt(v.length - 1) != ';') {
      v += ';';
    }
    this.styleHash[k] += v;
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
    return this.importStack;
  }

  More.prototype.vars = function(o, mix) {
    if(o) {
      if(mix) {
        var self = this;
        Object.keys(o).forEach(function(k) {
          self.varHash[k] = o[k];
        });
      }
      else {
        this.varHash = clone(o);
      }
    }
    return this.varHash;
  }
  More.prototype.fns = function(o, mix) {
    if(o) {
      if(mix) {
        var self = this;
        Object.keys(o).forEach(function(k) {
          self.fnHash[k] = o[k];
        });
      }
      else {
        this.fnHash = o;
      }
    }
    return this.fnHash;
  }
  More.prototype.styles = function(o, mix) {
    if(o) {
      if(mix) {
        var self = this;
        Object.keys(o).forEach(function(k) {
          self.styleHash[k] = o[k];
        });
      }
      else {
        this.styleHash = clone(o);
      }
    }
    return this.styleHash;
  }
  More.prototype.config = function(str, mix) {
    var self = this;
    if(str) {
      var more = new More();
      more.parse(str);
      self.vars(more.vars(), mix);
      self.fns(more.fns(), mix);
      self.styles(more.styles(), mix);
    }
    return {
      vars: self.vars(),
      fns: self.fns(),
      styles: self.styles()
    };
  }
  More.prototype.configFile = function(file, mix) {
    return this.config(fs.readFileSync(file, { encoding: 'utf-8' }), mix);
  }
  More.prototype.clean = function() {
    this.varHash = {};
    this.fnHash = {};
    this.styleHash = {};
  }

  More.parse=function(code) {
    return (new More()).parse(code);
  }
  More.parseFile=function(file, combo) {
    return (new More()).parseFile(file, combo);
  }
  More.suffix=function(str) {
    if(str) {
      global.suffix = str.replace(/^\./, '');
    }
    return global.suffix;
  }
  More.root=function(str) {
    if(str) {
      if(!/\/\\$/.test(str)) {
        str += '/';
      }
      global.root = str;
    }
    return global.root;
  }
  More.vars=function(o, mix) {
    if(o) {
      if(mix) {
        Object.keys(o).forEach(function(k) {
          global.var[k] = o[k];
        });
      }
      else {
        global.vars = o;
      }
    }
    return global.vars;
  }
  More.fns=function(o, mix) {
    if(o) {
      if(mix) {
        Object.keys(o).forEach(function(k) {
          global.fns[k] = o[k];
        });
      }
      else {
        global.fns = o;
      }
    }
    return global.fns;
  }
  More.styles=function(o, mix) {
    if(o) {
      if(mix) {
        Object.keys(o).forEach(function(k) {
          global.styles[k] = o[k];
        });
      }
      else {
        global.styles = o;
      }
    }
    return global.styles;
  }
  More.config=function(str, mix) {
    if(str) {
      var more = new More();
      more.parse(str);
      More.vars(more.vars(), mix);
      More.fns(more.fns(), mix);
      More.styles(more.styles(), mix);
    }
    return global;
  }
  More.configFile=function(file, mix) {
    return More.config(fs.readFileSync(file, { encoding: 'utf-8' }), mix);
  }
  More.clean=function() {
    global = {
      vars: {},
      fns: {},
      styles: {},
      suffix: 'css',
      root: ''
    };
    return global;
  }
  More.addKeyword=function(kw) {
    homunculus.getClass('rule', 'css').addKeyWord(kw);
  }
  More.compress=function(code, radical) {
    return compress(code, radical);
  }


exports.default=More;