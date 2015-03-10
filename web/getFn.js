define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _0=require('./join');return _0.hasOwnProperty("join")?_0.join:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();
var Fn=function(){var _2=require('./Fn');return _2.hasOwnProperty("Fn")?_2.Fn:_2.hasOwnProperty("default")?_2.default:_2}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

exports.default=function(node, ignores, index, fnHash, globalFn, varHash, globalVar) {
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
});