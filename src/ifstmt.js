module homunculus from 'homunculus';

import join from './join';
import ignore from './ignore';
import exprstmt from './exprstmt';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

export default function(node, ignores, index, fnHash, globalFn, varHash, globalVar) {
  ignore(node, ignores, index);
  //保存索引
  var i = ignore(node.first(), ignores, index);
  i = ignore(node.leaf(1), ignores, i);
  i = ignore(node.leaf(2), ignores, i);
  i = ignore(node.leaf(3), ignores, i);
  var block = node.leaf(4);
  i = ignore(block.first(), ignores, i);
  //计算if的表达式
  var expr = node.leaf(2);
  var res = exprstmt(expr, fnHash, globalFn, varHash, globalVar);console.warn(res)
  if(res) {
    var s = '';
    for(var j = 1, len = block.size(); j < len - 1; j++) {
      s += '';
    }
  }
  return '';
};