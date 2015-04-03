import Clean from 'clean-css';
import sort from './sort';
import RegionCompress from './RegionCompress';

import homunculus from 'homunculus';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

export default function(code, options, radical) {
  return (new Compress(code, options, radical)).compress();
}

var tempSelector;
var tempStyle;
var tempKey;
var tempValue;

class Compress {
  constructor(code, options, radical) {
    this.code = code;
    if(options === true || options === false || options === undefined) {
      radical = options;
      options = {};
    }
    if(!options.hasOwnProperty('processImport')) {
      options.processImport = false;
    }
    this.options = options;
    this.radical = radical;
    this.head = '';
  }
  compress() {
    this.code = (new Clean(this.options)).minify(this.code).styles;
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
    var body = '';
    var regions = this.rebuild();
    regions.forEach(function(region) {
      var rc = new RegionCompress(region.list);
      body += region.pre + rc.compress() + region.suf;
    });
    return this.head + body;
  }
  joinHead(node) {
    var self = this;
    if(node.isToken()) {
      var token = node.token();
      if(!token.isVirtual()) {
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
  rebuild() {
    //rebuild将划分区域
    //除@media以外的@规则将被前置，存在head字符串中
    //连续的styleset组成一个区域，除非被@media打断；这个区域中可以激进压缩
    //@media的block里为一个区域
    var regions = [];
    var list = [];
    var leaves = this.node.leaves();
    for(var i = 0, len = leaves.length; i < len; i++) {
      var leaf = leaves[i];
      var name = leaf.name();
      if(name == Node.STYLESET) {
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
      else if(name == Node.MEDIA) {
        //如果之前list中有内容，说明是前面的styleset集合
        if(list.length) {
          regions.push({
            list: list,
            pre: '',
            suf: ''
          });
        }
        //@media作为单独的一个区域，有任意数目的styleset集合，单独存在一个list中
        //处理前后置空，和外部隔离开来
        list = [];
        var region = this.rbMedia(leaf);
        regions.push(region);
      }
      else {
        this.joinHead(leaf);
      }
    }
    //结束时要检查一下
    if(list.length) {
      regions.push({
        list: list,
        pre: '',
        suf: ''
      });
    }
    return regions;
  }
  rb(node, item, isSelector, isStyle, isKey, isValue) {
    var self = this;
    if(node.isToken()) {
      var token = node.token();
      if(!token.isVirtual()) {
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
  rbMedia(node) {
    var self = this;
    //@media前面部分，block为最后一个孩子
    var pre = { s: '' };
    var qs = node.leaves().slice(0, node.size() - 1);
    qs.forEach(function(node2) {
      self.joinQs(node2, pre);
    });
    //block的头尾是{}
    var block = node.last();
    self.joinQs(block.first(), pre);
    //block里全是styleset
    var list = [];
    var leaves = block.leaves();
    for(var i = 1, len = leaves.length; i < len - 1; i++) {
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
    //block尾部的}
    var suf = { s: '' };
    self.joinQs(block.last(), suf);
    return {
      pre: pre.s,
      list: list,
      suf: suf.s
    };
  }
  joinQs(node, pre) {
    var self = this;
    if(node.isToken()) {
      var token = node.token();
      if(!token.isVirtual()) {
        pre.s += token.content();
        while(self.ignores[++self.index]) {
          var ig = self.ignores[self.index];
          pre.s += ig.content();
        }
      }
    }
    else {
      node.leaves().forEach(function(leaf) {
        self.joinQs(leaf, pre);
      });
    }
  }
}
