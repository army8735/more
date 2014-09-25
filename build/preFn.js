var homunculus=require('homunculus');
var join=function(){var _21=require('./join');return _21.hasOwnProperty("join")?_21.join:_21.hasOwnProperty("default")?_21.default:_21}();
var ignore=function(){var _22=require('./ignore');return _22.hasOwnProperty("ignore")?_22.ignore:_22.hasOwnProperty("default")?_22.default:_22}();
var Fn=function(){var _23=require('./Fn');return _23.hasOwnProperty("Fn")?_23.Fn:_23.hasOwnProperty("default")?_23.default:_23}();

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