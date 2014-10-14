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

var KEYS = [
  ['background', 'background-position', 'background-color', 'background-repeat', 'background-attachment', 'background-image'],
  ['font', 'font-family', 'font-size', 'font-style', 'line-height', 'font-variant'],
  ['margin', 'margin-left', 'margin-top', 'margin-right', 'margin-bottom'],
  ['padding', 'padding-left', 'padding-top', 'padding-right', 'padding-bottom'],
  ['overflow', 'overflow-x', 'overflow-y'],
  ['border', 'border-width', 'border-style', 'border-color',
    'border-left', 'border-top', 'border-right', 'border-bottom',
    'border-left-width', 'border-left-color', 'border-left-style',
    'border-right-width', 'border-right-color', 'border-right-style',
    'border-top-width', 'border-top-color', 'border-top-style',
    'border-bottom-width', 'border-bottom-color', 'border-bottom-style'],
  ['list-style', 'list-style-image', 'list-style-position', 'list-style-type'],
  ['border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius']
];
var KEY_HASH = {};
KEYS.forEach(function(ks, i) {
  ks.forEach(function(k) {
    KEY_HASH[k] = i;
  });
});


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
    this.union(list, true);
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
  Compress.prototype.getKey = function(style) {
    return style.key.slice(style.prefixHack.length).toLowerCase();
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
  Compress.prototype.noImpact = function(list, first, last, child) {
    var self = this;
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
    else if(!mode && self.imCache[first + ',' + last] !== undefined) {
      return this.imCache[first + ',' + last];
    }
    //非紧邻若无相同样式或important优先级不同无影响
    else {
      var hash = {};
      var abbreviation = {};
      //将last的样式出现记录在hash上
      list[last].styles.forEach(function(style) {
        var key = self.getKey(style);
        hash[key] = {
          important: style.important,
          value: style.value
        };
        //注意一些缩写语句
        if(KEY_HASH.hasOwnProperty(key)) {
          abbreviation[KEY_HASH[key]] = {
            important: style.important
          };
        }
      });
      //向前和向后以索引大小为基准
      if(first < last) {
        for(var i = first + 1; i < last; i++) {
          var item = list[i];
          var styles = item.styles;
          for(var j = 0, len = styles.length; j < len; j++) {
            var style = styles[j];
            var key = self.getKey(style);
            //值不等且优先级不等时冲突
            if(hash[key]
              && hash[key].value != style.value
              && hash[key].important == style.important) {
              self.imCache[i + ',' + last] = false;
              return false;
            }
            //有缩写且优先级不等也冲突
            else if(!hash[key] && KEY_HASH.hasOwnProperty(key)) {
              if(abbreviation.hasOwnProperty(KEY_HASH[key])
                && style.important == abbreviation[KEY_HASH[key]].important) {
                self.imCache[i + ',' + last] = false;
                return false;
              }
            }
          }
          self.imCache[i + ',' + last] = true;
        }
      }
      else {
        for(var i = first - 1; i > last; i--) {
          var item = list[i];
          var styles = item.styles;
          for(var j = 0, len = styles.length; j < len; j++) {
            var style = styles[j];
            var key = self.getKey(style);
            if(hash[key]
              && hash[key].value != style.value
              && hash[key].important == style.important) {
              self.imCache[i + ',' + last] = false;
              return false;
            }
            else if(!hash[key] && KEY_HASH.hasOwnProperty(key)) {
              if(abbreviation.hasOwnProperty(KEY_HASH[key])
                && style.important == abbreviation[KEY_HASH[key]].important) {
                self.imCache[i + ',' + last] = false;
                return false;
              }
            }
          }
          self.imCache[i + ',' + last] = true;
        }
      }
    }
    self.imCache[first + ',' + last] = true;
    return true;
  }
  Compress.prototype.upImCache = function(index) {
    var self = this;
    Object.keys(self.imCache).forEach(function(key) {
      var arr = key.split(',');
      if(arr[0] == index) {
        self.imCache[(index-1) + ',' + arr[1]] = self.imCache[key];
        delete self.imCache[key];
      }
      else if(arr[1] == index) {
        self.imCache[arr[0] + ',' + (index-1)] = self.imCache[key];
        delete self.imCache[key];
      }
    });
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
            if(this.noImpact(list, i, j)) {
              list[i].styles = list[j].styles.concat(list[i].styles);
              list.splice(j, 1);
              this.upImCache(j);
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
            if(this.noImpact(list, i, j)) {
              list[i].styles = list[i].styles.concat(list[j].styles);
              list.splice(j, 1);
              this.upImCache(j);
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
  //聚合相同样式的选择器，向前向后两个方向
  Compress.prototype.union = function(list, direction) {
    var res = false;
    if(direction) {
      outer:
      for(var i = list.length - 1; i > 0; i--) {
        for(var j = i - 1; j >= 0; j--) {
          if(list[i].value == list[j].value) {
            if(this.noImpact(list, i, j)) {
              list[i].selectors = list[j].selectors.concat(list[i].selectors);
              sort(list[i].selectors);
              list[i].s2s = list[i].selectors.join(',');
              list.splice(j, 1);
              this.upImCache(j);
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
          if(list[i].value == list[j].value) {
            if(this.noImpact(list, i, j)) {
              list[i].selectors = list[i].selectors.concat(list[j].selectors);
              sort(list[i].selectors);
              list[i].s2s = list[i].selectors.join(',');
              list.splice(j, 1);
              this.upImCache(j);
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
    if(res) {
      this.union(list, direction);
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