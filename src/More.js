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
import eventbus from './eventbus';
import checkLevel from './checkLevel';
import normalize from './normalize';
import compress from './compress';
import operate from './operate';

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
    if(node.isToken()) {
      var token = node.token();
      if(!token.isVirtual()) {
        eventbus.emit(node.nid());
        //标识下一个string是否自动拆分
        if(token.content() == '~' && token.type() != Token.HACK) {
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
            //map映射url
            if(token.import && global.map) {
              var quote = /^['"']/.test(str) ? str.charAt(0) : '';
              var val = quote ? str.slice(1, str.length - 1) : str;
              //映射类型可能是回调
              if(typeof global.map == 'function') {
                str = global.map(val);
                //如有引号，需处理转义
                if(quote) {
                  str = quote + str + quote;
                }
              }
              else if(global.map.hasOwnProperty(token.val())){
                str = global.map[val];
                if(quote) {
                  str = quote + str + quote;
                }
              }
            }
            //有@import url(xxx.css?xxx)的写法，需忽略
            if(token.import && str.indexOf('.css?') == -1) {
              //非.xxx结尾加上.css，非.css结尾替换掉.xxx为.css
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
          var parent = node.parent();
          if([Node.CALC, Node.ADDEXPR, Node.MTPLEXPR, Node.PRMREXPR].indexOf(parent.name()) == -1
            && [Node.VARDECL, Node.CPARAMS].indexOf(parent.parent().name()) == -1
            && !inFn(parent)
            && parent.parent().name() != Node.EXPR) {
            var opt = operate(node, self.varHash, global.vars);
            self.res += opt.value + opt.unit;
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
    if(prev.name() == Node.STYLESET && node.parent().name() == Node.STYLESET) {
      eventbus.on(last.nid(), function() {
        ignore(last, self.ignores, self.index);
      });
    }
    var s = concatSelector(this.selectorStack);
    var first = node.leaf(1);
    if(first.name() == Node.STYLESET && node.parent().name() == Node.STYLESET) {
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