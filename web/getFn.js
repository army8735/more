define(function(require, exports, module){var homunculus=require('homunculus');
var join=function(){var _27=require('./join');return _27.hasOwnProperty("join")?_27.join:_27.hasOwnProperty("default")?_27.default:_27}();
var ignore=function(){var _28=require('./ignore');return _28.hasOwnProperty("ignore")?_28.ignore:_28.hasOwnProperty("default")?_28.default:_28}();
var Fn=function(){var _29=require('./Fn');return _29.hasOwnProperty("Fn")?_29.Fn:_29.hasOwnProperty("default")?_29.default:_29}();

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