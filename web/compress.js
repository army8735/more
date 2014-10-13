define(function(require, exports, module){var Clean=function(){var _8=require('clean-css');return _8.hasOwnProperty("Clean")?_8.Clean:_8.hasOwnProperty("default")?_8.default:_8}();
var sort=function(){var _9=require('./sort');return _9.hasOwnProperty("sort")?_9.sort:_9.hasOwnProperty("default")?_9.default:_9}();

var homunculus=require('homunculus');

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

exports.default=function(code, radical) {
  return (new Compress(code, radical)).compress();
}

var tempSelector;
var tempStyle;
var tempValue;


  function Compress(code, radical) {
    this.code = code;
    this.head = '';
    this.body = '';
    this.radical = radical;
  }
  Compress.prototype.compress = function() {
    try {
      this.code = (new Clean({
        processImport: false
      })).minify(this.code);
    } catch(e) {
      return e.toString();
    }
    if(!this.radical) {
      return this.code;
    }
    var parser = homunculus.getParser('css');
    try {
      this.node = parser.parse(this.code);
      this.ignores = parser.ignore();
      this.index = 0;
    }
    catch(e) {
      if(typeof console != 'undefined') {
        console.error(e);
      }
      return e.toString();
    }
    var i = this.getHead();
    var list = this.rebuild(i);
    this.merge(list);
    this.join();
    return this.head + this.body;
  }
  Compress.prototype.getHead = function() {
    var leaves = this.node.leaves();
    for(var i = 0, len = leaves.length; i < len; i++) {
      var leaf = leaves[i];
      if(leaf.name() == Node.STYLESET) {
        return i;
      }
      this.joinHead(leaf);
    }
  }
  Compress.prototype.joinHead = function(node) {
    var self = this;
    var isToken = node.name() == Node.TOKEN;
    if(isToken) {
      var token = node.token();
      if(token.type() != Token.VIRTUAL) {
        self.head += token.content();
        while(self.ignores[++self.index]) {
          var ig = self.ignores[self.index];
          self.head += ig.content();
        }
      }
    }
    else {
      node.leaves().forEach(function(leaf) {
        self.joinHead(leaf);
      });
    }
  }
  Compress.prototype.rebuild = function(i) {
    var list = [];
    var leaves = this.node.leaves();
    for(var len = leaves.length; i < len; i++) {
      var leaf = leaves[i];
      var item = {
        selectors: [],
        styles: []
      };
      this.rb(leaf, item);
      //将选择器排序，比较时可直接==比较
      sort(item.selectors);
      item.s2s = item.selectors.join(',');
      list.push(item);
    }
    return list;
  }
  Compress.prototype.rb = function(node, item, isSelector, isStyle, isKey, isValue) {
    var self = this;
    var isToken = node.name() == Node.TOKEN;
    if(isToken) {
      var token = node.token();
      if(token.type() != Token.VIRTUAL) {
        if(isSelector) {
          tempSelector += token.content();
        }
        else if(isStyle) {
          tempValue += token.content();
          if(token.type() == Token.HACK) {
            if(isKey) {
              tempStyle.prefixHack = token.content();
            }
            else {
              tempStyle.suffixHack = token.content();
            }
          }
          else if(token.type() == Token.IMPORTANT) {
            tempStyle.important = true;
          }
        }
        while(self.ignores[++self.index]) {
          var ig = self.ignores[self.index];
          if(isSelector) {
            tempSelector += ig.content();
          }
          else if(isStyle) {
            tempValue += ig.content();
          }
        }
      }
    }
    else {
      if(node.name() == Node.SELECTOR) {
        tempSelector = '';
        isSelector = true;
      }
      else if(node.name() == Node.STYLE) {
        tempStyle = {
          value: '',
          prefixHack: '',
          suffixHack: '',
          important: false
        };
        tempValue = '';
        isStyle = true;
      }
      else if(node.name() == Node.KEY) {
        isKey = true;
      }
      else if(node.name() == Node.VALUE) {
        isValue = true;
      }
      node.leaves().forEach(function(leaf) {
        self.rb(leaf, item, isSelector, isStyle, isKey, isValue);
      });
      if(node.name() == Node.SELECTOR) {
        item.selectors.push(tempSelector);
      }
      else if(node.name() == Node.STYLE) {
        tempStyle.value = tempValue;
        item.styles.push(tempStyle);
      }
    }
  }
  Compress.prototype.noImpact = function(list, first, last, child) {
    var mode = false;
    if(child !== undefined) {
      mode = true;
    }
    for(var i = first; i <= last; i++) {
      if(list[i].s2s.indexOf(':-ms-') > -1) {
        return false;
      }
    }
  }
  Compress.prototype.merge = function() {
    //
  }
  Compress.prototype.join = function() {
    //
  }

});