define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _0=require('./join');return _0.hasOwnProperty("join")?_0.join:_0.hasOwnProperty("default")?_0.default:_0}();
var ignore=function(){var _1=require('./ignore');return _1.hasOwnProperty("ignore")?_1.ignore:_1.hasOwnProperty("default")?_1.default:_1}();
var Fn=function(){var _2=require('./Fn');return _2.hasOwnProperty("Fn")?_2.Fn:_2.hasOwnProperty("default")?_2.default:_2}();

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

exports.default=function(node, ignores, index, fnHash, globalFn, varHash, globanVar) {
  var name = node.first().token().content();
  var fn = fnHash[name] || globalFn[name];
  if(fn) {
    ignore(node, ignores, index);
    while(ignores[++index]){}
    while(ignores[++index]){}
    var res = fn.compile(node.leaf(1), ignores, index, varHash, globanVar).trim().replace(/;$/, '').replace(/\n/g, '');
    var next = node.next();
    //fnc之后没有;号，除非跟着}结束，否则加上
    if(!next
      || next.name() != Node.TOKEN
      || next.token().content() != '}') {
      res += ';';
    }
    return res;
  }
  return '';
}
});