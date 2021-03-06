import fs from 'fs';
import path from 'path';

import homunculus from 'homunculus';

import preImport from './preImport';
import preVar from './preVar';
import preFn from './preFn';
import clone from './clone';
import compress from './compress';
import Tree from './Tree';

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

class More {
  constructor(code = '') {
    this.code = code;
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
  parse(code, type = More.INDEPENDENT) {
    var self = this;
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
  parseFile(file, type = More.INDEPENDENT) {
    var self = this;
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
  mixImport(file, data, list) {
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
  preParse(ignoreImport) {
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
  parseOn() {
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
  preJoin() {
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
  ast() {
    return this.node;
  }
  tokens() {
    return this.parser.lexer.tokens();
  }
  imports() {
    return this.importStack;
  }

  vars(o, mix) {
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
  fns(o, mix) {
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
  styles(o, mix) {
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
  config(str, mix) {
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
  configFile(file, mix) {
    return this.config(fs.readFileSync(file, { encoding: 'utf-8' }), mix);
  }
  clean() {
    this.varHash = {};
    this.fnHash = {};
    this.styleHash = {};
  }
  path(file) {
    if(file) {
      this.file = file;
    }
    return this.file;
  }

  static parse(code, type) {
    return (new More()).parse(code, type);
  }
  static parseFile(file, type) {
    return (new More()).parseFile(file, type);
  }
  static suffix(str) {
    if(str) {
      globals.suffix = str.replace(/^\./, '');
    }
    return globals.suffix;
  }
  static root(str) {
    if(str) {
      if(!/\/\\$/.test(str)) {
        str += '/';
      }
      globals.root = str;
    }
    return globals.root;
  }
  static vars(o, mix) {
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
  static fns(o, mix) {
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
  static styles(o, mix) {
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
  static config(str, mix) {
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
  static configFile(file, mix) {
    return More.config(fs.readFileSync(file, { encoding: 'utf-8' }), mix);
  }
  static clean() {
    globals.vars = {};
    globals.fns = {};
    globals.styles = {};
    globals.map = null;
    globals.suffix = '';
    globals.root = '';
    globals.file = '';
    return globals;
  }
  static path(file) {
    if(file) {
      globals.file = file;
    }
    return globals.file;
  }

  static addKeyword(kw) {
    homunculus.getClass('rule', 'css').addKeyWord(kw);
  }
  static compress(code, options, radical) {
    return compress(code, options, radical);
  }
  static map(data) {
    if(typeof data != 'undefined') {
      globals.map = data;
    }
    return globals.map;
  }
}

More.INDEPENDENT = 0;
More.INCLUDE = 1;
More.COMPLEX = 2;

export default More;