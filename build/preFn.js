var homunculus=require('homunculus');
var join=function(){var _28=require('./join');return _28.hasOwnProperty("join")?_28.join:_28.hasOwnProperty("default")?_28.default:_28}();
var ignore=function(){var _29=require('./ignore');return _29.hasOwnProperty("ignore")?_29.ignore:_29.hasOwnProperty("default")?_29.default:_29}();
var Fn=function(){var _30=require('./Fn');return _30.hasOwnProperty("Fn")?_30.Fn:_30.hasOwnProperty("default")?_30.default:_30}();

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