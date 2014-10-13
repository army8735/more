define(function(require, exports, module){var Clean=function(){var _17=require('clean-css');return _17.hasOwnProperty("Clean")?_17.Clean:_17.hasOwnProperty("default")?_17.default:_17}();
var sort=function(){var _18=require('./sort');return _18.hasOwnProperty("sort")?_18.sort:_18.hasOwnProperty("default")?_18.default:_18}();

var homunculus=require('homunculus');

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

exports.default=function(code, radical) {
  return (new Compress(code, radical)).compress();
}

var tempSelector;
var tempStyle;
var tempKey;
var tempValue;
var KEYS = {
  background: true,
  font: true,
  margin: true,
  padding: true,
  'list-style': true,
  overflow: true,
  border: true,
  'border-left': true,
  'border-top': true,
  'border-right': true,
  'border-bottom': true,
  'border-radius': true,
  'background-position': true,
  'background-color': true,
  'background-repeat': true,
  'background-attachment': true,
  'background-image': true,
  'font-style': true,
  'line-height': true,
  'font-family': true,
  'font-variant': true,
  'font-size': true,
  'margin-left': true,
  'margin-right': true,
  'margin-bottom': true,
  'margin-top': true,
  'padding-left': true,
  'padding-right': true,
  'padding-bottom': true,
  'padding-top': true,
  'list-style-image': true,
  'list-style-position': true,
  'list-style-type': true,
  'overlfow-x': true,
  'overlfow-y': true,
  'border-left-width': true,
  'border-left-color': true,
  'border-left-style': true,
  'border-right-width': true,
  'border-right-color': true,
  'border-right-style': true,
  'border-top-width': true,
  'border-top-color': true,
  'border-top-style': true,
  'border-bottom-width': true,
  'border-bottom-color': true,
  'border-bottom-style': true,
  'border-top-left-radius': true,
  'border-top-right-radius': true,
  'border-bottom-left-radius': true,
  'border-bottom-right-radius': true
};


  function Compress(code, radical) {
    this.code = code;
    this.radical = radical;
    this.head = '';
    this.imCache = {};
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
    this.union(list);
    return this.head + this.join(list);
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
        var s = token.content();
        if(isSelector) {
          tempSelector += s;
        }
        else if(isStyle) {
          if(isKey) {
            tempKey += s;
          }
          else if(isValue) {
            tempValue += s;
          }
          if(token.type() == Token.HACK) {
            if(isKey) {
              tempStyle.prefixHack = s;
            }
            else if(isValue) {
              tempStyle.suffixHack = s;
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
            if(isKey) {
              tempKey += ig.content();
            }
            else if(isValue) {
              tempValue += ig.content();
            }
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
          key: '',
          value: '',
          prefixHack: '',
          suffixHack: '',
          important: false
        };
        tempKey = '';
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
        tempStyle.key = tempKey;
        tempStyle.value = tempValue;
        item.styles.push(tempStyle);
      }
    }
  }
  Compress.prototype.noImpact = function(list, first, last, child) {
    //不指定child则两个选择器完全没冲突，否则仅child的样式无冲突
    var mode = false;
    if(child !== undefined) {
      mode = true;
    }
    for(var i = Math.min(first, last); i <= Math.max(first, last); i++) {
      if(list[i].s2s.indexOf(':-ms-') > -1) {
        return false;
      }
    }
    //紧邻选择器无优先级影响
    if(first == last - 1 || first == last + 1) {
      return true;
    }
    //非紧邻先取可能缓存的判断结果
    else if(!mode && this.imCache[first + ',' + last] !== undefined) {
      return this.imCache[first + ',' + last];
    }
    //非紧邻若无相同样式或important优先级不同无影响
    else {
      var hash = {};
      //向前和向后以索引大小为基准
      if(first < last) {
        //将last的样式出现记录在hash上
        list[last].styles.forEach(function(style) {
          hash[style.key.slice(style.prefixHack.length)] = {
            important: style.important,
            value: style.value
          };
        });
        for(var i = first + 1; i < last; i++) {
          var item = list[i];
          var styles = item.styles;
          for(var j = 0, len = styles.length; j < len; j++) {
            var style = styles[j];
            var key = style.key.slice(style.prefixHack.length);
            if(hash[key]
              && hash[key].value == style.value
              && hash[key].important == style.important) {
              this.imCache[first, i] = false;
              return false;
            }
            this.imCache[first, i] = true;
          }
        }
      }
      else {
        //将first的样式出现记录在hash上
        list[first].styles.forEach(function(style) {
          hash[style.key.slice(style.prefixHack.length)] = {
            important: style.important,
            value: style.value
          };
        });
        for(var i = last - 1; i > first; i++) {
          var item = list[i];
          var styles = item.styles;
          for(var j = 0, len = styles.length; j < len; j++) {
            var style = styles[j];
            var key = style.key.slice(style.prefixHack.length);
            if(hash[key]
              && hash[key].value == style.value
              && hash[key].important == style.important) {
              this.imCache[i, first] = false;
              return false;
            }
            this.imCache[i, first] = true;
          }
        }
      }
    }
    return true;
  }
  //合并相同选择器
  Compress.prototype.merge = function(list) {
    //冒泡处理，因为可能处理后留有多个相同选择器，但后面的选择器可继续递归过程
    var res = false;
    for(var i = 0; i < list.length - 1; i++) {
      //
    }
    //递归处理，直到没有可合并的为止
    if(res) {
      merge(list);
    }
    return res;
  }
  //聚合相同样式的选择器
  Compress.prototype.union = function(list) {
    //
  }
  Compress.prototype.join = function(list) {
    var body = '';console.log(JSON.stringify(list))
    list.forEach(function(item) {
      body += item.s2s;
      body += '{';
      var len = item.styles.length;
      item.styles.forEach(function(style, i) {
        body += style.key;
        body += ':';
        body += style.value;
        if(i < len - 1) {
          body += ';';
        }
      });
      body += '}';
    });
    return body;
  }

});