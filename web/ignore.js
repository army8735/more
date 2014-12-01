define(function(require, exports, module){var homunculus=require('homunculus');

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var index;

function ignore(node, ignores, includeLine) {
  if(node instanceof Token) {
    node.ignore = true;
    while(ignores[++index]) {
      if(includeLine || ignores[index].content() != '\n') {
        ignores[index].ignore = true;
      }
    }
  }
  else if(node.name() == Node.TOKEN) {
    ignore(node.token(), ignores, includeLine);
  }
  else {
    node.leaves().forEach(function(leaf) {
      ignore(leaf, ignores, includeLine);
    });
  }
}

exports.default=function(node, ignores, i, includeLine) {
  index = i;
  ignore(node, ignores, includeLine);
  return index;
};});