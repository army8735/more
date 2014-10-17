define(function(require, exports, module){var Clean=function(){var _17=require('clean-css');return _17.hasOwnProperty("Clean")?_17.Clean:_17.hasOwnProperty("default")?_17.default:_17}();
var sort=function(){var _18=require('./sort');return _18.hasOwnProperty("sort")?_18.sort:_18.hasOwnProperty("default")?_18.default:_18}();
var KEY_HASH=function(){var _19=require('./abbreviationKey.js');return _19.hasOwnProperty("KEY_HASH")?_19.KEY_HASH:_19.hasOwnProperty("default")?_19.default:_19}();
var impact=require('./impact');

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
    /* 获取新数据结构list后，处理以下5个步骤：
      1合并相同选择器（检测是否冲突）、
      2去除重复样式（合并后可能造成的重复，包括优先级重复）、
      3去除被覆盖的样式（合并后可能造成的缩写覆盖）、
      4聚合相同样式的选择器（样式确保唯一后排序，不冲突则合并相同的）、
      5提取公因子（最大图形选择算法），
      2和3已被clean-css实现，无需重复
     */
    this.merge(list);
    this.merge(list, true);
    this.preJoin(list);
    this.union(list);
    this.preRelease(list);
    this.extract(list);
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
          content: '',
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
        tempStyle.content = tempValue;
        tempStyle.value = tempValue.replace(/\s*!important\s*$/i, '')
          .slice(0, tempValue.length - tempStyle.suffixHack.length)
          .toLowerCase();
        item.styles.push(tempStyle);
      }
    }
  }
  //合并相同选择器，向前向后两个方向
  Compress.prototype.merge = function(list, direction) {
    //冒泡处理，因为可能处理后留有多个相同选择器，但后面的选择器可继续递归过程
    var res = false;
    if(direction) {
      outer:
      for(var i = list.length - 1; i > 0; i--) {
        for(var j = i - 1; j >= 0; j--) {
          if(list[i].s2s == list[j].s2s) {
            if(impact.noImpact(list, i, j)) {
              list[i].styles = list[j].styles.concat(list[i].styles);
              list.splice(j, 1);
              impact.upImCache(j);
              i--;
              j--;
              res = true;
            }
            else {
              continue outer;
            }
          }
        }
      }
    }
    else {
      outer:
      for(var i = 0; i < list.length - 1; i++) {
        for(var j = i + 1; j < list.length; j++) {
          if(list[i].s2s == list[j].s2s) {
            if(impact.noImpact(list, i, j)) {
              list[i].styles = list[i].styles.concat(list[j].styles);
              list.splice(j, 1);
              impact.upImCache(j);
              j--;
              res = true;
            }
            else {
              continue outer;
            }
          }
        }
      }
    }
    //递归处理，直到没有可合并的为止
    if(res) {
      this.merge(list, direction);
    }
  }
  Compress.prototype.preJoin = function(list) {
    //为union做准备，将选择器的样式拼接在一起存至value属性下，可直接==比较
    list.forEach(function(item) {
      sort(item.styles, function(a, b) {
        return a.key > b.key;
      });
      item.value = '';
      var len = item.styles.length;
      item.styles.forEach(function(style, i) {
        item.value += style.key;
        item.value += ':';
        item.value += style.content.toLowerCase();
        if(i < len - 1) {
          item.value += ';';
        }
      });
    });
  }
  Compress.prototype.preRelease = function(list) {
    //union完成后删除value属性
    list.forEach(function(item) {
      delete item.value;
    });
  }
  //聚合相同样式的选择器
  Compress.prototype.union = function(list) {
    var res = false;
    outer:
    for(var i = 0; i < list.length - 1; i++) {
      for(var j = i + 1; j < list.length; j++) {
        if(list[i].value == list[j].value) {
          if(impact.noImpact(list, i, j)) {
            list[i].selectors = list[i].selectors.concat(list[j].selectors);
            sort(list[i].selectors);
            list[i].s2s = list[i].selectors.join(',');
            list.splice(j, 1);
            impact.upImCache(j);
            j--;
            res = true;
          }
          else {
            continue outer;
          }
        }
      }
    }
    if(res) {
      this.union(list);
    }
  }
  //提取公因子
  Compress.prototype.extract = function(list) {
    //
  }
  Compress.prototype.join = function(list) {
    var body = '';
    list.forEach(function(item) {
      body += item.s2s;
      body += '{';
      var len = item.styles.length;
      item.styles.forEach(function(style, i) {
        body += style.key;
        body += ':';
        body += style.content;
        if(i < len - 1) {
          body += ';';
        }
      });
      body += '}';
    });
    return body;
  }

});