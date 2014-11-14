define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _0=require('./join');return _0.hasOwnProperty("join")?_0.join:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();
var getVar=function(){var _2=require('./getVar');return _2.hasOwnProperty("getVar")?_2.getVar:_2.hasOwnProperty("default")?_2.default:_2}();
var clone=function(){var _3=require('./clone');return _3.hasOwnProperty("clone")?_3.clone:_3.hasOwnProperty("default")?_3.default:_3}();
var calculate=function(){var _4=require('./calculate');return _4.hasOwnProperty("calculate")?_4.calculate:_4.hasOwnProperty("default")?_4.default:_4}();
var operate=function(){var _5=require('./operate');return _5.hasOwnProperty("operate")?_5.operate:_5.hasOwnProperty("default")?_5.default:_5}();

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');


  function Fn(node, ignores, index) {
    this.node = node;
    this.ignores = ignores;
    this.index = index;
    this.index2 = index;
    this.params = [];
    this.flag = false;
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
    self.res = '';
    var newVarHash = clone(varHash);
    var leaves = cParams.leaves();
    leaves.slice(1, leaves.length - 1).forEach(function(leaf, i) {
      if(i % 2 == 0) {
        var idx = Math.floor(i / 2);
        if(idx < self.params.length) {
          var k = self.params[idx];
          k = k.replace(/^[$@]\{?/, '').replace(/}$/, '');
          newVarHash[k] = calculate(leaf, ignores, index, varHash, globalHash);
        }
      }
      index = ignore(leaf, ignores, index);
    });
    self.recursion(self.node, ignores, newVarHash, globalHash);
    return self.res.replace(/^{/, '').replace(/}$/, '');
  }
  Fn.prototype.recursion = function(node, ignores, newVarHash, globalHash) {
    var self = this;
    var isToken = node.name() == Node.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        if(self.flag) {
          var token = node.token();
          self.res += getVar(token, newVarHash, globalHash);
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
            self.index2 = ignore(node, ignores, self.index2);
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