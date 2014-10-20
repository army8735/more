define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _33=require('./join');return _33.hasOwnProperty("join")?_33.join:_33.hasOwnProperty("default")?_33.default:_33}();
var ignore=function(){var _34=require('./ignore');return _34.hasOwnProperty("ignore")?_34.ignore:_34.hasOwnProperty("default")?_34.default:_34}();

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, res) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(!isToken) {
    if(node.name() == Node.VARDECL) {
      var i = index;
      while(ignores[++i]) {}
      while(ignores[++i]) {}
      var leaves = node.leaves();
      var k = leaves[0].token().content().slice(1);
      var v = join(leaves[2], ignores, i);
      res[k] = v;
      index = ignore(node, ignores, index);
    }
    else {
      node.leaves().forEach(function(leaf) {
        recursion(leaf, ignores, res);
      });
    }
  }
  else if(!isVirtual) {
    while(ignores[++index]) {}
  }
}

exports.default=function(node, ignores, i, varHash) {
  index = i;
  recursion(node, ignores, varHash);
}});