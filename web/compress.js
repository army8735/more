define(function(require, exports, module){var Clean=function(){var _17=require('clean-css');return _17.hasOwnProperty("Clean")?_17.Clean:_17.hasOwnProperty("default")?_17.default:_17}();

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
    if(!this.radical) {
      var s = (new Clean()).minify(this.code.slice(this.head.length));
      return this.head + s;
    }
    var list = this.rebuild(i);console.log(JSON.stringify(list))
    this.merge();
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
      list.push(item);
    }
    return list;
  }
  Compress.prototype.rb = function(node, item, isSelector, isStyle) {
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
            tempStyle.hack = token.content();
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
          hack: '',
          important: false
        };
        tempValue = '';
        isStyle = true;
      }
      node.leaves().forEach(function(leaf) {
        self.rb(leaf, item, isSelector, isStyle);
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
  Compress.prototype.merge = function() {
    //
  }
  Compress.prototype.join = function() {
    //
  }

});