define(function(require, exports, module){var homunculus=require('homunculus');

var join=function(){var _0=require('./join');return _0.hasOwnProperty("join")?_0.join:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();
var exprstmt=function(){var _2=require('./exprstmt');return _2.hasOwnProperty("exprstmt")?_2.exprstmt:_2.hasOwnProperty("default")?_2.default:_2}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

exports.default=function(node, ignores, index, fnHash, globalFn, varHash, globalVar) {
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
};});