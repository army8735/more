module homunculus from 'homunculus';
import ignore from './ignore';
import calculate from './calculate';
import exprstmt from './exprstmt';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, varHash, globalVar) {
  if(!node.isToken()) {
    if(node.name() == Node.VARDECL
      && ['$', '@'].indexOf(node.first().token().content().charAt(0)) > -1) {
      var i = index;
      while(ignores[++i]) {}
      while(ignores[++i]) {}
      var leaves = node.leaves();
      var k = leaves[0].token().content().slice(1);
      var v = leaves[2];
      switch(v.name()) {
        case Node.UNBOX:
          varHash[k] = {
            value: v.last().token().val(),
            unit: ''
          };
          break;
        case Node.ARRLTR:
          varHash[k] = {
            value: exprstmt(v, null, null, varHash, globalVar),
            unit: ''
          };
          break;
        default:
          varHash[k] = calculate(v, ignores, i, varHash, globalVar);
      }
      index = ignore(node, ignores, index).index;
      index = ignore(node.next(), ignores, index).index;
    }
    else {
      node.leaves().forEach(function(leaf) {
        recursion(leaf, ignores, varHash, globalVar);
      });
    }
  }
  else if(!node.token().isVirtual()) {
    while(ignores[++index]) {}
  }
}

export default function(node, ignores, i, varHash, globalVar) {
  index = i;
  recursion(node, ignores, varHash, globalVar);
}