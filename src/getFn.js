import homunculus from 'homunculus';
import join from './join';
import ignore from './ignore';
import Fn from './Fn';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

export default function(node, ignores, index, fnHash, globalFn, varHash, globalVar) {
  var name = node.first().token().content();
  var fn = fnHash[name] || globalFn[name];
  if(fn) {
    var i = index;
    while(ignores[++i]){}
    while(ignores[++i]){}
    var res = fn.compile(node.leaf(1), i, varHash, globalVar).trim().replace(/[\r\n]/g, '');
    return res;
  }
  return join(node, ignores, index).str;
}
