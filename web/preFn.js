define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _10=require('./join');return _10.hasOwnProperty("join")?_10.join:_10.hasOwnProperty("default")?_10.default:_10}()
var ignore=function(){var _11=require('./ignore');return _11.hasOwnProperty("ignore")?_11.ignore:_11.hasOwnProperty("default")?_11.default:_11}()

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, res) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(!isToken) {
    if(node.name() == Node.FN) {
      var i = index;
      var leaves = node.leaves();
      var k = leaves[0].leaves().content().slice(1);
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
}});