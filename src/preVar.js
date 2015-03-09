module homunculus from 'homunculus';
import ignore from './ignore';
import calculate from './calculate';

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
      index = ignore(node.next(), ignores, index);
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

export default function(node, ignores, i, varHash, globalHash) {
  index = i;
  recursion(node, ignores, varHash, globalHash);
}