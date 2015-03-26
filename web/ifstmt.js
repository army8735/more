define(function(require, exports, module){var homunculus=require('homunculus');

var join=function(){var _0=require('./join');return _0.hasOwnProperty("join")?_0.join:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();
var exprstmt=function(){var _2=require('./exprstmt');return _2.hasOwnProperty("exprstmt")?_2.exprstmt:_2.hasOwnProperty("default")?_2.default:_2}();
var Tree=function(){var _3=require('./Tree');return _3.hasOwnProperty("Tree")?_3.Tree:_3.hasOwnProperty("default")?_3.default:_3}();

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
  var res = exprstmt(expr, fnHash, globalFn, varHash, globalVar);
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
  return { res:res, index:index };
};});