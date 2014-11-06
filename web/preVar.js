define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _36=require('./join');return _36.hasOwnProperty("join")?_36.join:_36.hasOwnProperty("default")?_36.default:_36}();
var ignore=function(){var _37=require('./ignore');return _37.hasOwnProperty("ignore")?_37.ignore:_37.hasOwnProperty("default")?_37.default:_37}();

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, res) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(!isToken) {
    if(node.name() == Node.VARDECL
      && ['$', '@'].indexOf(node.first().token().content().charAt(0)) > -1) {
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

exports.default=function(node, ignores, i, varHash) {
  index = i;
  recursion(node, ignores, varHash);
}});