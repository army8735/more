import homunculus from 'homunculus';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var res;
var index;
var append;

function ignore(node, ignores, includeLine) {
  if(node instanceof Token) {
    if(node.isVirtual()) {
      return;
    }
    node.ignore = true;
    append = '';
    while(ignores[++index]) {
      var ig = ignores[index];
      var s = ig.content();
      if(ig.type() == Token.COMMENT && s.indexOf('//') == 0) {
        s = '/*' + s.slice(2) + '*/';
      }
      res += s;
      append += s;
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

export default function(node, ignores, i, includeLine) {
  res = '';
  index = i;
  append = '';
  ignore(node, ignores, includeLine);
  return { res, index, append };
};