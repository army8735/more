define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();

var join=function(){var _1=require('./join');return _1.hasOwnProperty("join")?_1.join:_1.hasOwnProperty("default")?_1.default:_1}();
var ignore=function(){var _2=require('./ignore');return _2.hasOwnProperty("ignore")?_2.ignore:_2.hasOwnProperty("default")?_2.default:_2}();
var getVar=function(){var _3=require('./getVar');return _3.hasOwnProperty("getVar")?_3.getVar:_3.hasOwnProperty("default")?_3.default:_3}();
var getFn=function(){var _4=require('./getFn');return _4.hasOwnProperty("getFn")?_4.getFn:_4.hasOwnProperty("default")?_4.default:_4}();
var checkLevel=function(){var _5=require('./checkLevel');return _5.hasOwnProperty("checkLevel")?_5.checkLevel:_5.hasOwnProperty("default")?_5.default:_5}();
var concatSelector=function(){var _6=require('./concatSelector');return _6.hasOwnProperty("concatSelector")?_6.concatSelector:_6.hasOwnProperty("default")?_6.default:_6}();
var normalize=function(){var _7=require('./normalize');return _7.hasOwnProperty("normalize")?_7.normalize:_7.hasOwnProperty("default")?_7.default:_7}();
var operate=function(){var _8=require('./operate');return _8.hasOwnProperty("operate")?_8.operate:_8.hasOwnProperty("default")?_8.default:_8}();
var ifstmt=function(){var _9=require('./ifstmt');return _9.hasOwnProperty("ifstmt")?_9.ifstmt:_9.hasOwnProperty("default")?_9.default:_9}();
var forstmt=function(){var _10=require('./forstmt');return _10.hasOwnProperty("forstmt")?_10.forstmt:_10.hasOwnProperty("default")?_10.default:_10}();
var eventbus=function(){var _11=require('./eventbus');return _11.hasOwnProperty("eventbus")?_11.eventbus:_11.hasOwnProperty("default")?_11.default:_11}();
var preVar=function(){var _12=require('./preVar');return _12.hasOwnProperty("preVar")?_12.preVar:_12.hasOwnProperty("default")?_12.default:_12}();
var exprstmt=function(){var _13=require('./exprstmt');return _13.hasOwnProperty("exprstmt")?_13.exprstmt:_13.hasOwnProperty("default")?_13.default:_13}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var IGNORE = {};
IGNORE[Node.IFSTMT]
  = IGNORE[Node.FORSTMT]
  = IGNORE[Node.BASENAME]
  = IGNORE[Node.EXTNAME]
  = IGNORE[Node.WIDTH]
  = IGNORE[Node.HEIGHT]
  = IGNORE[Node.ADDEXPR]
  = IGNORE[Node.MTPLEXPR]
  = IGNORE[Node.PRMREXPR]
  = IGNORE[Node.FN]
  = IGNORE[Node.VARSTMT]
  = IGNORE[Node.UNBOX]
  = IGNORE[Node.FNC]
  = true;


  function Tree(ignores, index, varHash, globalVar, fnHash, globalFn, styleHash, styleTemp, selectorStack, map, focus, first, file) {
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
    this.first = first;
    this.file = file;

    this.res = '';
  }
  Tree.prototype.join = function(node) {
    var self = this;
    if(node.isToken()) {
      var token = node.token();
      if(token.isVirtual()) {
        return;
      }
      eventbus.emit(node.nid());
      if(!token.ignore || self.focus) {
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
          self.res += getFn(node, self.ignores, self.index, self.fnHash, self.globalFn, self.varHash, self.globalVar, self.first);
          var temp = ignore(node, self.ignores, self.index, true);
          self.res += temp.res.replace(/[^\n]/g, '');
          self.res += temp.append.replace(/\n/g, '');
          self.index = temp.index;
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
          var opr = operate(node, self.varHash, self.globalVar, self.file);
          self.res += opr.value + opr.unit;
          var temp = ignore(node, self.ignores, self.index, true);
          self.res += temp.res.replace(/[^\n]/g, '');
          self.res += temp.append.replace(/\n/g, '');
          self.index = temp.index;
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
            self.map,
            self.first,
            self.file
          );
          self.res += temp.res;
          self.index = temp.index;
          break;
        case Node.FORSTMT:
          var temp = forstmt(
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
            self.map,
            self.first,
            self.file
          );
          self.res += temp.res;
          self.index = temp.index;
          break;
        case Node.VARSTMT:
          node.leaves().forEach(function(decl, i) {
            //在if/for语句中会强制，外部var声明已在初期前置
            if(self.focus) {
              if(i % 2 == 0) {
                if(['$', '@'].indexOf(node.first().first().token().content().charAt(0)) > -1) {
                  preVar(decl, self.ignores, self.index, self.varHash, self.globalVar, self.file, self.focus);
                  var temp = ignore(node, self.ignores, self.index, true);
                  self.res += temp.res;
                  self.index = temp.index;
                }
                else {
                  var temp = join(decl, self.ignores, self.index);
                  self.res += temp.str;
                  self.index = temp.index;
                }
              }
              //vardecl后的,或;
              else {
                var temp = ignore(node, self.ignores, self.index, true);
                self.res += temp.res.replace(/[^\n]/g, '');
                self.index = temp.index;
              }
            }
            //要忽略css3本身的var声明
            else {
              if(['$', '@'].indexOf(node.first().first().token().content().charAt(0)) > -1) {
                var temp = ignore(decl, self.ignores, self.index, true);
                self.res += temp.res.replace(/[^\n]/g, '');
                self.index = temp.index;
              }
              else {
                var temp = join(decl, self.ignores, self.index);
                self.res += temp.str;
                self.index = temp.index;
              }
            }
          });
          break;
        case Node.BASENAME:
        case Node.EXTNAME:
        case Node.WIDTH:
        case Node.HEIGHT:
          self.res += exprstmt(node, self.varHash, self.globalVar, self.file);
          var temp = ignore(node, self.ignores, self.index, true);
          self.res += temp.res.replace(/[^\n]/g, '');
          self.index = temp.index;
          break;
        case Node.FN:
          var temp = ignore(node, self.ignores, self.index, true);
          self.res += temp.res.replace(/[^\n]/g, '');
          self.index = temp.index;
          break;
        case Node.UNBOX:
          var s = getVar(node.last().token(), self.varHash, self.globalVar);
          var c = s.charAt(0);
          if(c != "'" && c != '"') {
            c = '"';
            s = c + s + c;
          }
          s = s.replace(/,\s*/g, c + ',' + c);
          self.res += s;
          var temp = ignore(node, self.ignores, self.index, true);
          self.res += temp.res;
          self.index = temp.index;
          break;
      }
      //递归子节点，if和for忽略
      if(!IGNORE.hasOwnProperty(node.name())) {
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
  Tree.prototype.styleset = function(start, node) {
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
  Tree.prototype.block = function(node) {
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
  Tree.prototype.extend = function(node) {
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
  Tree.prototype.saveStyle = function(k, v) {
    this.styleHash[k] = this.styleHash[k] || '';
    v = v.trim();
    if(v.length && v.charAt(v.length - 1) != ';') {
      v += ';';
    }
    this.styleHash[k] += v;
  }
  Tree.prototype.impt = function(node) {
    var url = node.leaf(1);
    if(url.size() == 1) {
      url.first().token().import = true;
    }
    else {
      url.leaf(2).token().import = true;
    }
  }


exports.default=Tree;

function inFn(node) {
  while(node = node.parent()) {
    if(node.name() == Node.FN) {
      return true;
    }
  }
  return false;
}});