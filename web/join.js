define(function(require, exports, module){var homunculus=require('homunculus');

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;
var str;

function recursion(node, ignore) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      str += token.content();
      while(ignore[++index]) {
        str += ignore[index].content();
      }
    }
  }
  else {
    node.leaves().forEach(function(leaf) {
      recursion(leaf, ignore);
    });
  }
}

exports.default=function(node, ignore, i) {
  str = '';
  index = i;
  recursion(node, ignore);
  return str;
}});