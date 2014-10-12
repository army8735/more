import Clean from 'clean-css';

module homunculus from 'homunculus';

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

export default function(code, radical) {
  return (new Compress(code, radical)).compress();
}

var tempSelector;
var tempStyle;
var tempValue;

class Compress {
  constructor(code, radical) {
    this.code = code;
    this.head = '';
    this.body = '';
    this.radical = radical;
  }
  compress() {
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
    var list = this.rebuild(i);
    this.merge();
    this.join();
    return this.head + this.body;
  }
  getHead() {
    var leaves = this.node.leaves();
    for(var i = 0, len = leaves.length; i < len; i++) {
      var leaf = leaves[i];
      if(leaf.name() == Node.STYLESET) {
        return i;
      }
      this.joinHead(leaf);
    }
  }
  joinHead(node) {
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
  rebuild(i) {
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
  rb(node, item, isSelector, isStyle, isKey, isValue) {
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
  merge() {
    //
  }
  join() {
    //
  }
}
