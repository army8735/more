module homunculus from 'homunculus';
import join from './join';
import ignore from './ignore';
import Fn from './Fn';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

export default function(node, ignores, index, fnHash, globalFn, varHash, globalVar) {
  var name = node.first().token().content();
  var fn = fnHash[name] || globalFn[name];
  if(fn) {
    ignore(node, ignores, index);
    while(ignores[++index]){}
    while(ignores[++index]){}
    var res = fn.compile(node.leaf(1), ignores, index, varHash, globalVar).trim().replace(/;$/, '').replace(/\n/g, '');
    return res;
  }
  return '';
}
