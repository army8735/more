module homunculus from 'homunculus';

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignore, res) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      res.s += token.content();
      while(ignore[++index]) {
        res.s += ignore[index].content();
      }
    }
  }
  else {
    node.leaves().forEach(function(leaf) {
      recursion(leaf, ignore, res);
    });
  }
}

export default function(node, ignore, i) {
  var res = { s: '' };
  index = i;
  recursion(node, ignore, res);
  return res.s;
}