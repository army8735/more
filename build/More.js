var fs=require('fs');
var homunculus=require('homunculus');

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var global = {
  var: {},
  fn: {},
  style: {}
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
      this.ignore = this.parser.ignore();
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
    this.preVar(this.node);
    this.preFn(this.node);
    this.join(this.node);
    this.extend();
    return this.res;
  }
  More.prototype.init = function() {
    this.res = '';
    this.index = 0;
    while(this.ignore[this.index]) {
      if(this.ignore[this.index].type() == Token.IGNORE) {
        this.res += this.ignore[this.index].content().replace(/\S/g, ' ');
      }
      else {
        this.res += this.ignore[this.index].content();
      }
      this.index++;
    }
    this.preIndex2 = this.preIndex = this.index;
    this.autoSplit = false;
    this.exHash = {};
    this.stack = [];
    this.imports = [];

    this.varHash = {};
    this.styleHash = {};
    this.fnHash = {};

    this.levels = [];
    this.exArr = [];
  }
  //预处理变量，遍历ast找到所有变量声明，将其存储至hash
  More.prototype.preVar = function(node) {
    var self = this;
    var isToken = node.name() == Node.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(!isToken) {
      if(node.name() == Node.VARS) {
        var leaves = node.leaves();
        var k = leaves[0].leaves().content().slice(1);
        var v = '';
        while(self.ignore[++self.preIndex]) {}
        while(self.ignore[++self.preIndex]) {}
        //变量值可能不是元类型而是个样式，有多个token
        leaves[2].leaves().forEach(function(leaf) {
          var token = leaf.leaves();
          v += self.getVar(token.content(), token.type());
          while(self.ignore[++self.preIndex]) {
            v += self.ignore[self.preIndex].content();
          }
        });
        while(self.ignore[++self.preIndex]) {}
        varHash[k] = v;
      }
      else {
        node.leaves().forEach(function(leaf) {
          self.preVar(leaf);
        });
      }
    }
    else if(!isVirtual) {
      while(self.ignore[++self.preIndex]) {}
    }
  }
  More.prototype.getVar = function(s, type) {
    if(s.indexOf('$') > -1 || s.indexOf('@') > -1) {
      for(var i = 0; i < s.length; i++) {
        if(s.charAt(i) == '\\') {
          i++;
          continue;
        }
        if(s.charAt(i) == '$' || s.charAt(i) == '@') {
          var c = s.charAt(i + 1),
            lit;
          if(c == '{') {
            var j = s.indexOf('}', i + 3);
            if(j > -1) {
              c = s.slice(i + 2, j);
              var vara = this.varHash[c] || global.var[c];
              if(vara) {
                s = s.slice(0, i) + (type == Token.STRING && /^['"]/.test(s) ? vara.replace(/^(['"])(.*)\1$/, '$2') : vara) + s.slice(j + 1);
              }
            }
          }
          else if(/[\w-]/.test(c)) {
            c = /^[\w-]+/.exec(s.slice(i + 1))[0];
            var vara = this.varHash[c] || global.var[c];
            if(vara) {
              s = s.slice(0, i) + (type == Token.STRING && /^['"]/.test(s) ? vara.replace(/^(['"])(.*)\1$/, '$2') : vara) + s.slice(i + c.length + 1);
            }
          }
        }
      }
    }
    return s;
  }
  More.prototype.preFn = function(node) {

  }
  More.prototype.join = function(node, config) {
    if(config===void 0)config={};var self = this;
    var isToken = node.name() == Node.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        var token = node.token();
        if(config.inHead) {
          var s = self.getVar(token.content(), token.type());
          if(config.isImport && token.type() == Token.STRING) {
            if(!/\.css['"]?$/.test(s)) {
              s = s.replace(/(['"]?)$/, '.css$1');
              self.imports.push(token.val() + '.css');
            }
            else {
              self.imports.push(token.val());
            }
            //兼容less，相对路径为根路径
            if(self.less) {
              if(/^(['"]?)\//.test(s)) {
                s = s.replace(/^(['"]?)\//, '$1' + root);
              }
              else {
                s = s.replace(/^(['"]?)([\w-])/, '$1' + root + '$2');
              }
            }
            else {
              s = s.replace(/^(['"]?)\//, '$1' + root);
            }
          }
          self.res += s;
        }
        else if(config.isVar) {
          //忽略变量声明
        }
        else if(config.isSelectors || config.isSelector && !config.isExtend) {
          var temp = self.stack[self.stack.length - 1];
          if(config.isSelectors) {
            temp.push('');
          }
          else {
            temp[temp.length - 1] += token.content();
          }
        }
        //继承和方法直接忽略
        else if(!config.isExtend && !config.isFn) {
          //兼容less的~String拆分语法
          if(self.autoSplit && token.type() == Token.STRING) {
            var s = token.content();
            var c = s.charAt(0);
            if(c != "'" && c != '"') {
              c = '"';
              s = c + s + c;
            }
            s = s.replace(/,/g, c + ',' + c);
            self.res = self.res.replace(/~\s*$/, '');
            self.res += self.getVar(s, token.type());
          }
          else {
            self.res += self.getVar(token.content(), token.type());
          }
          if(token.content() == '~') {
            self.autoSplit = true;
          }
          else {
            self.autoSplit = false;
          }
        }
        while(self.ignore[++self.index]) {
          var ig = self.ignore[self.index];
          var s = ig.type() == Token.IGNORE ? ig.content().replace(/\S/g, ' ') : ig.content();
          if(!config.inHead && (config.isSelectors || config.isSelector)) {
            var temp = self.stack[self.stack.length - 1];
            temp[temp.length - 1] += s;
          }
          else {
            self.res += s;
          }
        }
      }
    }
    else {
      config.isSelectors = node.name() == Node.SELECTORS;
      config.isSelector = node.name() == Node.SELECTOR;
      if(!config.inHead && [Node.FONTFACE, Node.MEDIA, Node.CHARSET, Node.IMPORT, Node.PAGE, Node.KEYFRAMES].indexOf(node.name()) != -1) {
        config.inHead = true;
        if(node.name() == Node.IMPORT) {
          config.isImport = true;
        }
      }
      else if(node.name() == Node.VARS) {
        config.isVar = true;
      }
      //将层级拆开
      else if(node.name() == Node.STYLESET && !config.inHead) {
        self.styleset(true, node, config.prev, config.next);
      }
      else if(node.name() == Node.BLOCK && !config.inHead) {
        self.block(true, node);
      }
      else if(node.name() == Node.EXTEND) {
        //占位符
        self.res += '@extend';
        config.isExtend = true;
        self.record(node);
      }
      else if(node.name() == Node.FN || node.name() == Node.FNC) {
        config.isFn = true;
        if(node.name() == Node.FNC) {
          self.compilerFn(node, this.ignore, self.index);
        }
      }
      var leaves = node.leaves();
      //递归子节点
      leaves.forEach(function(leaf, i) {
        self.join(leaf, {
        });
      });
      if(node.name() == Node.STYLESET & !config.inHead) {
        self.styleset(false, node, config.prev, config.next);
      }
      else if(node.name() == Node.BLOCK && !config.inHead) {
        self.block(false, node);
      }
    }
  }
  More.prototype.styleset = function() {

  }
  More.prototype.block = function() {

  }
  More.prototype.extend = function(node) {

  }
  More.prototype.ast = function() {
    return this.node;
  }
  More.prototype.tokens = function() {
    return this.parser.lexer.tokens();
  }

  More.less=function(data) {

  if(data===void 0)data={};}
  More.stylus=function(data) {

  if(data===void 0)data={};}
  More.global=function(data) {
    if(data===void 0)data={};global = data;
  }


exports.default=More;