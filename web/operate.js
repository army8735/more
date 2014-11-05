define(function(require, exports, module){var homunculus=require('homunculus');
var getVar=function(){var _30=require('./getVar');return _30.hasOwnProperty("getVar")?_30.getVar:_30.hasOwnProperty("default")?_30.default:_30}();
var ignore=function(){var _31=require('./ignore');return _31.hasOwnProperty("ignore")?_31.ignore:_31.hasOwnProperty("default")?_31.default:_31}();

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;
var res;

exports.default=function(node, ignores, i, varHash, globalVar) {
  index = i;
  res = '';
  var operate = new Operate(node, ignores, index, varHash, globalVar);
  console.log(operate.exec());
  return res;
};


  function Operate(node, ignores, index, varHash, globalVar) {
    this.node = node;
    this.ignores = ignores;
    this.index = index;
    this.varHash = varHash;
    this.globalVar = globalVar;
    this.res = '';
  }
  Operate.prototype.exec = function(node) {
    if(node===void 0)node=this.node;var self = this;
    var isToken = node.name() == Node.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        var token = node.token();
        if(!token.ignore) {
          //
        }
      }
    }
    else {
      var leaves = node.leaves();
      leaves.forEach(function(leaf) {
        switch(leaf.name()) {
          case Node.ADDEXPR:
          case Node.MTPLEXPR:
          case Node.PRMREXPR:
            var operate = new Operate(self.node, self.ignores, self.index, self.varHash, self.globalVar);
            self.res += operate.exec();
            ignore(node);
            break;
        }
        self.exec(leaf);
      });
    }
    return self.res;
  }
});