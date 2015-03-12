module homunculus from 'homunculus';

import join from './join';
import ignore from './ignore';
import getVar from './getVar';
import getFn from './getFn';
import checkLevel from './checkLevel';
import concatSelector from './concatSelector';
import normalize from './normalize';
import operate from './operate';
import ifstmt from './ifstmt';
import forstmt from './forstmt';
import eventbus from './eventbus';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

class Tree {
  constructor(ignores, index, varHash, globalVar, fnHash, globalFn, styleHash, styleTemp, selectorStack, map, focus) {
    this.ignores = ignores;
    this.index = index;
    this.varHash = varHash;
    this.globalVar = globalVar;
    this.fnHash = fnHash;
    this.globalFn = globalFn;
    this.styleHash = styleHash;
    this.styleTemp = styleTemp;
    this.selectorStack = selectorStack;
    this.map = map;
    this.focus = focus;

    this.res = '';
    this.autoSplit = false;
  }
  join(node) {
    var self = this;
    if(node.isToken()) {
      var token = node.token();
      if(!token.isVirtual()) {
        eventbus.emit(node.nid());
        //标识下一个string是否自动拆分
        if(token.content() == '~' && token.type() != Token.HACK) {
          self.autoSplit = true;
          ignore(token, self.ignores, self.index);
        }
        else if(token.type() != Token.STRING) {
          self.autoSplit = false;
        }
        if(!token.ignore || self.focus) {
          //~String拆分语法
          if(self.autoSplit && token.type() == Token.STRING) {
            var s = getVar(token, self.varHash, self.globalVar);
            var c = s.charAt(0);
            if(c != "'" && c != '"') {
              c = '"';
              s = c + s + c;
            }
            s = s.replace(/,\s*/g, c + ',' + c);
            self.res += s;
            self.autoSplit = false;
          }
          else {
            var str = getVar(token, self.varHash, self.globalVar);
            //map映射url
            if(token.import && self.map) {
              var quote = /^['"']/.test(str) ? str.charAt(0) : '';
              var val = quote ? str.slice(1, str.length - 1) : str;
              //映射类型可能是回调
              if(typeof self.map == 'function') {
                str = self.map(val);
                //如有引号，需处理转义
                if(quote) {
                  str = quote + str + quote;
                }
              }
              else if(self.map.hasOwnProperty(token.val())){
                str = self.map[val];
                if(quote) {
                  str = quote + str + quote;
                }
              }
            }
            //有@import url(xxx.css?xxx)的写法，需忽略
            if(token.import && str.indexOf('.css?') == -1) {
              //非.xxx结尾加上.css，非.css结尾替换掉.xxx为.css
              if(!/\.\w+['"]?$/.test(str)) {
                str = str.replace(/(['"]?)$/, '.css$1');
              }
              else if(!/\.css+['"]?$/.test(str)) {
                str = str.replace(/\.\w+(['"]?)$/, '.css$1');
              }
            }
            self.res += str;
          }
        }
        while(self.ignores[++self.index]) {
          var ig = self.ignores[self.index];
          var s = ig.type() == Token.ignores ? ig.content().replace(/\S/g, ' ') : ig.content();
          if(ig.type() == Token.COMMENT && s.indexOf('//') == 0) {
            s = '/*' + s.slice(2) + '*/';
          }
          if(!ig.ignore || self.focus) {
            self.res += s;
          }
        }
      }
    }
    else {
      eventbus.emit(node.nid(), true);
      switch(node.name()) {
        case Node.STYLESET:
          self.styleset(true, node);
          break;
        case Node.BLOCK:
          self.block(node);
          break;
        case Node.FNC:
          self.res += getFn(node, self.ignores, self.index, self.fnHash, self.globalFn, self.varHash, self.globalVar);
          break;
        case Node.EXTEND:
          self.extend(node);
          break;
        case Node.IMPORT:
          self.impt(node);
          break;
        case Node.ADDEXPR:
        case Node.MTPLEXPR:
        case Node.PRMREXPR:
          var parent = node.parent();
          if([Node.CALC, Node.ADDEXPR, Node.MTPLEXPR, Node.PRMREXPR].indexOf(parent.name()) == -1
            && [Node.VARDECL, Node.CPARAMS].indexOf(parent.parent().name()) == -1
            && !inFn(parent)
            && parent.parent().name() != Node.EXPR) {
            var opt = operate(node, self.varHash, self.vars);
            self.res += opt.value + opt.unit;
            ignore(node, self.ignores, self.index);
          }
          break;
        case Node.IFSTMT:
          var temp = ifstmt(
            node,
            self.ignores,
            self.index,
            self.varHash,
            self.globalVar,
            self.fnHash,
            self.globalFn,
            self.styleHash,
            self.styleTemp,
            self.selectorStack,
            self.map
          );
          self.res += temp.res;
          self.index = temp.index;
          break;
        case Node.FORSTMT:
          var temp = forstmt(node, self.ignores, self.index, self.fnHash, self.globalFn, self.varHash, self.globalVar);
          self.res += temp.res;
          self.index = temp.index;
          break;
      }
      //递归子节点，if和for忽略
      if([Node.IFSTMT, Node.FORSTMT].indexOf(node.name()) == -1) {
        var leaves = node.leaves();
        leaves.forEach(function(leaf) {
          self.join(leaf);
        });
      }
      eventbus.emit(node.nid(), false);
      switch(node.name()) {
        case Node.STYLESET:
          self.styleset(false, node);
          break;
      }
    }
    return { res: self.res, index: self.index };
  }
  styleset(start, node) {
    var self = this;
    if(start) {
      var block = node.leaf(1);
      block.hasLevel = checkLevel(block);
      //忽略掉所有二级以上选择器，由block之前生成
      if(block.hasLevel || self.selectorStack.length) {
        ignore(node.first(), self.ignores, self.index);
      }
      //二级以上选择器样式集需先结束
      if(this.selectorStack.length) {
        var prev = node.prev();
        //前一个是styleset或者{时，会造成空样式
        if(prev.name() == Node.STYLESET
          || prev.name() == Node.TOKEN
          && prev.token().content() == '{') {
          //
        }
        else {
          var s = concatSelector(self.selectorStack);
          normalize(s).split(',').forEach(function(se) {
            self.saveStyle(se, self.res.slice(self.styleTemp, self.res.length));
          });
          self.res += '}';
        }
      }
      //存储当前层级父选择器集合
      var s = join(node.first(), self.ignores, self.index, true).str;
      self.selectorStack.push(s.split(','));
    }
    else {
      if(node.last().last().prev().name() != Node.STYLESET) {
        var s = concatSelector(self.selectorStack);
        var temp = self.res.lastIndexOf('}');
        normalize(s).split(',').forEach(function(se) {
          self.saveStyle(se, self.res.slice(self.styleTemp, temp));
        });
      }
      self.selectorStack.pop();
      if(self.selectorStack.length) {
        var s = concatSelector(self.selectorStack);
        var next = node.next();
        //当多级styleset结束时下个是styleset或}，会造成空白样式
        if(next && (next.name() == Node.STYLESET
          || next.name() == Node.TOKEN
          && next.token().content() == '}')) {
          //
        }
        else {
          self.res += s + '{';
          normalize(s).split(',').forEach(function(se) {
            self.styleTemp = self.res.length;
          });
        }
      }
    }
  }
  block(node) {
    var self = this;
    var last = node.last();
    var prev = last.prev();
    //当多级block的最后一个是styleset或}，会造成空白样式
    if(prev.name() == Node.STYLESET && node.parent().name() == Node.STYLESET) {
      eventbus.on(last.nid(), function() {
        ignore(last, self.ignores, self.index);
      });
    }
    var s = concatSelector(this.selectorStack);
    var first = node.leaf(1);
    if(first.name() == Node.STYLESET && node.parent().name() == Node.STYLESET) {
      eventbus.on(first.prev().nid(), function() {
        ignore(first.prev(), self.ignores, self.index);
      });
    }
    else {
      if(node.hasLevel || this.selectorStack.length > 1) {
        self.res += s;
      }
      normalize(s).split(',').forEach(function(se) {
        self.styleTemp = self.res.length + 1;
      });
    }
  }
  extend(node) {
    var self = this;
    ignore(node, self.ignores, self.index);
    var i = self.index;
    while(self.ignores[++i]) {}
    var s = normalize(join(node.leaf(1), self.ignores, i).str);
    var targets = s.split(',');
    targets.forEach(function(se) {
      self.res += self.styleHash[se] || '';
    });
    var se = normalize(concatSelector(self.selectorStack));
    se = se.split(',');
    eventbus.on(node.parent().nid(), function(start) {
      if(!start) {
        var styleArray = Object.keys(self.styleHash);
        targets.forEach(function(se1) {
          styleArray.forEach(function(se2) {
            if(se2.indexOf(se1) == 0
              && se2.length != se1.length
                //确保伪类或孩子元素，防止@extend .test会继承.test1之类
              && !/[\w-]/.test(se2.charAt(se1.length))
              && se1.indexOf(se2) == -1) {
              var pseudo = concatSelector([se].concat([[se2.slice(se1.length)]]));
              pseudo = normalize(pseudo);
              if(self.styleHash[se2]) {
                self.res += pseudo + '{' + self.styleHash[se2] + '}';
                self.styleHash[pseudo] = self.styleHash[pseudo] || '';
                self.styleHash[pseudo] += self.styleHash[se2];
              }
            }
          });
        });
      }
    });
  }
  saveStyle(k, v) {
    this.styleHash[k] = this.styleHash[k] || '';
    v = v.trim();
    if(v.length && v.charAt(v.length - 1) != ';') {
      v += ';';
    }
    this.styleHash[k] += v;
  }
  impt(node) {
    var url = node.leaf(1);
    if(url.size() == 1) {
      url.first().token().import = true;
    }
    else {
      url.leaf(2).token().import = true;
    }
  }
}

export default Tree;

function inFn(node) {
  while(node = node.parent()) {
    if(node.name() == Node.FN) {
      return true;
    }
  }
  return false;
}