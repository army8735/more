define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();

var join=function(){var _1=require('./join');return _1.hasOwnProperty("join")?_1.join:_1.hasOwnProperty("default")?_1.default:_1}();
var ignore=function(){var _2=require('./ignore');return _2.hasOwnProperty("ignore")?_2.ignore:_2.hasOwnProperty("default")?_2.default:_2}();
var exprstmt=function(){var _3=require('./exprstmt');return _3.hasOwnProperty("exprstmt")?_3.exprstmt:_3.hasOwnProperty("default")?_3.default:_3}();
var Tree=function(){var _4=require('./Tree');return _4.hasOwnProperty("Tree")?_4.Tree:_4.hasOwnProperty("default")?_4.default:_4}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

exports.default=function ifstmt(node, ignores, index, varHash, globalVar, fnHash, globalFn, styleHash, styleTemp, selectorStack, map, first, file) {
  //循环引用fix
  if(Tree.hasOwnProperty('default')) {
    Tree = Tree.default;
  }
  //忽略掉整个if节点
  ignore(node, ignores, index);
  //保存索引，存储空白符
  var temp = ignore(node.first(), ignores, index);
  var s = temp.res;
  index = temp.index;
  temp = ignore(node.leaf(1), ignores, index);
  s += temp.res;
  index = temp.index;
  temp = ignore(node.leaf(2), ignores, index);
  s += temp.res;
  index = temp.index;
  temp = ignore(node.leaf(3), ignores, index);
  s += temp.res;
  index = temp.index;
  var block = node.leaf(4);
  //计算if的表达式
  var expr = node.leaf(2);
  var res = exprstmt(expr, varHash, globalVar);
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
        true,
        first,
        file
      );
      temp = tree.join(block.leaf(j));
      res += temp.res;
      index = temp.index;
    }
    //block的}
    temp = ignore(block.last(), ignores, index);
    res += temp.res;
    index = temp.index;
    //忽略掉后面的@else内容
    var next = block.next();
    while(next) {
      temp = ignore(next, ignores, index);
      res += temp.res;
      index = temp.index;
      next = next.next();
    }
  }
  else if(block.next()) {
    //if中没进入的block
    temp = ignore(block, ignores, index);
    s += temp.res;
    index = temp.index;

    var next = block.next();
    //@else
    if(next.name() == Node.TOKEN && next.token().content() == '@else') {
      temp = ignore(next, ignores, index);
      s += temp.res;
      index = temp.index;
      block = next.next();
      temp = ignore(block.first(), ignores, index);
      s += temp.res;
      index = temp.index;
      res = s;
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
          true,
          first,
          file
        );
        temp = tree.join(block.leaf(j));
        res += temp.res;
        index = temp.index;
      }
      temp = ignore(block.last(), ignores, index);
      res += temp.res;
      index = temp.index;
    }
    //@elseif
    else {
      res = s;
      temp = ifstmt(next, ignores, index, varHash, globalVar, fnHash, globalFn, styleHash, styleTemp, selectorStack, map);
      res += temp.res;
      index = temp.index;
    }
  }
  else {
    res = s;
  }
  return { res:res, index:index };
};});