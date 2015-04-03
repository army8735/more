define(function(require, exports, module){var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0.default:_0}();
var join=function(){var _1=require('./join');return _1.hasOwnProperty("join")?_1.join:_1.hasOwnProperty("default")?_1.default:_1}();
var ignore=function(){var _2=require('./ignore');return _2.hasOwnProperty("ignore")?_2.ignore:_2.hasOwnProperty("default")?_2.default:_2}();
var Fn=function(){var _3=require('./Fn');return _3.hasOwnProperty("Fn")?_3.Fn:_3.hasOwnProperty("default")?_3.default:_3}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

exports.default=function(node, ignores, index, fnHash, globalFn, varHash, globalVar) {
  var name = node.first().token().content();
  var fn = fnHash[name] || globalFn[name];
  if(fn) {
    var i = index;
    while(ignores[++i]){}
    while(ignores[++i]){}
    var res = fn.compile(node.leaf(1), ignores, i, varHash, globalVar).trim().replace(/\n/g, '');
    return res;
  }
  return join(node, ignores, index).str;
}
});