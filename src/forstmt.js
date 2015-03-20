module homunculus from 'homunculus';

import join from './join';
import ignore from './ignore';
import exprstmt from './exprstmt';
import Tree from './Tree';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

export default function forstmt(node, ignores, index, varHash, globalVar, fnHash, globalFn, styleHash, styleTemp, selectorStack, map) {
  //循环引用fix
  if(Tree.hasOwnProperty('default')) {
    Tree = Tree.default;
  }
  //忽略掉整个for节点
  ignore(node, ignores, index);
  var temp = node.leaf(3);
  var isIn = temp.isToken() && temp.content() == 'in';
  var isOf = !isIn && temp.isToken() && temp.content() == 'of';
  var s;
  var block;
  var res;
  if(isIn) {
    //
  }
  else if(isOf) {
    //
  }
  else {
    //保存索引，存储空白符
    var temp = ignore(node.first(), ignores, index);
    s = temp.res;
    index = temp.index;
    temp = ignore(node.leaf(1), ignores, index);
    s += temp.res;
    index = temp.index;
    //执行for的3个语句，判断是否循环用最后一个
    exprstmt(node.leaf(2), ignores, fnHash, globalFn, varHash, globalVar);
    temp = ignore(node.leaf(2), ignores, index);
    s += temp.res;
    index = temp.index;
    res = exprstmt(node.leaf(3), ignores, fnHash, globalFn, varHash, globalVar);
    temp = ignore(node.leaf(3), ignores, index);
    s += temp.res;
    index = temp.index;
    temp = ignore(node.leaf(4), ignores, index);
    s += temp.res;
    index = temp.index;
    exprstmt(node.leaf(5), ignores, fnHash, globalFn, varHash, globalVar);
    temp = ignore(node.leaf(5), ignores, index);
    s += temp.res;
    index = temp.index;
    temp = ignore(node.leaf(6), ignores, index);
    s += temp.res;
    index = temp.index;
    block = node.leaf(7);
    if(res) {
      //block的{
      temp = ignore(block.first(), ignores, index);
      s += temp.res;
      index = temp.index;
      res = s;
    }
  }
  return { res, index };
};