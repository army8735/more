define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _31=require('./join');return _31.hasOwnProperty("join")?_31.join:_31.hasOwnProperty("default")?_31.default:_31}();
var ignore=function(){var _32=require('./ignore');return _32.hasOwnProperty("ignore")?_32.ignore:_32.hasOwnProperty("default")?_32.default:_32}();
var Fn=function(){var _33=require('./Fn');return _33.hasOwnProperty("Fn")?_33.Fn:_33.hasOwnProperty("default")?_33.default:_33}();

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
}});