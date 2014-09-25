module fs from 'fs';
module path from 'path';

module homunculus from 'homunculus';

import preImport from './preImport';
import preVar from './preVar';
import getVar from './getVar';
import preFn from './preFn';
import getFn from './getFn';
import ignore from './ignore';
import clone from './clone';
import join from './join';
import concatSelector from './concatSelector';
import eventbus from './eventbus.js';
import checkLevel from './checkLevel.js';
import normalize from './normalize.js';

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

var relations = {};

class More {
  constructor(code = '') {
    this.code = code;
    this.node = null;
    this.parser = null;
    this.varHash = {};
    this.styleHash = {};
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
    this.preParse(code, ignoreImport);
    if(this.msg) {
      return this.msg;
    }
    return this.parseOn();
  }
  mixFrom(file, data, list) {
    var self = this;
    var code = fs.readFileSync(file, { encoding: 'utf-8' });
    var more = new More();
    more.preParse(code);
    more.imports().forEach(function(im) {
      if(global.suffix != 'css') {
        im = im.replace(/\.\w+$/, global.suffix);
      }
      var iFile = path.join(path.dirname(file), im);
      list.push(iFile);
      self.mixFrom(iFile, data);
    });
    var vars = more.vars();
    Object.keys(vars).forEach(function(v) {
      data.vars[v] = vars[v];
    });
    var fns = more.fns();
    Object.keys(fns).forEach(function(v) {
      data.fns[v] = fns[v];
    });
    more.parseOn();
    var styles = more.styles();
    Object.keys(styles).forEach(function(v) {
      data.styles[v] = data.styles[v] || '';
      data.styles[v] += styles[v];
    });
    relations[file] = relations[file] || {};
    relations[file].styles = clone(data.styles);
  }
  //通过page参数区分是页面中link标签引入的css文件或独立访问，还是被css@import加载的
  //后端可通过request.refferrer来识别
  //简易使用可忽略此参数，此时变量作用域不是页面，而是此文件以及@import的文件
  //按css规范（草案）及历史设计延续，变量作用域应该以页面为准，后出现拥有高优先级
  parseFile(file, page = false) {
    var self = this;
    var code = fs.readFileSync(file, { encoding: 'utf-8' });
    self.preParse(code);
    if(self.msg) {
      return self.msg;
    }
    //page传入时说明来源于页面，删除可能存在与其对应的共享变量作用域
    if(page) {
      delete relations[file];
    }
    //否则是被@import导入的文件，直接使用已存的共享变量
    else if(relations.hasOwnProperty(file)) {
      self.varHash = relations[file].vars;
      self.fnHash = relations[file].fns;
      self.styleHash = relations[file].styles;
      delete relations[file];
      return self.parseOn();
    }
    //先预分析取得@import列表，递归其获取变量
    var data = {
      vars: {},
      fns: {},
      styles: {}
    };
    var list = [];
    self.imports().forEach(function(im) {
      if(global.suffix != 'css') {
        im = im.replace(/\.\w+$/, global.suffix);
      }
      var iFile = path.join(path.dirname(file), im);
      list.push(iFile);
      self.mixFrom(iFile, data, list);
    });
    //合并@import文件中的变量
    Object.keys(data.vars).forEach(function(v) {
      if(!self.varHash.hasOwnProperty(v)) {
        self.varHash[v] = data.vars[v];
      }
    });
    Object.keys(data.fns).forEach(function(v) {
      if(!self.fnHash.hasOwnProperty(v)) {
        self.fnHash[v] = data.fns[v];
      }
    });
    self.styleHash = data.styles;
    //page传入时说明来源于页面，将变量存储于@import的文件中，共享变量作用域
    if(page) {
      list.forEach(function(iFile) {
        relations[iFile] = relations[iFile] || {};
        relations[iFile].vars = self.varHash;
        relations[iFile].fns =  self.fnHash;
      });
    }
    return self.parseOn();
  }
  preParse(code, ignoreImport) {
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
      return this.msg = e.toString();
    }
    this.importStack = preImport(this.node, this.ignores, this.index, ignoreImport);
    preVar(this.node, this.ignores, this.index, this.varHash);
    preFn(this.node, this.ignores, this.index, this.fnHash);
  }
  parseOn() {
    this.preJoin();
    this.join(this.node);
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
  join(node) {
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
  styleset(start, node) {
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
  block(node) {
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
  extend(node) {
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
            if(se2.indexOf(se1) == 0 && se2.length != se1.length && se1.indexOf(se2) == -1) {
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
  saveStyle(k, v) {
    this.styleHash[k] = this.styleHash[k] || '';
    v = v.trim();
    if(v.length && v.charAt(v.length - 1) != ';') {
      v += ';';
    }
    this.styleHash[k] += v;
  }
  impt(node) {
    var url = node.leaf(1);
    if(url.size() == 1) {
      url.first().token().import = true;
    }
    else {
      url.leaf(2).token().import = true;
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
  config(str) {
    var self = this;
    if(str) {
      this.preParse(str);
    }
    return {
      vars: self.varHash,
      fns: self.fnHash,
      styles: self.styleHash
    };
  }
  configFile(file) {
    return this.config(fs.readFileSync(file, { encoding: 'utf-8' }));
  }
  clean() {
    this.varHash = {};
    this.fnHash = {};
    this.styleHash = {};
  }
  buildFile(file, page = false) {
    var self = this;
    var code = fs.readFileSync(file, { encoding: 'utf-8' });
    self.preParse(code, true);
    if(self.msg) {
      return self.msg;
    }
    //先预分析取得@import列表，递归其获取变量
    var data = {
      vars: {},
      fns: {},
      styles: {}
    };
    var list = [];
    self.imports().forEach(function(im) {
      if(global.suffix != 'css') {
        im = im.replace(/\.\w+$/, global.suffix);
      }
      var iFile = path.join(path.dirname(file), im);
      list.push(iFile);
      self.mixFrom(iFile, data, []);
    });
    //合并@import文件中的变量
    Object.keys(data.vars).forEach(function(v) {
      if(!self.varHash.hasOwnProperty(v)) {
        self.varHash[v] = data.vars[v];
      }
    });
    Object.keys(data.fns).forEach(function(v) {
      if(!self.fnHash.hasOwnProperty(v)) {
        self.fnHash[v] = data.fns[v];
      }
    });
    self.styleHash = data.styles;
    var res = '';
    //page传入时说明来源于页面，将变量存储于@import的文件中，共享变量作用域
    if(page) {
      delete relations[file];
      list.forEach(function(iFile) {
        res += More.buildIn(iFile, {
          vars: self.varHash,
          fns: self.fnHash
        });
      });
    }
    //否则作用域为顺序，递归执行build即可
    else {
      list.forEach(function(iFile) {
        res += More.buildFile(iFile);
      });
    }
    res += self.parseOn();
    return res;
  }
  static buildIn(file, data) {
    var more = new More();
    var code = fs.readFileSync(file, { encoding: 'utf-8' });
    more.preParse(code, true);
    if(more.msg) {
      return more.msg;
    }
    var res = '';
    more.imports().forEach(function(im) {
      if(global.suffix != 'css') {
        im = im.replace(/\.\w+$/, global.suffix);
      }
      var iFile = path.join(path.dirname(file), im);
      res += More.buildIn(iFile, data);
    });
    more.vars(data.vars);
    more.fns(data.fns);
    more.styles(relations[file].styles);
    res += more.parseOn();
    return res;
  }

  static parse(code) {
    return (new More()).parse(code);
  }
  static parseFile(file) {
    return (new More()).parseFile(code);
  }
  static buildFile(file, page) {
    return (new More).buildFile(file, page);
  }
  static suffix(str = null) {
    if(str) {
      global.suffix = str.replace(/^\./, '');
    }
    return global.suffix;
  }
  static root(str = null) {
    if(str) {
      global.root = str;
    }
    return global.root;
  }
  static localRoot(str = null) {
    if(str) {
      global.localRoot = str;
    }
    return global.localRoot;
  }
  static vars(o, mix) {
    if(o) {
      if(mix) {
        Object.keys(o).forEach(function(k) {
          global.varHash[k] = o[k];
        });
      }
      else {
        global.varHash = o;
      }
    }
    return global.varHash;
  }
  static fns(o, mix) {
    if(o) {
      if(mix) {
        Object.keys(o).forEach(function(k) {
          global.fnHash[k] = o[k];
        });
      }
      else {
        global.fnHash = o;
      }
    }
    return global.fnHash;
  }
  static styles(o, mix) {
    if(o) {
      if(mix) {
        Object.keys(o).forEach(function(k) {
          global.styleHash[k] = o[k];
        });
      }
      else {
        global.styleHash = o;
      }
    }
    return global.styleHash;
  }
  static config(str) {
    if(str) {
      var more = new More();
      more.parse(str);
      global.vars = more.vars();
      global.fns = more.fns();
      global.styles = more.styles();
    }
    return global;
  }
  static configFile(file) {
    return More.config(fs.readFileSync(file, { encoding: 'utf-8' }));
  }
  static clean() {
    global = {
      vars: {},
      fns: {},
      styles: {},
      suffix: 'css',
      root: '',
      localRoot: ''
    };
    return global;
  }
  static clearRelation() {
    relations = {};
    return relations;
  }
}

export default More;