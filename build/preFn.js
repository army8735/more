var homunculus=require('homunculus');
var join=function(){var _29=require('./join');return _29.hasOwnProperty("join")?_29.join:_29.hasOwnProperty("default")?_29.default:_29}();
var ignore=function(){var _30=require('./ignore');return _30.hasOwnProperty("ignore")?_30.ignore:_30.hasOwnProperty("default")?_30.default:_30}();
var Fn=function(){var _31=require('./Fn');return _31.hasOwnProperty("Fn")?_31.Fn:_31.hasOwnProperty("default")?_31.default:_31}();

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