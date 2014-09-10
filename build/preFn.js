var homunculus=require('homunculus');
var join=function(){var _180=require('./join');return _180.hasOwnProperty("join")?_180.join:_180.hasOwnProperty("default")?_180.default:_180}()
var ignore=function(){var _181=require('./ignore');return _181.hasOwnProperty("ignore")?_181.ignore:_181.hasOwnProperty("default")?_181.default:_181}()
var Fn=function(){var _182=require('./Fn');return _182.hasOwnProperty("Fn")?_182.Fn:_182.hasOwnProperty("default")?_182.default:_182}()

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, res) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(!isToken) {
    if(node.name() == Node.FN) {
      var leaves = node.leaves();
      var k = leaves[0].token().content();
      res[k] = new Fn(node, ignores, index);
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