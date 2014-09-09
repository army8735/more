module homunculus from 'homunculus';

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

var index;

function ignore(node, ignores) {
  if(node instanceof Token) {
    node.ignore = true;
    while(ignores[++index]) {
      if(ignores[index].content() != '\n') {
        ignores[index].ignore = true;
      }
    }
  }
  else if(node.name() == Node.TOKEN) {
    ignore(node.token(), ignores);
  }
  else {
    node.leaves().forEach(function(leaf) {
      ignore(leaf, ignores);
    });
  }
}

export default function(node, ignores, i) {
  index = i;
  ignore(node, ignores);
  return index;
};