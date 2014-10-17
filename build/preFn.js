var homunculus=require('homunculus');
var join=function(){var _24=require('./join');return _24.hasOwnProperty("join")?_24.join:_24.hasOwnProperty("default")?_24.default:_24}();
var ignore=function(){var _25=require('./ignore');return _25.hasOwnProperty("ignore")?_25.ignore:_25.hasOwnProperty("default")?_25.default:_25}();
var Fn=function(){var _26=require('./Fn');return _26.hasOwnProperty("Fn")?_26.Fn:_26.hasOwnProperty("default")?_26.default:_26}();

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