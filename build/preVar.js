var homunculus=require('homunculus');
var join=function(){var _34=require('./join');return _34.hasOwnProperty("join")?_34.join:_34.hasOwnProperty("default")?_34.default:_34}();
var ignore=function(){var _35=require('./ignore');return _35.hasOwnProperty("ignore")?_35.ignore:_35.hasOwnProperty("default")?_35.default:_35}();

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
}