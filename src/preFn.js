module homunculus from 'homunculus';
import join from './join';
import ignore from './ignore';
import Fn from './Fn';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, res) {
  if(!node.isToken()) {
    if(node.name() == Node.FN) {
      var leaves = node.leaves();
      var k = leaves[0].token().content();
      res[k] = new Fn(node, ignores, index);
      index = ignore(node, ignores, index);
    }
    else {
      node.leaves().forEach(function(leaf) {
        recursion(leaf, ignores, res);
      });
    }
  }
  else if(!node.token().isVirtual()) {
    while(ignores[++index]) {}
  }
}

export default function(node, ignores, i, fnHash) {
  index = i;
  recursion(node, ignores, fnHash);
}