define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var index;
var str;

function recursion(node, ignores, excludeLine) {
  if(node.isToken()) {
    var token = node.token();
    if(!token.isVirtual()) {
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
  return {
    str:str,
    index:index
  };
}});