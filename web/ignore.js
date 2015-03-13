define(function(require, exports, module){var homunculus=require('homunculus');

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var res;
var index;

function ignore(node, ignores, includeLine) {
  if(node instanceof Token) {
    if(node.isVirtual()) {
      return;
    }
    node.ignore = true;
    while(ignores[++index]) {
      var ig = ignores[index];
      var s = ig.content();
      if(ig.type() == Node.COMMENT && s.indexOf('//') == 0) {
        s = '/*' + s.slice(2) + '*/';
      }
      res += s;
      if(includeLine || s != '\n') {
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
  res = '';
  index = i;
  ignore(node, ignores, includeLine);
  return { res:res, index:index };
};});