define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _0=require('./join');return _0.hasOwnProperty("join")?_0.join:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();
var getVar=function(){var _2=require('./getVar');return _2.hasOwnProperty("getVar")?_2.getVar:_2.hasOwnProperty("default")?_2.default:_2}();
var clone=function(){var _3=require('./clone');return _3.hasOwnProperty("clone")?_3.clone:_3.hasOwnProperty("default")?_3.default:_3}();
var varType=require('./varType');

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');


  function Fn(node, ignores, index) {
    this.node = node;
    this.ignores = ignores;
    this.index = index;
    this.params = [];
    this.flag = false;
    this.res = '';
    this.preCompiler(node, ignores, index);
  }
  Fn.prototype.preCompiler = function(node, ignores, index) {
    var self = this;
    var ps = node.leaf(1).leaves();
    ps.slice(1, ps.length - 1).forEach(function(leaf, i) {
      if(i % 2 == 0) {
        self.params.push(leaf.token().content());
      }
    });
  }
  Fn.prototype.compile = function(cParams, varHash, globalVar) {
    var self = this;
    var newVarHash = clone(varHash);
    var leaves = cParams.leaves();
    leaves.slice(1, leaves.length - 1).forEach(function(leaf, i) {
      var value;var unit;var type;if(i % 2 == 0) {
        var idx = Math.floor(i / 2);
        if(idx < self.params.length) {
          var k = self.params[idx];
          k = k.replace(/^\$\{?/, '').replace(/}$/, '');
          var v = join(leaf, self.ignores);
          !function(){var _4= varType.getType(leaf, v);type=_4["type"];unit=_4["unit"];value=_4["value"]}();
          newVarHash[k] = {
            type: type,
            unit: unit,
            str: v,
            value: value
          };
        }
      }
    });
    self.recursion(self.node, newVarHash, globalVar);
    return self.res.replace(/^{/, '').replace(/}$/, '');
  }
  Fn.prototype.recursion = function(node, newVarHash, globalVar) {
    var self = this;
    var isToken = node.name() == Node.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        if(self.flag) {
          var token = node.token();
          self.res += getVar(token, newVarHash, globalVar);
        }
        while(self.ignores[++self.index]) {
          var s = self.ignores[self.index].content();
          if(self.flag && s != '\n') {
            self.res += s;
          }
        }
      }
    }
    else {
      if(node.name() == Node.BLOCK) {
        self.flag = true;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf, newVarHash, globalVar);
      });
    }
  }


exports.default=Fn;});