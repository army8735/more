module fs from 'fs';
module path from 'path';

module homunculus from 'homunculus';

import preImport from './preImport';
import preVar from './preVar';
import preFn from './preFn';
import clone from './clone';
import compress from './compress';
import Tree from './Tree';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var global = {
  vars: {},
  fns: {},
  styles: {},
  suffix: 'css',
  root: '',
  map: null
};

class More {
  constructor(code = '') {
    this.code = code;
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
  parse(code, ignoreImport) {
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
  parseFile(file, combo) {
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
  mixImport(file, data, list) {
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
    preVar(this.node, this.ignores, this.index, this.varHash, global.vars);
    preFn(this.node, this.ignores, this.index, this.fnHash);
  }
  parseOn() {
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
      true
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

  static parse(code) {
    return (new More()).parse(code);
  }
  static parseFile(file, combo) {
    return (new More()).parseFile(file, combo);
  }
  static suffix(str) {
    if(str) {
      global.suffix = str.replace(/^\./, '');
    }
    return global.suffix;
  }
  static root(str) {
    if(str) {
      if(!/\/\\$/.test(str)) {
        str += '/';
      }
      global.root = str;
    }
    return global.root;
  }
  static vars(o, mix) {
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
  static fns(o, mix) {
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
  static styles(o, mix) {
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
    return global;
  }
  static configFile(file, mix) {
    return More.config(fs.readFileSync(file, { encoding: 'utf-8' }), mix);
  }
  static clean() {
    global.vars = {};
    global.fns = {};
    global.styles = {};
    return global;
  }
  static addKeyword(kw) {
    homunculus.getClass('rule', 'css').addKeyWord(kw);
  }
  static compress(code, options, radical) {
    return compress(code, options, radical);
  }
  static map(data) {
    if(typeof data != 'undefined') {
      global.map = data;
    }
    return global.map;
  }
}

export default More;

function inFn(node) {
  while(node = node.parent()) {
    if(node.name() == Node.FN) {
      return true;
    }
  }
  return false;
}