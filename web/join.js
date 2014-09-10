define(function(require, exports, module){var homunculus=require('homunculus');

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;
var str;

function recursion(node, ignores, excludeLine) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      str += token.content();
      while(ignores[++index]) {
        var s = ignores[index].content();
        if(!excludeLine || s != '\n') {
          str += s;
        }
      }
    }
  }
  else {
    node.leaves().forEach(function(leaf) {
      recursion(leaf, ignores, excludeLine);
    });
  }
}

exports.default=function(node, ignores, i, excludeLine) {
  str = '';
  index = i;
  recursion(node, ignores, excludeLine);
  return str;
}});