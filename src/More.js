module fs from 'fs';
module homunculus from 'homunculus';

var Token = homunculus.getClass('token');

var global = {

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
      data = {
        code: data
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
    this.stack = [];
    this.varHash = {};
    this.imports = [];
    this.autoSplit = false;
    this.exHash = {};
    this.styleMap = {};
    this.funcMap = {};
    this.levels = [];
    this.exArr = [];
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