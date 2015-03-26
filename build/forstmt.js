var homunculus=require('homunculus');

var join=function(){var _0=require('./join');return _0.hasOwnProperty("join")?_0.join:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();
var exprstmt=function(){var _2=require('./exprstmt');return _2.hasOwnProperty("exprstmt")?_2.exprstmt:_2.hasOwnProperty("default")?_2.default:_2}();
var Tree=function(){var _3=require('./Tree');return _3.hasOwnProperty("Tree")?_3.Tree:_3.hasOwnProperty("default")?_3.default:_3}();
var preVar=function(){var _4=require('./preVar');return _4.hasOwnProperty("preVar")?_4.preVar:_4.hasOwnProperty("default")?_4.default:_4}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

function checkLine(s, first) {
  return first ? s : s.replace(/\n/g, '');
}

exports.default=function forstmt(node, ignores, index, varHash, globalVar, fnHash, globalFn, styleHash, styleTemp, selectorStack, map, first, file) {
  //循环引用fix
  if(Tree.hasOwnProperty('default')) {
    Tree = Tree.default;
  }
  //标明首次循环
  var first2 = true;
  //忽略掉整个for节点
  ignore(node, ignores, index);
  var temp = node.leaf(3);
  var isIn = temp && temp.isToken() && temp.token().content() == 'in';
  var isOf = !isIn && temp && temp.isToken() && temp.token().content() == 'of';
  var block;
  var res = '';
  //保存索引，存储空白符
  var temp = ignore(node.first(), ignores, index);
  var s = checkLine(temp.res, first && first2);
  index = temp.index;
  temp = ignore(node.leaf(1), ignores, index);
  s += checkLine(temp.res, first && first2);
  index = temp.index;
  if(isIn) {
    //忽略3个语句
    temp = ignore(node.leaf(2), ignores, index);
    s += checkLine(temp.res, first && first2);
    index = temp.index;
    temp = ignore(node.leaf(3), ignores, index);
    s += checkLine(temp.res, first && first2);
    index = temp.index;
    temp = ignore(node.leaf(4), ignores, index);
    s += checkLine(temp.res, first && first2);
    index = temp.index;
    //)
    temp = ignore(node.leaf(5), ignores, index);
    s += checkLine(temp.res, first && first2);
    index = temp.index;
    //block
    block = node.leaf(6);
    //区分首次循环，后续忽略换行和初始化
    var k = node.leaf(2).token().content().replace(/^[$@]\{?/, '').replace(/}$/, '');
    var arr = exprstmt(node.leaf(4), fnHash, globalFn, varHash, globalVar, file);
    var tIndex;
    for(var i = 0, lens = arr.length; i < lens; i++) {
      //block的{
      if(first2) {
        temp = ignore(block.first(), ignores, index);
        s += checkLine(temp.res, first && first2);
        index = temp.index;
        res = s;
        tIndex = index;
      }
      //for in中每次赋值给健变量
      varHash[k] = {
        value: i,
        unit: ''
      };
      //block内容
      for(var j = 1, len = block.size(); j < len - 1; j++) {
        var tree = new Tree(
          ignores,
          tIndex,
          varHash,
          globalVar,
          fnHash,
          globalFn,
          styleHash,
          styleTemp,
          selectorStack,
          map,
          true,
          first,
          file
        );
        temp = tree.join(block.leaf(j));
        res += checkLine(temp.res, first && first2);
        index = temp.index;
      }
      //block的}
      temp = ignore(block.last(), ignores, index);
      res += checkLine(temp.res, first && first2);
      index = temp.index;
      first = first2 = false;
    }
  }
  else if(isOf) {
    //忽略3个语句
    temp = ignore(node.leaf(2), ignores, index);
    s += checkLine(temp.res, first && first2);
    index = temp.index;
    temp = ignore(node.leaf(3), ignores, index);
    s += checkLine(temp.res, first && first2);
    index = temp.index;
    temp = ignore(node.leaf(4), ignores, index);
    s += checkLine(temp.res, first && first2);
    index = temp.index;
    //)
    temp = ignore(node.leaf(5), ignores, index);
    s += checkLine(temp.res, first && first2);
    index = temp.index;
    //block
    block = node.leaf(6);
    //区分首次循环，后续忽略换行和初始化
    var k = node.leaf(2).token().content().replace(/^[$@]\{?/, '').replace(/}$/, '');
    var arr = exprstmt(node.leaf(4), fnHash, globalFn, varHash, globalVar, file);
    var tIndex;
    for(var i = 0, lens = arr.length; i < lens; i++) {
      //block的{
      if(first2) {
        temp = ignore(block.first(), ignores, index);
        s += checkLine(temp.res, first && first2);
        index = temp.index;
        res = s;
        tIndex = index;
      }
      //for in中每次赋值给健变量
      varHash[k] = {
        value: arr[i],
        unit: ''
      };
      //block内容
      for(var j = 1, len = block.size(); j < len - 1; j++) {
        var tree = new Tree(
          ignores,
          tIndex,
          varHash,
          globalVar,
          fnHash,
          globalFn,
          styleHash,
          styleTemp,
          selectorStack,
          map,
          true,
          first,
          file
        );
        temp = tree.join(block.leaf(j));
        res += checkLine(temp.res, first && first2);
        index = temp.index;
      }
      //block的}
      temp = ignore(block.last(), ignores, index);
      res += checkLine(temp.res, first && first2);
      index = temp.index;
      first = first2 = false;
    }
  }
  else {
    //执行for的3个语句，判断是否循环用最后1个
    //先进行第1个赋值语句，可能为空
    if(node.leaf(2).name() == Node.VARSTMT) {
      preVar(node.leaf(2), ignores, index, varHash, globalVar);
    }
    temp = ignore(node.leaf(2), ignores, index);
    s += checkLine(temp.res, first && first2);
    index = temp.index;
    //第2个判断语句
    temp = ignore(node.leaf(3), ignores, index);
    s += checkLine(temp.res, first && first2);
    index = temp.index;
    var loop = exprstmt(node.leaf(3), fnHash, globalFn, varHash, globalVar, file);
    temp = ignore(node.leaf(4), ignores, index);
    s += checkLine(temp.res, first && first2);
    index = temp.index;
    //第3个循环执行
    temp = ignore(node.leaf(5), ignores, index);
    s += checkLine(temp.res, first && first2);
    index = temp.index;
    //)
    temp = ignore(node.leaf(6), ignores, index);
    s += checkLine(temp.res, first && first2);
    index = temp.index;
    //{block}
    block = node.leaf(7);
    //区分首次循环，后续忽略换行和初始化
    var tIndex;
    while(loop) {
      if(first2) {
        //block的{
        temp = ignore(block.first(), ignores, index);
        s += checkLine(temp.res, first && first2);
        index = temp.index;
        res = s;
        tIndex = index;
      }
      //block内容
      for(var j = 1, len = block.size(); j < len - 1; j++) {
        var tree = new Tree(
          ignores,
          tIndex,
          varHash,
          globalVar,
          fnHash,
          globalFn,
          styleHash,
          styleTemp,
          selectorStack,
          map,
          true,
          first,
          file
        );
        temp = tree.join(block.leaf(j));
        res += checkLine(temp.res, first && first2);
        index = temp.index;
      }
      //block的}
      temp = ignore(block.last(), ignores, index);
      //非首次无法行对齐，删除所有\n
      res += first ? temp.res : temp.res.replace(/\n/g, '');
      index = temp.index;
      //执行循环exprstmt2，判断循环是否继续
      exprstmt(node.leaf(5), fnHash, globalFn, varHash, globalVar, file);
      loop = exprstmt(node.leaf(3), fnHash, globalFn, varHash, globalVar, file);
      first = first2 = false;
    }
  }
  return { res:res, index:index };
};