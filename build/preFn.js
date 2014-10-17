var homunculus=require('homunculus');
var join=function(){var _26=require('./join');return _26.hasOwnProperty("join")?_26.join:_26.hasOwnProperty("default")?_26.default:_26}();
var ignore=function(){var _27=require('./ignore');return _27.hasOwnProperty("ignore")?_27.ignore:_27.hasOwnProperty("default")?_27.default:_27}();
var Fn=function(){var _28=require('./Fn');return _28.hasOwnProperty("Fn")?_28.Fn:_28.hasOwnProperty("default")?_28.default:_28}();

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

exports.default=function(node, ignores, i, fnHash) {
  index = i;
  recursion(node, ignores, fnHash);
}