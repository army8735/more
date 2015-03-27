define(function(require, exports, module){var homunculus=require('homunculus');

var join=function(){var _0=require('./join');return _0.hasOwnProperty("join")?_0.join:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();
var getVar=function(){var _2=require('./getVar');return _2.hasOwnProperty("getVar")?_2.getVar:_2.hasOwnProperty("default")?_2.default:_2}();
var getFn=function(){var _3=require('./getFn');return _3.hasOwnProperty("getFn")?_3.getFn:_3.hasOwnProperty("default")?_3.default:_3}();
var checkLevel=function(){var _4=require('./checkLevel');return _4.hasOwnProperty("checkLevel")?_4.checkLevel:_4.hasOwnProperty("default")?_4.default:_4}();
var concatSelector=function(){var _5=require('./concatSelector');return _5.hasOwnProperty("concatSelector")?_5.concatSelector:_5.hasOwnProperty("default")?_5.default:_5}();
var normalize=function(){var _6=require('./normalize');return _6.hasOwnProperty("normalize")?_6.normalize:_6.hasOwnProperty("default")?_6.default:_6}();
var operate=function(){var _7=require('./operate');return _7.hasOwnProperty("operate")?_7.operate:_7.hasOwnProperty("default")?_7.default:_7}();
var ifstmt=function(){var _8=require('./ifstmt');return _8.hasOwnProperty("ifstmt")?_8.ifstmt:_8.hasOwnProperty("default")?_8.default:_8}();
var forstmt=function(){var _9=require('./forstmt');return _9.hasOwnProperty("forstmt")?_9.forstmt:_9.hasOwnProperty("default")?_9.default:_9}();
var eventbus=function(){var _10=require('./eventbus');return _10.hasOwnProperty("eventbus")?_10.eventbus:_10.hasOwnProperty("default")?_10.default:_10}();
var preVar=function(){var _11=require('./preVar');return _11.hasOwnProperty("preVar")?_11.preVar:_11.hasOwnProperty("default")?_11.default:_11}();
var exprstmt=function(){var _12=require('./exprstmt');return _12.hasOwnProperty("exprstmt")?_12.exprstmt:_12.hasOwnProperty("default")?_12.default:_12}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');


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
    this.autoSplit = false;
    this.inVar = false;
    this.inOpt = false;
  }
  Tree.prototype.join = function(node) {
    var self = this;
    if(node.isToken()) {
      var token = node.token();
      if(token.isVirtual()) {
        return;
      }
      eventbus.emit(node.nid());
      //标识下一个string是否自动拆分
      if(token.content() == '~' && token.type() != Token.HACK) {
        self.autoSplit = true;
        ignore(token, self.ignores, self.index);
      }
      else if(token.type() != Token.STRING) {
        self.autoSplit = false;
      }
      if(!self.inOpt && (!token.ignore
        || self.focus
          && !self.inVar)) {
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
            var opt = operate(node, self.varHash, self.globalVar, self.file);
            self.res += opt.value + opt.unit;
            ignore(node, self.ignores, self.index);
            self.inOpt = true;
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
        case Node.VARDECL:
          //在if/for语句中会强制，外部var声明已在初期前置
          if(self.focus) {
            preVar(node, self.ignores, self.index, self.varHash, self.globalVar, self.file, self.focus);
          }
          //要忽略css3本身的var声明
          else if(['$', '@'].indexOf(node.first().token().content().charAt(0)) > -1){
            ignore(node, self.ignores, self.index);
          }
          break;
        case Node.VARSTMT:
          self.inVar = true;
          break;
        case Node.BASENAME:
        case Node.EXTNAME:
        case Node.WIDTH:
        case Node.HEIGHT:
          if(!self.inVar && !self.inOpt) {
            self.res += exprstmt(node, self.varHash, self.globalVar, self.file);
          }
          var temp = ignore(node, self.ignores, self.index, true);
          self.res += temp.res.replace(/[^\n]/g, '');
          self.index = temp.index;
          break;
      }
      //递归子节点，if和for忽略
      if([Node.IFSTMT, Node.FORSTMT, Node.BASENAME, Node.EXTNAME, Node.WIDTH, Node.HEIGHT].indexOf(node.name()) == -1) {
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
        case Node.VARSTMT:
          self.inVar = false;
          break;
        case Node.ADDEXPR:
        case Node.MTPLEXPR:
        case Node.PRMREXPR:
          var parent = node.parent();
          if([Node.CALC, Node.ADDEXPR, Node.MTPLEXPR, Node.PRMREXPR].indexOf(parent.name()) == -1
            && [Node.VARDECL, Node.CPARAMS].indexOf(parent.parent().name()) == -1
            && !inFn(parent)
            && parent.parent().name() != Node.EXPR) {
            self.inOpt = false;
          }
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