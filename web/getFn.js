define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _26=require('./join');return _26.hasOwnProperty("join")?_26.join:_26.hasOwnProperty("default")?_26.default:_26}();
var ignore=function(){var _27=require('./ignore');return _27.hasOwnProperty("ignore")?_27.ignore:_27.hasOwnProperty("default")?_27.default:_27}();
var Fn=function(){var _28=require('./Fn');return _28.hasOwnProperty("Fn")?_28.Fn:_28.hasOwnProperty("default")?_28.default:_28}();

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

exports.default=function(node, ignores, index, fnHash, globalFn, varHash, globanVar) {
  var name = node.first().token().content();
  var fn = fnHash[name] || globalFn[name];
  if(fn) {
    ignore(node, ignores, index);
    var res = fn.compile(node.leaf(1), varHash, globanVar).trim().replace(/;$/, '').replace(/\n/g, '');
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