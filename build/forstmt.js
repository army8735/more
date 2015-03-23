var homunculus=require('homunculus');

var join=function(){var _0=require('./join');return _0.hasOwnProperty("join")?_0.join:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();
var exprstmt=function(){var _2=require('./exprstmt');return _2.hasOwnProperty("exprstmt")?_2.exprstmt:_2.hasOwnProperty("default")?_2.default:_2}();
var Tree=function(){var _3=require('./Tree');return _3.hasOwnProperty("Tree")?_3.Tree:_3.hasOwnProperty("default")?_3.default:_3}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

exports.default=function forstmt(node, ignores, index, varHash, globalVar, fnHash, globalFn, styleHash, styleTemp, selectorStack, map) {
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
      //block内容
      for(var j = 1, len = block.size(); j < len - 1; j++) {
        var tree = new Tree(
          ignores,
          index,
          varHash,
          globalVar,
          fnHash,
          globalFn,
          styleHash,
          styleTemp,
          selectorStack,
          map,
          true
        );
        temp = tree.join(block.leaf(j));
        res += temp.res;
        index = temp.index;
      }
      //block的}
      temp = ignore(block.last(), ignores, index);
      res += temp.res;
      index = temp.index;
    }
  }
  return { res:res, index:index };
};