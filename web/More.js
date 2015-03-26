define(function(require, exports, module){var fs=require('fs');
var path=require('path');

var homunculus=require('homunculus');

var preImport=function(){var _0=require('./preImport');return _0.hasOwnProperty("preImport")?_0.preImport:_0.hasOwnProperty("default")?_0.default:_0}();
var preVar=function(){var _1=require('./preVar');return _1.hasOwnProperty("preVar")?_1.preVar:_1.hasOwnProperty("default")?_1.default:_1}();
var preFn=function(){var _2=require('./preFn');return _2.hasOwnProperty("preFn")?_2.preFn:_2.hasOwnProperty("default")?_2.default:_2}();
var clone=function(){var _3=require('./clone');return _3.hasOwnProperty("clone")?_3.clone:_3.hasOwnProperty("default")?_3.default:_3}();
var compress=function(){var _4=require('./compress');return _4.hasOwnProperty("compress")?_4.compress:_4.hasOwnProperty("default")?_4.default:_4}();
var Tree=function(){var _5=require('./Tree');return _5.hasOwnProperty("Tree")?_5.Tree:_5.hasOwnProperty("default")?_5.default:_5}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var global = {
  vars: {},
  fns: {},
  styles: {},
  suffix: 'css',
  root: '',
  map: null,
  file: ''
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
    this.file = '';
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
    self.file = file;
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
        if(global.map) {
          //映射类型可能是回调
          if(typeof global.map == 'function') {
            im = global.map(im);
          }
          else if(global.map.hasOwnProperty(im)){
            im = global.map[im];
          }
        }
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
  //预分析变量和函数，因为允许后声明
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
    preVar(this.node, this.ignores, this.index, this.varHash, global.vars, this.file || global.file);
    preFn(this.node, this.ignores, this.index, this.fnHash);
  }
  More.prototype.parseOn = function() {
    this.preJoin();
    var tree = new Tree(
      this.ignores,
      this.index,
      this.varHash,
      global.vars,
      this.fnHash,
      global.fns,
      this.styleHash,
      this.styleTemp,
      this.selectorStack,
      global.map,
      false,
      true,
      this.file || global.file
    );
    var temp = tree.join(this.node);
    this.res += temp.res;
    this.index = temp.index;
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
  More.prototype.path = function(file) {
    if(file) {
      this.file = file;
    }
    return this.file;
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
          global.vars[k] = o[k];
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
      if(!mix) {
        More.clean();
      }
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
    global.vars = {};
    global.fns = {};
    global.styles = {};
    return global;
  }
  More.path=function(file) {
    if(file) {
      global.file = file;
    }
    return global.file;
  }

  More.addKeyword=function(kw) {
    homunculus.getClass('rule', 'css').addKeyWord(kw);
  }
  More.compress=function(code, options, radical) {
    return compress(code, options, radical);
  }
  More.map=function(data) {
    if(typeof data != 'undefined') {
      global.map = data;
    }
    return global.map;
  }


exports.default=More;});