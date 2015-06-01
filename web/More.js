define(function(require, exports, module){var fs=function(){var _0=require('fs');return _0.hasOwnProperty("fs")?_0.fs:_0.hasOwnProperty("default")?_0["default"]:_0}();
var path=function(){var _1=require('path');return _1.hasOwnProperty("path")?_1.path:_1.hasOwnProperty("default")?_1["default"]:_1}();

var homunculus=function(){var _2=require('homunculus');return _2.hasOwnProperty("homunculus")?_2.homunculus:_2.hasOwnProperty("default")?_2["default"]:_2}();

var preImport=function(){var _3=require('./preImport');return _3.hasOwnProperty("preImport")?_3.preImport:_3.hasOwnProperty("default")?_3["default"]:_3}();
var preVar=function(){var _4=require('./preVar');return _4.hasOwnProperty("preVar")?_4.preVar:_4.hasOwnProperty("default")?_4["default"]:_4}();
var preFn=function(){var _5=require('./preFn');return _5.hasOwnProperty("preFn")?_5.preFn:_5.hasOwnProperty("default")?_5["default"]:_5}();
var clone=function(){var _6=require('./clone');return _6.hasOwnProperty("clone")?_6.clone:_6.hasOwnProperty("default")?_6["default"]:_6}();
var compress=function(){var _7=require('./compress');return _7.hasOwnProperty("compress")?_7.compress:_7.hasOwnProperty("default")?_7["default"]:_7}();
var Tree=function(){var _8=require('./Tree');return _8.hasOwnProperty("Tree")?_8.Tree:_8.hasOwnProperty("default")?_8["default"]:_8}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var globals = {
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
    this.styleHash = clone(globals.styles);
    this.styleTemp = 0;
    this.fnHash = {};
    this.res = '';
    this.index = 0;
    this.ignores = {};
    this.msg = null;
    this.selectorStack = [];
    this.importStack = [];
    this.file = '';
  }
  More.prototype.parse = function(code, type) {
    if(type===void 0)type=More.INDEPENDENT;var self = this;
    if(code){
      self.code = code;
    }
    self.preParse(type && type !== More.INDEPENDENT);
    if(self.msg) {
      return self.msg;
    }
    if(type !== More.INDEPENDENT && self.imports().length) {
      var list = [];
      var res = '';
      var data = {
        vars: {},
        fns: {},
        styles: {}
      };
      self.imports().forEach(function(im) {
        if(globals.map) {
          //映射类型可能是回调
          if(typeof globals.map == 'function') {
            im = globals.map(im);
          }
          else if(globals.map.hasOwnProperty(im)){
            im = globals.map[im];
          }
        }
        if(!/\.\w+$/.test(im)) {
          im += '.css';
        }
        if(globals.suffix && globals.suffix != 'css') {
          im = im.replace(/\.\w+$/, '.' + globals.suffix);
        }
        var iFile;
        if(im.charAt(0) == '/') {
          iFile = path.join(More.root(), '.' + im);
        }
        else {
          iFile = path.join(path.dirname(self.file), im);
        }
        self.mixImport(iFile, data, list);
      });
      var error = '';
      //COMPLEX类型
      if(type == More.COMPLEX) {
        list.forEach(function(more, i) {
          if(error) {
            return;
          }
          if(more.msg) {
            error = more.msg;
            return;
          }
          res += more.parseOn();
        });
        if(error) {
          return error;
        }
        return res += self.parseOn();
      }
      //INCLUDE类型
      Object.keys(self.varHash).forEach(function(k) {
        data.vars[k] = self.varHash[k];
      });
      Object.keys(self.fnHash).forEach(function(k) {
        data.fns[k] = self.fns[k];
      });
      self.vars(data.vars);
      self.fns(data.fns);
      list.forEach(function(more, i) {
        if(error) {
          return;
        }
        more.vars(data.vars);
        more.fns(data.fns);
        if(i) {
          more.styles(list[i - 1].styles());
        }
        if(more.msg) {
          error = more.msg;
          return;
        }
        res += more.parseOn();
      });
      if(error) {
        return error;
      }
      self.styles(list[list.length - 1].styles());
      return res += self.parseOn();
    }
    return self.parseOn();
  }
  //combo指明为INCLUDE时，将全部@import文件合并进来分析
  //简易使用可忽略此参数，默认INDEPENDENT此时变量作用域不是页面，而是此文件本身
  //COMPLEX为合并@import但每个文件还是隔离作用域
  //按css规范（草案）及历史设计延续，变量作用域应该以页面为准，后出现拥有高优先级
  More.prototype.parseFile = function(file, type) {
    if(type===void 0)type=More.INDEPENDENT;var self = this;
    self.file = file;
    var code = fs.readFileSync(file, { encoding: 'utf-8' });
    self.code = code;
    self.preParse(type !== More.INDEPENDENT);
    if(self.msg) {
      return self.msg;
    }
    if(type && type != More.INDEPENDENT && self.imports().length) {
      return self.parse(code, type);
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
      if(globals.map) {
        //映射类型可能是回调
        if(typeof globals.map == 'function') {
          im = globals.map(im);
        }
        else if(globals.map.hasOwnProperty(im)){
          im = globals.map[im];
        }
      }
      if(!/\.\w+$/.test(im)) {
        im += '.css';
      }
      if(globals.suffix && globals.suffix != 'css') {
        im = im.replace(/\.\w+$/, '.' + globals.suffix);
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
    preVar(this.node, this.ignores, this.index, this.varHash, globals.vars, this.file || globals.file);
    preFn(this.node, this.ignores, this.index, this.fnHash, globals.fns, this.file || globals.file);
  }
  More.prototype.parseOn = function() {
    this.preJoin();
    var tree = new Tree(
      this.ignores,
      this.index,
      this.varHash,
      globals.vars,
      this.fnHash,
      globals.fns,
      this.styleHash,
      this.styleTemp,
      this.selectorStack,
      globals.map,
      false,
      true,
      this.file || globals.file
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

  More.parse=function(code, type) {
    return (new More()).parse(code, type);
  }
  More.parseFile=function(file, type) {
    return (new More()).parseFile(file, type);
  }
  More.suffix=function(str) {
    if(str) {
      globals.suffix = str.replace(/^\./, '');
    }
    return globals.suffix;
  }
  More.root=function(str) {
    if(str) {
      if(!/\/\\$/.test(str)) {
        str += '/';
      }
      globals.root = str;
    }
    return globals.root;
  }
  More.vars=function(o, mix) {
    if(o) {
      if(mix) {
        Object.keys(o).forEach(function(k) {
          globals.vars[k] = o[k];
        });
      }
      else {
        globals.vars = o;
      }
    }
    return globals.vars;
  }
  More.fns=function(o, mix) {
    if(o) {
      if(mix) {
        Object.keys(o).forEach(function(k) {
          globals.fns[k] = o[k];
        });
      }
      else {
        globals.fns = o;
      }
    }
    return globals.fns;
  }
  More.styles=function(o, mix) {
    if(o) {
      if(mix) {
        Object.keys(o).forEach(function(k) {
          globals.styles[k] = o[k];
        });
      }
      else {
        globals.styles = o;
      }
    }
    return globals.styles;
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
    return globals;
  }
  More.configFile=function(file, mix) {
    return More.config(fs.readFileSync(file, { encoding: 'utf-8' }), mix);
  }
  More.clean=function() {
    globals.vars = {};
    globals.fns = {};
    globals.styles = {};
    globals.map = null;
    globals.suffix = '';
    globals.root = '';
    globals.file = '';
    return globals;
  }
  More.path=function(file) {
    if(file) {
      globals.file = file;
    }
    return globals.file;
  }

  More.addKeyword=function(kw) {
    homunculus.getClass('rule', 'css').addKeyWord(kw);
  }
  More.compress=function(code, options, radical) {
    return compress(code, options, radical);
  }
  More.map=function(data) {
    if(typeof data != 'undefined') {
      globals.map = data;
    }
    return globals.map;
  }


More.INDEPENDENT = 0;
More.INCLUDE = 1;
More.COMPLEX = 2;

exports["default"]=More;});