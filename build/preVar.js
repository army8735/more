var homunculus=require('homunculus');
var join=function(){var _16=require('./join');return _16.hasOwnProperty("join")?_16.join:_16.hasOwnProperty("default")?_16.default:_16}()
var ignore=function(){var _17=require('./ignore');return _17.hasOwnProperty("ignore")?_17.ignore:_17.hasOwnProperty("default")?_17.default:_17}()

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

exports.default=function(node, ignores, i) {
  var res = {};
  index = i;
  recursion(node, ignores, res);
  return res;
}