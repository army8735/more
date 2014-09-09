var homunculus=require('homunculus');
var join=function(){var _2=require('./join');return _2.hasOwnProperty("join")?_2.join:_2.hasOwnProperty("default")?_2.default:_2}()
var ignore=function(){var _3=require('./ignore');return _3.hasOwnProperty("ignore")?_3.ignore:_3.hasOwnProperty("default")?_3.default:_3}()

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, res) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(!isToken) {
    if(node.name() == Node.VARDECL) {
      index = ignore(node, ignores, index);
      var leaves = node.leaves();
      var k = leaves[0].leaves().content().slice(1);
      var v = join(leaves[2], ignores, index);
      res[k] = v;
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