define(function(require, exports, module){var homunculus=require('homunculus');
var ignore=function(){var _0=require('./ignore');return _0.hasOwnProperty("ignore")?_0.ignore:_0.hasOwnProperty("default")?_0.default:_0}();
var calculate=function(){var _1=require('./calculate');return _1.hasOwnProperty("calculate")?_1.calculate:_1.hasOwnProperty("default")?_1.default:_1}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, varHash, globalHash) {
  if(!node.isToken()) {
    if(node.name() == Node.VARDECL
      && ['$', '@'].indexOf(node.first().token().content().charAt(0)) > -1) {
      var i = index;
      while(ignores[++i]) {}
      while(ignores[++i]) {}
      var leaves = node.leaves();
      var k = leaves[0].token().content().slice(1);
      varHash[k] = calculate(leaves[2], ignores, i, varHash, globalHash);
      index = ignore(node, ignores, index);
    }
    else {
      node.leaves().forEach(function(leaf) {
        recursion(leaf, ignores, varHash, globalHash);
      });
    }
  }
  else if(!node.token().isVirtual()) {
    while(ignores[++index]) {}
  }
}

exports.default=function(node, ignores, i, varHash, globalHash) {
  index = i;
  recursion(node, ignores, varHash, globalHash);
}});