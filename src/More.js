module fs from 'fs';
module homunculus from 'homunculus';

var Token = homunculus.getClass('token');

var global = {
  var: {},
  fn: {},
  st: {}
};

class More {
  constructor(data = {}) {
    this.data = data;
  }
  parse(data) {
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
      if(console) {
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
      Object.keys(this.data.st).forEach(function(k) {
        this.stHash[k] = this.data.st[k];
      });
    }
    preVar(node, ignore);
    preFn(node, ignore);
    join(node, ignore);
    extend();
    return res;
  }
  init(ignore) {
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
    this.stHash = {};
    this.fnHash = {};

    this.levels = [];
    this.exArr = [];
  }
  preVar(node, ignore) {

  }
  preFn(node, ignore) {

  }
  join(node, ignore) {

  }
  extend() {

  }

  static less(data = {}) {

  }
  static global(data = {}) {
    global = data;
  }
  static parse(...args) {
    var more = new More();
    return more.parse(...args);
  }
}

export default More;