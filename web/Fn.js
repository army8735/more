define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();
var join=function(){var _1=require('./join');return _1.hasOwnProperty("join")?_1.join:_1.hasOwnProperty("default")?_1.default:_1}();
var ignore=function(){var _2=require('./ignore');return _2.hasOwnProperty("ignore")?_2.ignore:_2.hasOwnProperty("default")?_2.default:_2}();
var getVar=function(){var _3=require('./getVar');return _3.hasOwnProperty("getVar")?_3.getVar:_3.hasOwnProperty("default")?_3.default:_3}();
var clone=function(){var _4=require('./clone');return _4.hasOwnProperty("clone")?_4.clone:_4.hasOwnProperty("default")?_4.default:_4}();
var calculate=function(){var _5=require('./calculate');return _5.hasOwnProperty("calculate")?_5.calculate:_5.hasOwnProperty("default")?_5.default:_5}();
var operate=function(){var _6=require('./operate');return _6.hasOwnProperty("operate")?_6.operate:_6.hasOwnProperty("default")?_6.default:_6}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');


  function Fn(node, ignores, index) {
    this.node = node;
    this.ignores = ignores;
    this.index = index;
    this.index2 = index;
    this.params = [];
    this.flag = false;
    this.autoSplit = false;
    this.res = '';
    this.preCompiler(node, ignores);
  }
  Fn.prototype.preCompiler = function(node, ignores) {
    var self = this;
    var ps = node.leaf(1).leaves();
    ps.slice(1, ps.length - 1).forEach(function(leaf, i) {
      if(i % 2 == 0) {
        self.params.push(leaf.token().content());
      }
    });
  }
  Fn.prototype.compile = function(cParams, ignores, index, varHash, globalHash) {
    var self = this;
    self.index2 = self.index;
    self.flag = false;
    this.autoSplit = false;
    self.res = '';
    var newVarHash = clone(varHash);
    var leaves = cParams.leaves();
    leaves.slice(1, leaves.length - 1).forEach(function(leaf, i) {
      if(i % 2 == 0) {
        var idx = Math.floor(i / 2);
        if(idx < self.params.length) {
          var k = self.params[idx];
          k = k.replace(/^[$@]\{?/, '').replace(/}$/, '');
          switch(leaf.name()) {
            case Node.UNBOX:
              newVarHash[k] = {
                value: leaf.last().token().val(),
                unit: ''
              };
              break;
            default:
              newVarHash[k] = calculate(leaf, ignores, index, varHash, globalHash);
              break;
          }
        }
      }
      index = ignore(leaf, ignores, index).index;
    });
    self.recursion(self.node, ignores, newVarHash, globalHash);
    return self.res.replace(/^{/, '').replace(/}$/, '');
  }
  Fn.prototype.recursion = function(node, ignores, newVarHash, globalHash) {
    var self = this;
    if(node.isToken()) {
      var token = node.token();
      if(!token.isVirtual()) {
        if(self.flag) {
          if(token.content() == '~' && token.type() != Token.HACK) {
            self.autoSplit = true;
          }
          else {
            var s = getVar(token, newVarHash, globalHash);
            if(self.autoSplit && token.type() == Token.STRING) {
              var c = s.charAt(0);
              if(c != "'" && c != '"') {
                c = '"';
                s = c + s + c;
              }
              s = s.replace(/,\s*/g, c + ',' + c);
            }
            self.res += s;
            self.autoSplit = false;
          }
        }
        while(self.ignores[++self.index2]) {
          var s = self.ignores[self.index2].content();
          if(self.flag && s != '\n') {
            self.res += s;
          }
        }
      }
    }
    else {
      switch(node.name()) {
        case Node.BLOCK:
          self.flag = true;
          break;
        case Node.ADDEXPR:
        case Node.MTPLEXPR:
        case Node.PRMREXPR:
          var parent = node.parent();
          if(parent.name() != Node.CALC && parent.parent().name() != Node.EXPR) {
            var opt = operate(node, newVarHash, globalHash);
            self.res += opt.value + opt.unit;
            self.index2 = ignore(node, ignores, self.index2).index;
            return;
          }
          break;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf, ignores, newVarHash, globalHash);
      });
    }
  }


exports.default=Fn;});