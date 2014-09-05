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
    if(data===void 0)data={};this.data = data;
  }
  More.prototype.parse = function(data) {
    if(data) {
      this.data = data;
    }
    if(Object.prototype.toString.call(data) == '[object String]') {
      this.data = {
        code: this.data
      };
    }
    var parser = homunculus.getParser('css');
    var node;
    var ignore;
    try {
      node = parser.parse(data.code);
      ignore = parser.ignore();
    }
    catch(e) {
      if(typeof console != 'undefined') {
        console.error(e);
      }
      return e.toString();
    }
    this.init(ignore);
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
    if(this.data.st) {
      Object.keys(this.data.style).forEach(function(k) {
        this.styleHash[k] = this.data.style[k];
      });
    }
    this.preVar(node, ignore);
    this.preFn(node, ignore);
    this.join(node, ignore);
    this.extend();
    return res;
  }
  More.prototype.init = function(ignore) {
    this.res = '';
    this.index = 0;
    while(ignore[this.index]) {
      if(ignore[this.index].type() == Token.IGNORE) {
        this.res += ignore[this.index].content().replace(/\S/g, ' ');
      }
      else {
        this.res += ignore[this.index].content();
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
  More.prototype.preVar = function(node, ignore) {
    var self = this;
    var isToken = node.name() == Node.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(!isToken) {
      if(node.name() == Node.VARS) {
        var leaves = node.leaves();
        var k = leaves[0].leaves().content().slice(1);
        var v = '';
        while(ignore[++self.preIndex]) {}
        while(ignore[++self.preIndex]) {}
        //变量值可能不是元类型而是个样式，有多个token
        leaves[2].leaves().forEach(function(leaf) {
          var token = leaf.leaves();
          v += self.getVar(token.content(), token.type());
          while(ignore[++self.preIndex]) {
            v += ignore[self.preIndex].content();
          }
        });
        while(ignore[++self.preIndex]) {}
        varHash[k] = v;
      }
      else {
        node.leaves().forEach(function(leaf) {
          self.preVar(leaf, ignore);
        });
      }
    }
    else if(!isVirtual) {
      while(ignore[++self.preIndex]) {}
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
  More.prototype.preFn = function(node, ignore) {

  }
  More.prototype.join = function(node, ignore) {

  }
  More.prototype.extend = function() {

  }

  More.less=function(data) {

  if(data===void 0)data={};}
  More.stylus=function(data) {

  if(data===void 0)data={};}
  More.global=function(data) {
    if(data===void 0)data={};global = data;
  }
  More.parse=function(args) {
    args=[].slice.call(arguments, 0);var more = new More();
    return more.parse.apply(more, [].concat(function(){var _4=[],_5;while(!(_5=args.next()).done)_4.push(_5.value);return _4}()));
  }


exports.default=More;