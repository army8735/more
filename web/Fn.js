define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _1=require('./join');return _1.hasOwnProperty("join")?_1.join:_1.hasOwnProperty("default")?_1.default:_1}();
var ignore=function(){var _2=require('./ignore');return _2.hasOwnProperty("ignore")?_2.ignore:_2.hasOwnProperty("default")?_2.default:_2}();
var getVar=function(){var _3=require('./getVar');return _3.hasOwnProperty("getVar")?_3.getVar:_3.hasOwnProperty("default")?_3.default:_3}();
var clone=function(){var _4=require('./clone');return _4.hasOwnProperty("clone")?_4.clone:_4.hasOwnProperty("default")?_4.default:_4}();

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
      if(i % 2 == 0) {
        var idx = Math.floor(i / 2);
        var k = join(leaf, self.ignores);
        if(idx < self.params.length) {
          var v = self.params[idx];
          v = v.replace(/^\${?/, '').replace(/}$/, '');
          newVarHash[v] = k;
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