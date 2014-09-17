module fs from 'fs';
module homunculus from 'homunculus';
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
  var: {},
  fn: {},
  style: {},
  suffix: 'css'
};

class More {
  constructor(data = { code: '' }) {
    this.data = data;
    this.node = null;
    this.parser = null;
  }
  parse(data) {
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
  init() {
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
      eventbus.emit(node.nid(), true);
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
        self.styleHash[se] = self.styleHash[se] || [];
        self.styleHash[se].push(self.res.length + 1);
      });
    }
  }
  preExtend(node) {
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
  extend() {
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
  saveStyle() {
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
    return this.importStatck;
  }
  config(data = {}) {
    More.config(data);
  }
  static config(data = {}) {
    Object.keys(data).forEach(function(k) {
      if(k == 'suffix') {
        data[k] = data[k].replace('.', '');
      }
      global[k] = data[k];
    });
  }
}

export default More;